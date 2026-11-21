import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const artifactDir = 'C:\\Users\\Soham Parab\\.gemini\\antigravity\\brain\\d929ac14-8417-4300-b750-02815ffa25f2';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';

console.log('--- Phase 3 Day 2: Headless Browser Quality Verification ---');

// 1. Authenticate as Citizen DEMO-1001 (Asha Sharma)
console.log('1. Authenticating as DEMO-1001...');
const authRes = await fetch(`${base}/api/auth/demo`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: base },
  body: JSON.stringify({ citizenId: 'DEMO-1001' }),
});
assert.equal(authRes.status, 200, 'Authentication failed');
const rawCookies = authRes.headers.getSetCookie();
let sessionValue = '';
for (const c of rawCookies) {
  const match = c.match(/govsync_session=([^;]+)/);
  if (match) sessionValue = match[1];
}
assert.ok(sessionValue, 'govsync_session cookie missing');

// 2. Launch headless Chrome with CDP
const profileDir = 'C:\\temp\\cdp_profile_day2_' + Date.now();
console.log('2. Launching headless Chrome with remote debugging on port 9223...');
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9223',
  `--user-data-dir=${profileDir}`,
  '--window-size=1280,1024',
  'about:blank',
]);

let killed = false;
function cleanup() {
  if (!killed) {
    killed = true;
    try { chrome.kill(); } catch {}
    try { fs.rmSync(profileDir, { recursive: true, force: true }); } catch {}
  }
}
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(1); });

await new Promise((r) => setTimeout(r, 2000));

// 3. Connect to WebSocket
const versionRes = await fetch('http://127.0.0.1:9223/json/version');
const versionData = await versionRes.json();
const wsUrl = versionData.webSocketDebuggerUrl;
console.log('3. Connecting to Chrome CDP WebSocket:', wsUrl);

const ws = new WebSocket(wsUrl);
await new Promise((resolve) => ws.addEventListener('open', resolve));

let msgId = 1;
const pending = new Map();
const consoleErrors = [];

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.method === 'Runtime.consoleAPICalled') {
    if (msg.params.type === 'error') {
      const text = msg.params.args.map((a) => a.value || JSON.stringify(a)).join(' ');
      consoleErrors.push(text);
    }
  }
  if (msg.method === 'Runtime.exceptionThrown') {
    const desc = msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text;
    consoleErrors.push(desc);
  }
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(msg.error);
    else resolve(msg.result);
  }
});

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const curId = msgId++;
    pending.set(curId, { resolve, reject });
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
}

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

function sendSession(method, params = {}) {
  return new Promise((resolve, reject) => {
    const curId = msgId++;
    pending.set(curId, { resolve, reject });
    ws.send(JSON.stringify({ id: curId, sessionId, method, params }));
  });
}

await sendSession('Page.enable');
await sendSession('Network.enable');
await sendSession('Runtime.enable');

// Set cookie for base URL
await sendSession('Network.setCookie', {
  name: 'govsync_session',
  value: sessionValue,
  url: base,
});

async function evalExpr(expression) {
  const wrapped = `(() => { ${expression.includes('return') ? expression : 'return ' + expression} })()`;
  const res = await sendSession('Runtime.evaluate', { expression: wrapped, returnByValue: true, awaitPromise: true });
  if (res.exceptionDetails) {
    console.error('Eval error details:', res.exceptionDetails.exception?.description || res.exceptionDetails.text);
    throw new Error('Evaluation failed: ' + (res.exceptionDetails.exception?.description || res.exceptionDetails.text));
  }
  return res.result.value;
}

// -------------------------------------------------------------
// CHECK 1: Desktop Viewport (1280 x 1000) - Initial State
// -------------------------------------------------------------
console.log('4. Testing Desktop Viewport (1280px)...');
await sendSession('Emulation.setDeviceMetricsOverride', {
  width: 1280,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
});

await sendSession('Page.navigate', { url: `${base}/` });
await new Promise((r) => setTimeout(r, 2500));

// Verify Header & Overview
const welcomeText = await evalExpr("document.querySelector('#dashboard-overview-heading')?.textContent || ''");
console.log('   Welcome text:', welcomeText);
assert.ok(welcomeText.includes('Welcome') || welcomeText.includes('स्वागत'), 'Welcome heading missing');

// Verify Citizen profile box
const profileInfo = await evalExpr(`
  const p = document.querySelector('.citizen-profile-box');
  return p ? p.innerText : '';
`);
assert.ok(profileInfo.includes('DEMO-1001') || profileInfo.includes('Verified Citizen'), 'Profile box info missing');

// Verify 4 Application Summary Cards
const cardStats = await evalExpr(`
  return Array.from(document.querySelectorAll('.dashboard-stat-card')).map(card => {
    const title = card.querySelector('span')?.textContent?.trim() || '';
    const num = card.querySelector('.number')?.textContent?.trim() || '';
    return { title, num };
  });
`);
console.log('   Summary Cards:', cardStats);
assert.equal(cardStats.length, 4, 'Must display exactly 4 summary metric cards');
assert.ok(cardStats.some(c => c.title.includes('Total Applications')));
assert.ok(cardStats.some(c => c.title.includes('In Progress')));
assert.ok(cardStats.some(c => c.title.includes('Action Required')));
assert.ok(cardStats.some(c => c.title.includes('Completed')));

// Verify Quick Actions
const quickActionCount = await evalExpr("document.querySelectorAll('.quick-action-card').length");
assert.ok(quickActionCount >= 4, 'Must display quick action shortcut cards');

// Verify My Applications Section
const myAppsHeading = await evalExpr("document.querySelector('#my-apps-heading')?.textContent || ''");
assert.ok(myAppsHeading.includes('My Applications'), 'My Applications heading missing');

// Verify Deadlines Section
const deadlinesHeading = await evalExpr("document.querySelector('#deadlines-heading')?.textContent || ''");
assert.ok(deadlinesHeading.includes('Upcoming Deadlines'), 'Deadlines heading missing');

// Verify Recent Activity Section
const activityHeading = await evalExpr("document.querySelector('#recent-activity-heading')?.textContent || ''");
assert.ok(activityHeading.includes('Recent Activity'), 'Recent Activity heading missing');

// Verify Recommended Services Section
const recHeading = await evalExpr("document.querySelector('#recommended-heading')?.textContent || ''");
assert.ok(recHeading.includes('Recommended Services'), 'Recommended Services heading missing');
const recCount = await evalExpr("document.querySelectorAll('.recommended-card').length");
assert.equal(recCount, 4, 'Must display 4 recommended services');

// Verify Complete Service Catalogue Section
const allServicesHeading = await evalExpr("document.querySelector('#all-services-heading')?.textContent || ''");
assert.ok(allServicesHeading.includes('services') || allServicesHeading.includes('सेवा'), 'All Services heading missing');

// -------------------------------------------------------------
// CHECK 2: Create Application & Test Active Application State
// -------------------------------------------------------------
console.log('5. Creating an application to test active application dashboard state...');
const cookieHeader = `govsync_session=${sessionValue}`;
const newAppRes = await fetch(`${base}/api/applications`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: base, Cookie: cookieHeader },
  body: JSON.stringify({
    service: 'scholarship',
    citizenId: 'DEMO-1001',
    scopes: ['identity', 'education', 'income', 'residence'],
    accepted: true,
  }),
});
assert.equal(newAppRes.status, 201, 'Application creation failed');
const newAppData = await newAppRes.json();
const appId = newAppData.application.id;
console.log('   Created test application:', appId);

// Refresh browser page to reflect newly created application
await sendSession('Page.navigate', { url: `${base}/` });
await new Promise((r) => setTimeout(r, 2000));

// Verify summary card count updated
const updatedCards = await evalExpr(`
  return Array.from(document.querySelectorAll('.dashboard-stat-card')).map(card => {
    const title = card.querySelector('span')?.textContent?.trim() || '';
    const num = card.querySelector('.number')?.textContent?.trim() || '';
    return { title, num };
  });
`);
console.log('   Updated Summary Cards:', updatedCards);
const totalCard = updatedCards.find(c => c.title.includes('Total Applications'));
assert.ok(Number(totalCard.num) >= 1, 'Total applications count should be at least 1');

// Verify application card rendered with stage progress bar and next action
const appCardCount = await evalExpr("document.querySelectorAll('.app-card').length");
assert.ok(appCardCount >= 1, 'Application card must be displayed in My Applications');

const stageInfo = await evalExpr(`
  const card = document.querySelector('.app-card');
  const stage = card.querySelector('.app-stage-label-row strong')?.textContent?.trim() || '';
  const nextAction = card.querySelector('.next-action-text')?.textContent?.trim() || '';
  return { stage, nextAction };
`);
console.log('   Stage Info on App Card:', stageInfo);
assert.ok(stageInfo.stage.includes('Stage 1'), 'Draft application must show Stage 1');
assert.ok(stageInfo.nextAction.length > 0, 'Next action must be present');

// Test Status Tab Filter to an empty status (Action Required) to verify empty search/filter state
console.log('   Testing status filter pills and empty filter state...');
const pillInfo = await evalExpr(`
  const buttons = Array.from(document.querySelectorAll('.status-pill-btn'));
  return buttons.map(b => b.textContent);
`);
console.log('   Status pills found:', pillInfo);
await evalExpr(`
  const buttons = Array.from(document.querySelectorAll('.status-pill-btn'));
  const actionReqTab = buttons.find(b => b.textContent && b.textContent.includes('Action Required'));
  if (actionReqTab) {
    actionReqTab.click();
    return 'CLICKED';
  }
  return 'NOT_FOUND';
`);
await new Promise((r) => setTimeout(r, 1000));

const emptyText = await evalExpr(`
  const el = document.querySelector('.my-apps-body .dashboard-empty-state');
  return el ? el.innerText : 'NOT_FOUND: ' + (document.querySelector('.my-apps-body')?.innerText || '');
`);
console.log('   Empty text on 0-match status filter:', emptyText);
assert.ok(emptyText.includes('No matching applications'), 'Empty state should appear when filter matches 0 applications');

// Click "Clear filters" button in empty state
console.log('   Clicking Clear filters button...');
const clearResult = await evalExpr(`
  const clearBtn = document.querySelector('.my-apps-body .dashboard-empty-state button');
  if (!clearBtn) return 'BUTTON_NOT_FOUND';
  clearBtn.click();
  return 'CLICKED: ' + clearBtn.textContent;
`);
console.log('   Clear button execution:', clearResult);
await new Promise((r) => setTimeout(r, 1000));

const restoredAppCount = await evalExpr("document.querySelectorAll('.app-card').length");
console.log('   Restored Application Cards Count after Clear filters:', restoredAppCount);
assert.ok(restoredAppCount >= 1, 'Applications should be restored after clicking Clear filters');

// Test In Progress status filter
await evalExpr(`
  const buttons = Array.from(document.querySelectorAll('.status-pill-btn'));
  const progTab = buttons.find(b => b.textContent && b.textContent.includes('In Progress'));
  if (progTab) progTab.click();
`);
await new Promise((r) => setTimeout(r, 400));
const inProgressAppCount = await evalExpr("document.querySelectorAll('.app-card').length");
assert.ok(inProgressAppCount >= 1, 'In Progress filter should include applications');

// Click back to All
await evalExpr(`
  const buttons = Array.from(document.querySelectorAll('.status-pill-btn'));
  const allTab = buttons.find(b => b.textContent && b.textContent.includes('All'));
  if (allTab) allTab.click();
`);
await new Promise((r) => setTimeout(r, 400));

// Transition application to submitted state to test Stage 4 and Application Timeline
console.log('   Running department checks and submitting application for timeline verification...');
for (const dept of ['identity', 'education', 'income', 'residence']) {
  const deptRes = await fetch(`${base}/api/departments/${dept}/DEMO-1001?applicationId=${appId}`, {
    headers: { Cookie: cookieHeader },
  });
  assert.equal(deptRes.status, 200, `Department check ${dept} failed`);
}

const evalRes = await fetch(`${base}/api/applications/${appId}/evaluate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: base, Cookie: cookieHeader },
  body: JSON.stringify({}),
});
assert.equal(evalRes.status, 200, 'Evaluation failed');

const subRes = await fetch(`${base}/api/applications/${appId}/submit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: base, Cookie: cookieHeader },
  body: JSON.stringify({
    email: 'asha@example.test',
    statement: 'Application submitted for higher education scholarship support.',
    confirmed: true,
  }),
});
assert.equal(subRes.status, 200, 'Submit failed');

// Refresh browser page
await sendSession('Page.navigate', { url: `${base}/` });
await new Promise((r) => setTimeout(r, 2000));

// Verify stage updated to Stage 4
const submittedStage = await evalExpr(`
  const card = document.querySelector('.app-card');
  return card.querySelector('.app-stage-label-row strong')?.textContent?.trim() || '';
`);
console.log('   Submitted App Card Stage:', submittedStage);
assert.ok(submittedStage.includes('Stage 4'), 'Submitted application must show Stage 4');

// Test Timeline Navigation: Click "Track timeline"
console.log('   Testing timeline navigation...');
const btnClickInfo = await evalExpr(`
  const btn = document.querySelector('.app-card-actions button');
  if (!btn) return 'NO_BUTTON_FOUND';
  btn.click();
  return 'BUTTON_CLICKED: ' + btn.textContent.trim();
`);
console.log('   Timeline button click:', btnClickInfo);
await new Promise((r) => setTimeout(r, 3000));

const currentDomState = await evalExpr(`
  return {
    hasTimelineContainer: document.querySelector('.application-timeline-container') !== null,
    bodyTextSnippet: document.body.innerText.substring(0, 300),
  };
`);
console.log('   DOM state after timeline click:', currentDomState);
assert.equal(currentDomState.hasTimelineContainer, true, 'Clicking Track timeline must open ApplicationTimeline view');

// Return to Dashboard home
console.log('   Returning to Dashboard home...');
const homeClickRes = await evalExpr(`
  const breadcrumb = document.querySelector('.breadcrumb button');
  const brand = document.querySelector('.brand');
  if (breadcrumb) {
    breadcrumb.click();
    return 'CLICKED_BREADCRUMB';
  } else if (brand) {
    brand.click();
    return 'CLICKED_BRAND';
  }
  return 'NO_HOME_BUTTON';
`);
console.log('   Home click result:', homeClickRes);
await new Promise((r) => setTimeout(r, 2500));

const checkHeading = await evalExpr("document.querySelector('#my-apps-heading')?.textContent || 'HEADING_NOT_FOUND'");
console.log('   Check heading after return to home:', checkHeading);

// Capture Desktop Screenshot with application
console.log('   Capturing Desktop Screenshot...');
const snapDesktop = await sendSession('Page.captureScreenshot', { format: 'png' });
const fileDesktop = path.join(artifactDir, 'citizen-dashboard-desktop.png');
fs.writeFileSync(fileDesktop, Buffer.from(snapDesktop.data, 'base64'));
console.log('   Saved screenshot:', fileDesktop);

// -------------------------------------------------------------
// CHECK 3: Responsive Tablet Viewport (768 x 1024)
// -------------------------------------------------------------
console.log('6. Testing Tablet Viewport (768px)...');
await sendSession('Emulation.setDeviceMetricsOverride', {
  width: 768,
  height: 1024,
  deviceScaleFactor: 1,
  mobile: false,
});
await new Promise((r) => setTimeout(r, 800));

const tabletOverflow = await evalExpr('document.documentElement.scrollWidth > 768');
assert.equal(tabletOverflow, false, 'Tablet viewport has layout overflow');

const snapTablet = await sendSession('Page.captureScreenshot', { format: 'png' });
const fileTablet = path.join(artifactDir, 'citizen-dashboard-tablet.png');
fs.writeFileSync(fileTablet, Buffer.from(snapTablet.data, 'base64'));
console.log('   Saved screenshot:', fileTablet);

// -------------------------------------------------------------
// CHECK 4: Responsive Mobile Viewport (375 x 667)
// -------------------------------------------------------------
console.log('7. Testing Mobile Viewport (375px)...');
await sendSession('Emulation.setDeviceMetricsOverride', {
  width: 375,
  height: 667,
  deviceScaleFactor: 2,
  mobile: true,
});
await new Promise((r) => setTimeout(r, 800));

const mobileOverflow = await evalExpr('document.documentElement.scrollWidth > 375');
assert.equal(mobileOverflow, false, 'Mobile 375px viewport has layout overflow');

const snapMobile375 = await sendSession('Page.captureScreenshot', { format: 'png' });
const fileMobile375 = path.join(artifactDir, 'citizen-dashboard-mobile-375.png');
fs.writeFileSync(fileMobile375, Buffer.from(snapMobile375.data, 'base64'));
console.log('   Saved screenshot:', fileMobile375);

// -------------------------------------------------------------
// CHECK 5: Responsive Small Mobile Viewport (320 x 568)
// -------------------------------------------------------------
console.log('8. Testing Small Mobile Viewport (320px)...');
await sendSession('Emulation.setDeviceMetricsOverride', {
  width: 320,
  height: 568,
  deviceScaleFactor: 2,
  mobile: true,
});
await new Promise((r) => setTimeout(r, 800));

const smallMobileOverflow = await evalExpr('document.documentElement.scrollWidth > 320');
assert.equal(smallMobileOverflow, false, 'Small mobile 320px viewport has layout overflow');

const snapMobile320 = await sendSession('Page.captureScreenshot', { format: 'png' });
const fileMobile320 = path.join(artifactDir, 'citizen-dashboard-mobile-320.png');
fs.writeFileSync(fileMobile320, Buffer.from(snapMobile320.data, 'base64'));
console.log('   Saved screenshot:', fileMobile320);

// -------------------------------------------------------------
// CHECK 6: Trilingual Language Switching (Hindi & Marathi)
// -------------------------------------------------------------
console.log('9. Testing Trilingual Language Switching (Dynamic In-Memory & Persistence)...');
await sendSession('Emulation.setDeviceMetricsOverride', {
  width: 1280,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
});

// A. Switch to Hindi dynamically via LanguageMenu without page reload
console.log('   Switching to Hindi (hi) via LanguageMenu select (no page reload)...');
const selectDebug = await evalExpr(`
  const sel = document.querySelector('.login-language select');
  if (!sel) return { error: 'SELECT_NOT_FOUND', allSelects: Array.from(document.querySelectorAll('select')).map(s => s.className + ' | ' + s.getAttribute('aria-label')) };
  const beforeVal = sel.value;
  for (const opt of sel.options) {
    opt.selected = (opt.value === 'hi');
  }
  sel.value = 'hi';
  sel.dispatchEvent(new Event('input', { bubbles: true }));
  sel.dispatchEvent(new Event('change', { bubbles: true }));
  return { beforeVal, afterVal: sel.value, options: Array.from(sel.options).map(o => o.value + ':' + o.selected) };
`);
console.log('   Select debug info:', selectDebug);
await new Promise((r) => setTimeout(r, 1500));

const hiHeading = await evalExpr("document.querySelector('#my-apps-heading')?.textContent || ''");
console.log('   Hindi My Applications heading:', hiHeading);
assert.ok(hiHeading.includes('मेरे आवेदन'), 'Hindi heading translation missing');

// Verify citizen profile badge updated to Hindi
const hiBadge = await evalExpr("document.querySelector('.citizen-profile-badges')?.textContent || ''");
console.log('   Hindi Citizen Profile Badge:', hiBadge);
assert.ok(hiBadge.includes('डेमो खाता') || hiBadge.includes('नागरिक'), 'Hindi citizen badge missing');

const snapHindi = await sendSession('Page.captureScreenshot', { format: 'png' });
const fileHindi = path.join(artifactDir, 'citizen-dashboard-hindi.png');
fs.writeFileSync(fileHindi, Buffer.from(snapHindi.data, 'base64'));
console.log('   Saved screenshot:', fileHindi);

// B. Switch to Marathi dynamically via LanguageMenu without page reload
console.log('   Switching to Marathi (mr) via LanguageMenu select (no page reload)...');
const mrDebug = await evalExpr(`
  const sel = document.querySelector('.login-language select');
  if (!sel) return { error: 'NO_SEL' };
  const beforeVal = sel.value;
  sel.selectedIndex = 2;
  sel.value = 'mr';
  sel.dispatchEvent(new Event('input', { bubbles: true }));
  sel.dispatchEvent(new Event('change', { bubbles: true }));
  return { beforeVal, afterVal: sel.value, selectedIndex: sel.selectedIndex };
`);
console.log('   Marathi select debug:', mrDebug);
await new Promise((r) => setTimeout(r, 1500));

const mrHeading = await evalExpr("document.querySelector('#my-apps-heading')?.textContent || ''");
console.log('   Marathi My Applications heading:', mrHeading);
assert.ok(mrHeading.includes('माझे अर्ज'), 'Marathi heading translation missing');

// Verify citizen profile badge updated to Marathi
const mrBadge = await evalExpr("document.querySelector('.citizen-profile-badges')?.textContent || ''");
console.log('   Marathi Citizen Profile Badge:', mrBadge);
assert.ok(mrBadge.includes('डेमो खाते') || mrBadge.includes('नागरिक'), 'Marathi citizen badge missing');

const snapMarathi = await sendSession('Page.captureScreenshot', { format: 'png' });
const fileMarathi = path.join(artifactDir, 'citizen-dashboard-marathi.png');
fs.writeFileSync(fileMarathi, Buffer.from(snapMarathi.data, 'base64'));
console.log('   Saved screenshot:', fileMarathi);

// Reset language back to English via select
await evalExpr(`
  const sel = document.querySelector('.login-language select');
  if (sel) {
    for (const opt of sel.options) {
      opt.selected = (opt.value === 'en');
    }
    sel.value = 'en';
    sel.dispatchEvent(new Event('input', { bubbles: true }));
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  }
`);
await new Promise((r) => setTimeout(r, 500));

// -------------------------------------------------------------
// CHECK 7: Console Errors Invariant
// -------------------------------------------------------------
console.log('10. Checking for browser console errors...');
console.log('   Total console errors recorded:', consoleErrors.length);
if (consoleErrors.length > 0) {
  console.error('   Console errors:', consoleErrors);
}
assert.equal(consoleErrors.length, 0, 'Must have zero console errors during browser navigation');

console.log('PASS: All browser verification checks PASSED cleanly across desktop, tablet, mobile, responsive layouts, timeline navigation and Hindi/Marathi!');

cleanup();
process.exit(0);
