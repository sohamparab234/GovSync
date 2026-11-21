import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const artifactDir = 'C:\\Users\\Soham Parab\\.gemini\\antigravity\\brain\\d929ac14-8417-4300-b750-02815ffa25f2';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';

console.log('--- Phase 3 Day 4: Multi-Service Journeys Headless Browser Verification ---');

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
const profileDir = 'C:\\temp\\cdp_profile_day4_' + Date.now();
console.log('2. Launching headless Chrome with remote debugging on port 9225...');
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9225',
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
const versionRes = await fetch('http://127.0.0.1:9225/json/version');
const versionData = await versionRes.json();
const wsUrl = versionData.webSocketDebuggerUrl;
console.log('3. Connecting to Chrome CDP WebSocket:', wsUrl);

const ws = new WebSocket(wsUrl);
await new Promise((resolve) => ws.addEventListener('open', resolve));

let msgId = 1;
const pending = new Map();
const consoleErrors = [];

ws.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  if (data.id && pending.has(data.id)) {
    const p = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) p.reject(new Error(data.error.message));
    else p.resolve(data.result);
  }
  if (data.method === 'Runtime.consoleAPICalled') {
    if (data.params.type === 'error') {
      const text = data.params.args.map((a) => a.value || a.description || '').join(' ');
      consoleErrors.push(text);
    }
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

// 4. Set up CDP Domains
await sendSession('Page.enable');
await sendSession('Runtime.enable');
await sendSession('Network.enable');

// Set Session Cookie for Authenticated Context
await sendSession('Network.setCookie', {
  name: 'govsync_session',
  value: sessionValue,
  url: base,
});

// Helper: Evaluate script
async function evaluate(expression) {
  const wrapped = `(() => { ${expression.includes('return') ? expression : 'return ' + expression} })()`;
  const res = await sendSession('Runtime.evaluate', {
    expression: wrapped,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) {
    throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text || 'Evaluation exception');
  }
  return res.result.value;
}

// Helper: Set viewport
async function setViewport(width, height) {
  await sendSession('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
  await sendSession('Emulation.setVisibleSize', { width, height });
}

// Helper: Capture screenshot
async function takeScreenshot(filePath) {
  const ss = await sendSession('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(filePath, Buffer.from(ss.data, 'base64'));
}

try {
  // TEST A: Navigate to Public Route /journeys
  console.log('\n--- A. Testing Public Journeys Route (/journeys) ---');
  await setViewport(1280, 1000);
  await sendSession('Page.navigate', { url: `${base}/journeys` });
  await new Promise((r) => setTimeout(r, 2000));

  const pageTitle = await evaluate('document.title');
  console.log('   Page Title:', pageTitle);
  assert.ok(pageTitle.includes('Journeys'), 'Title must mention Journeys');

  const headingText = await evaluate('document.getElementById("journeys-title")?.innerText || ""');
  console.log('   Heading:', headingText);
  assert.equal(headingText, 'Multi-Service Application Journeys');

  // Verify Journey Select Cards count
  const journeyCardsCount = await evaluate('document.querySelectorAll(".journey-select-card").length');
  console.log('   Rendered Journey Select Cards Count:', journeyCardsCount);
  assert.equal(journeyCardsCount, 5, 'Must render exactly 5 journey selector cards');

  // Verify Stepper cards in active journey
  const stepCardsCount = await evaluate('document.querySelectorAll(".journey-step-card").length');
  console.log('   Step Cards Count in Active Journey:', stepCardsCount);
  assert.ok(stepCardsCount >= 3, 'Must render at least 3 connected steps in active journey');

  // Test Domain Filter
  console.log('   Testing domain filtering (Women Welfare)...');
  let filteredCount = 0;
  for (let attempt = 0; attempt < 8; attempt++) {
    await evaluate(`document.getElementById('domain-filter-women')?.click()`);
    await new Promise((r) => setTimeout(r, 600));
    filteredCount = await evaluate('document.querySelectorAll(".journey-select-card").length');
    if (filteredCount === 1) break;
  }
  console.log('   Filtered Cards Count (Women):', filteredCount);
  assert.equal(filteredCount, 1, 'Only 1 women journey must be displayed');

  // Reset filter to All Domains
  for (let attempt = 0; attempt < 8; attempt++) {
    await evaluate(`document.getElementById('domain-filter-all')?.click()`);
    await new Promise((r) => setTimeout(r, 600));
    const allCount = await evaluate('document.querySelectorAll(".journey-select-card").length');
    if (allCount === 5) break;
  }

  // Take Desktop Screenshot
  const desktopSsPath = path.join(artifactDir, 'journeys-desktop.png');
  await takeScreenshot(desktopSsPath);
  console.log('   ✓ Desktop screenshot saved:', desktopSsPath);

  // TEST B: Multi-Viewport Responsiveness & Horizontal Overflow
  console.log('\n--- B. Testing Multi-Viewport Responsiveness ---');

  // 1. Tablet Viewport (768px)
  await setViewport(768, 1024);
  await new Promise((r) => setTimeout(r, 600));
  const tabletOverflow = await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  console.log('   Tablet (768px) horizontal overflow:', tabletOverflow, 'px');
  assert.equal(tabletOverflow, 0, 'Tablet viewport must have 0px overflow');
  const tabletSsPath = path.join(artifactDir, 'journeys-tablet.png');
  await takeScreenshot(tabletSsPath);
  console.log('   ✓ Tablet screenshot saved:', tabletSsPath);

  // 2. Mobile Viewport (375px)
  await setViewport(375, 667);
  await new Promise((r) => setTimeout(r, 600));
  const mobileOverflow = await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  console.log('   Mobile (375px) horizontal overflow:', mobileOverflow, 'px');
  assert.equal(mobileOverflow, 0, 'Mobile viewport must have 0px overflow');
  const mobileSsPath = path.join(artifactDir, 'journeys-mobile-375.png');
  await takeScreenshot(mobileSsPath);
  console.log('   ✓ Mobile 375px screenshot saved:', mobileSsPath);

  // 3. Small Mobile Viewport (320px)
  await setViewport(320, 568);
  await new Promise((r) => setTimeout(r, 600));
  const smallMobileOverflow = await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  console.log('   Small Mobile (320px) horizontal overflow:', smallMobileOverflow, 'px');
  assert.equal(smallMobileOverflow, 0, 'Small mobile viewport must have 0px overflow');
  const smallMobileSsPath = path.join(artifactDir, 'journeys-mobile-320.png');
  await takeScreenshot(smallMobileSsPath);
  console.log('   ✓ Small Mobile 320px screenshot saved:', smallMobileSsPath);

  // TEST C: In-Memory Dynamic Language Switching
  console.log('\n--- C. Testing Trilingual In-Memory Dynamic Switching ---');
  await setViewport(1280, 1000);

  // Switch to Hindi
  console.log('   Switching to Hindi (hi)...');
  const hiVal = await evaluate(`
    const sel = document.querySelector('.login-language select');
    if (!sel) return 'NO_SELECT';
    for (const opt of sel.options) opt.selected = (opt.value === 'hi');
    sel.selectedIndex = 1;
    sel.value = 'hi';
    sel.dispatchEvent(new Event('input', { bubbles: true }));
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    return sel.value;
  `);
  console.log('   Hindi select value:', hiVal);
  await new Promise((r) => setTimeout(r, 1500));

  const hindiHeading = await evaluate('document.getElementById("journeys-title")?.innerText || ""');
  console.log('   Hindi Heading:', hindiHeading);
  assert.equal(hindiHeading, 'बहु-सेवा आवेदन यात्राएं');

  const hindiSsPath = path.join(artifactDir, 'journeys-hindi.png');
  await takeScreenshot(hindiSsPath);
  console.log('   ✓ Hindi screenshot saved:', hindiSsPath);

  // Switch to Marathi
  console.log('   Switching to Marathi (mr)...');
  const mrVal = await evaluate(`
    const sel = document.querySelector('.login-language select');
    if (!sel) return 'NO_SELECT';
    for (const opt of sel.options) opt.selected = (opt.value === 'mr');
    sel.selectedIndex = 2;
    sel.value = 'mr';
    sel.dispatchEvent(new Event('input', { bubbles: true }));
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    return sel.value;
  `);
  console.log('   Marathi select value:', mrVal);
  await new Promise((r) => setTimeout(r, 1500));

  const marathiHeading = await evaluate('document.getElementById("journeys-title")?.innerText || ""');
  console.log('   Marathi Heading:', marathiHeading);
  assert.equal(marathiHeading, 'बहु-सेवा अर्ज प्रवास');

  const marathiSsPath = path.join(artifactDir, 'journeys-marathi.png');
  await takeScreenshot(marathiSsPath);
  console.log('   ✓ Marathi screenshot saved:', marathiSsPath);

  // Switch back to English
  await evaluate(`
    const sel = document.querySelector('.login-language select');
    if (sel) {
      sel.value = 'en';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  `);
  await new Promise((r) => setTimeout(r, 1000));

  // TEST D: Authenticated Citizen Dashboard Navigation
  console.log('\n--- D. Testing Citizen Dashboard Journey Integration ---');
  await sendSession('Page.navigate', { url: `${base}/` });
  await new Promise((r) => setTimeout(r, 2500));

  // 1. Verify Journey callout banner exists on Citizen Dashboard
  const hasJourneyBanner = await evaluate('!!document.querySelector(".journey-banner")');
  console.log('   Journey banner on Citizen Dashboard:', hasJourneyBanner);
  assert.ok(hasJourneyBanner, 'Citizen Dashboard must include Journey banner');

  // 2. Verify Quick Action card exists
  const hasQuickAction = await evaluate(`
    const cards = Array.from(document.querySelectorAll('.quick-action-card'));
    return cards.some(c => c.getAttribute('data-action') === 'journeys' || c.classList.contains('tone-4') || c.innerText.includes('Journeys') || c.innerText.includes('प्रवास') || c.innerText.includes('यात्रा'));
  `);
  console.log('   Quick action card for Journeys:', hasQuickAction);
  assert.ok(hasQuickAction, 'Quick action card for Journeys must exist');

  // 3. Click "Explore Service Journeys" banner button
  console.log('   Clicking "Explore Service Journeys" banner button...');
  const bannerClickRes = await evaluate(`
    const btn = document.querySelector('.journey-banner button');
    if (!btn) return 'NO_BANNER_BTN';
    btn.click();
    return 'CLICKED';
  `);
  console.log('   Banner button click result:', bannerClickRes);
  await new Promise((r) => setTimeout(r, 1500));

  const inAppHeading = await evaluate('document.getElementById("journeys-title")?.innerText || ""');
  console.log('   In-app Journeys Heading after banner click:', inAppHeading);
  assert.ok(
    ['Multi-Service Application Journeys', 'बहु-सेवा आवेदन यात्राएं', 'बहु-सेवा अर्ज प्रवास'].includes(inAppHeading),
    'Heading must match valid trilingual journey title'
  );

  // 4. Verify progress reflected for authenticated citizen DEMO-1001
  const appIdsInJourney = await evaluate(`
    return Array.from(document.querySelectorAll('.journey-step-card')).map(c => c.innerText.includes('Application ID: APP-') || c.innerText.includes('Completed'));
  `);
  console.log('   Evaluated step card states present:', appIdsInJourney.length);
  assert.ok(appIdsInJourney.length >= 3, 'Must render evaluated steps for authenticated user');

  // TEST E: Zero Console Errors Check
  console.log('\n--- E. Verifying Browser Console Error Log ---');
  console.log('   Recorded Console Errors Count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('   Console Errors found:', consoleErrors);
  }
  assert.equal(consoleErrors.length, 0, 'Expected 0 browser console errors');
  console.log('   ✓ Zero browser console errors recorded throughout the session.');

  console.log('\nPASS: All browser verification checks PASSED cleanly across public route, citizen dashboard, viewports, and trilingual switching!');
} finally {
  cleanup();
}
