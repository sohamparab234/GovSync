import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const artifactDir = 'C:\\Users\\Soham Parab\\.gemini\\antigravity\\brain\\d929ac14-8417-4300-b750-02815ffa25f2';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';

console.log('--- Phase 3 Day 5: RTS Deadline & Escalation Assistant Browser Verification ---');

// 1. Authenticate as Citizen DEMO-1001 (Asha Patil)
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
const profileDir = 'C:\\temp\\cdp_profile_day5_' + Date.now();
console.log('2. Launching headless Chrome with remote debugging on port 9226...');
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9226',
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
const versionRes = await fetch('http://127.0.0.1:9226/json/version');
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

// Set Session Cookie for authenticated access
await sendSession('Network.setCookie', {
  name: 'govsync_session',
  value: sessionValue,
  domain: '127.0.0.1',
  path: '/',
  httpOnly: true,
  sameSite: 'Lax',
});

async function evaluate(expression) {
  const res = await sendSession('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) {
    throw new Error('Evaluation exception: ' + JSON.stringify(res.exceptionDetails));
  }
  return res.result.value;
}

async function setViewport(width, height) {
  await sendSession('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
}

async function takeScreenshot(filePath) {
  const { data } = await sendSession('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
}

try {
  // TEST A: Navigate to Public Standalone Route /rts
  console.log('\n--- A. Navigating to Public Standalone Route /rts ---');
  await setViewport(1280, 1000);
  await sendSession('Page.navigate', { url: `${base}/rts` });
  await new Promise((r) => setTimeout(r, 2500));

  // 1. Verify Page Title and Masthead
  const pageTitle = await evaluate('document.title');
  console.log('   Page Title:', pageTitle);
  assert.ok(pageTitle.includes('RTS') || pageTitle.includes('GovSync'), 'Page title must include RTS or GovSync');

  // 2. Verify Main Heading
  const mainHeading = await evaluate('document.getElementById("rts-title")?.innerText || ""');
  console.log('   Main Heading:', mainHeading);
  assert.ok(
    mainHeading.includes('RTS') || mainHeading.includes('Right to Public Services'),
    'Main heading must identify RTS Deadline Assistant'
  );

  // 3. Verify Non-Representation Notice
  const disclaimerText = await evaluate('document.querySelector(".rts-disclaimer-callout")?.innerText || ""');
  console.log('   Disclaimer present:', disclaimerText.length > 20);
  assert.ok(disclaimerText.includes('informational') || disclaimerText.includes('GovSync'), 'Must include disclaimer');

  // 4. Verify Statutory Escalation Hierarchy section is present
  const hasEscalationSection = await evaluate('!!document.getElementById("rts-escalation-heading")');
  console.log('   Escalation section present:', hasEscalationSection);
  assert.ok(hasEscalationSection, 'Must include Statutory Escalation Hierarchy section');

  // 5. Verify Aaple Sarkar Official Portal link exists
  const aapleSarkarLink = await evaluate(`
    (() => {
      const links = Array.from(document.querySelectorAll('a[href*="aaplesarkar.mahaonline.gov.in"]'));
      return links.length > 0;
    })()
  `);
  console.log('   Aaple Sarkar official portal link exists:', aapleSarkarLink);
  assert.ok(aapleSarkarLink, 'Aaple Sarkar portal link must be present');

  // 6. Capture Desktop Screenshot
  const desktopSsPath = path.join(artifactDir, 'rts-desktop.png');
  await takeScreenshot(desktopSsPath);
  console.log('   ✓ Desktop screenshot saved:', desktopSsPath);

  // TEST B: Responsive Viewports & 0px Overflow Check
  console.log('\n--- B. Testing Responsive Viewports & Zero Overflow ---');

  // 1. Tablet Viewport (768px)
  await setViewport(768, 1024);
  await new Promise((r) => setTimeout(r, 600));
  const tabletOverflow = await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  console.log('   Tablet (768px) horizontal overflow:', tabletOverflow, 'px');
  assert.equal(tabletOverflow, 0, 'Tablet viewport must have 0px overflow');
  const tabletSsPath = path.join(artifactDir, 'rts-tablet.png');
  await takeScreenshot(tabletSsPath);
  console.log('   ✓ Tablet screenshot saved:', tabletSsPath);

  // 2. Mobile Viewport (375px)
  await setViewport(375, 667);
  await new Promise((r) => setTimeout(r, 600));
  const mobileOverflow = await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  console.log('   Mobile (375px) horizontal overflow:', mobileOverflow, 'px');
  assert.equal(mobileOverflow, 0, 'Mobile viewport must have 0px overflow');
  const mobileSsPath = path.join(artifactDir, 'rts-mobile-375.png');
  await takeScreenshot(mobileSsPath);
  console.log('   ✓ Mobile 375px screenshot saved:', mobileSsPath);

  // 3. Small Mobile Viewport (320px)
  await setViewport(320, 568);
  await new Promise((r) => setTimeout(r, 600));
  const smallMobileOverflow = await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  console.log('   Small Mobile (320px) horizontal overflow:', smallMobileOverflow, 'px');
  assert.equal(smallMobileOverflow, 0, 'Small mobile viewport must have 0px overflow');
  const smallMobileSsPath = path.join(artifactDir, 'rts-mobile-320.png');
  await takeScreenshot(smallMobileSsPath);
  console.log('   ✓ Small Mobile 320px screenshot saved:', smallMobileSsPath);

  // TEST C: In-Memory Dynamic Language Switching
  console.log('\n--- C. Testing Trilingual In-Memory Dynamic Switching ---');
  await setViewport(1280, 1000);

  // Switch to Hindi
  console.log('   Switching to Hindi (hi)...');
  const hiVal = await evaluate(`
    (() => {
      const sel = document.querySelector('.login-language select');
      if (!sel) return 'NO_SELECT';
      for (const opt of sel.options) opt.selected = (opt.value === 'hi');
      sel.selectedIndex = 1;
      sel.value = 'hi';
      sel.dispatchEvent(new Event('input', { bubbles: true }));
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return sel.value;
    })()
  `);
  console.log('   Hindi select value:', hiVal);
  await new Promise((r) => setTimeout(r, 1500));

  const hindiHeading = await evaluate('document.getElementById("rts-title")?.innerText || ""');
  console.log('   Hindi Heading:', hindiHeading);
  assert.ok(hindiHeading.includes('समय-सीमा') || hindiHeading.includes('आरटीएस'), 'Hindi heading verified');

  const hindiSsPath = path.join(artifactDir, 'rts-hindi.png');
  await takeScreenshot(hindiSsPath);
  console.log('   ✓ Hindi screenshot saved:', hindiSsPath);

  // Switch to Marathi
  console.log('   Switching to Marathi (mr)...');
  const mrVal = await evaluate(`
    (() => {
      const sel = document.querySelector('.login-language select');
      if (!sel) return 'NO_SELECT';
      for (const opt of sel.options) opt.selected = (opt.value === 'mr');
      sel.selectedIndex = 2;
      sel.value = 'mr';
      sel.dispatchEvent(new Event('input', { bubbles: true }));
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      return sel.value;
    })()
  `);
  console.log('   Marathi select value:', mrVal);
  await new Promise((r) => setTimeout(r, 1500));

  const marathiHeading = await evaluate('document.getElementById("rts-title")?.innerText || ""');
  console.log('   Marathi Heading:', marathiHeading);
  assert.ok(marathiHeading.includes('कालमर्यादा') || marathiHeading.includes('आरटीएस'), 'Marathi heading verified');

  const marathiSsPath = path.join(artifactDir, 'rts-marathi.png');
  await takeScreenshot(marathiSsPath);
  console.log('   ✓ Marathi screenshot saved:', marathiSsPath);

  // Switch back to English
  await evaluate(`
    (() => {
      const sel = document.querySelector('.login-language select');
      if (sel) {
        sel.value = 'en';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 1000));

  // TEST D: Authenticated Citizen Dashboard Integration
  console.log('\n--- D. Testing Citizen Dashboard RTS Integration ---');
  await sendSession('Page.navigate', { url: `${base}/` });
  await new Promise((r) => setTimeout(r, 2500));

  // 1. Verify RTS Quick Action card exists
  const hasRtsQuickAction = await evaluate(`
    (() => {
      const cards = Array.from(document.querySelectorAll('.quick-action-card'));
      return cards.some(c => c.getAttribute('data-action') === 'rts' || c.classList.contains('tone-5') || c.innerText.includes('RTS') || c.innerText.includes('आरटीएस'));
    })()
  `);
  console.log('   Quick action card for RTS:', hasRtsQuickAction);
  assert.ok(hasRtsQuickAction, 'Quick action card for RTS must exist on Citizen Dashboard');

  // 2. Click RTS Quick Action card to navigate in-app
  console.log('   Clicking RTS Quick Action card...');
  const clickRes = await evaluate(`
    (() => {
      const btn = document.querySelector('.quick-action-card[data-action="rts"]') || Array.from(document.querySelectorAll('.quick-action-card')).find(c => c.innerText.includes('RTS'));
      if (!btn) return 'NO_RTS_BTN';
      btn.click();
      return 'CLICKED';
    })()
  `);
  console.log('   Quick action click result:', clickRes);
  await new Promise((r) => setTimeout(r, 1500));

  // 3. Verify in-app RTS assistant rendered
  const inAppRtsHeading = await evaluate('document.getElementById("rts-title")?.innerText || ""');
  console.log('   In-app RTS Heading after click:', inAppRtsHeading);
  assert.ok(
    inAppRtsHeading.includes('RTS') || inAppRtsHeading.includes('Right to Public Services'),
    'In-app heading must display RTS assistant'
  );

  // 4. Verify application deadline cards are displayed
  const deadlineCardsCount = await evaluate('document.querySelectorAll(".rts-deadline-card").length');
  console.log('   Rendered RTS deadline cards count:', deadlineCardsCount);
  assert.ok(deadlineCardsCount > 0, 'Must render application deadline cards for citizen applications');

  // TEST E: Zero Console Errors Check
  console.log('\n--- E. Verifying Browser Console Error Log ---');
  console.log('   Recorded Console Errors Count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('   Console Errors found:', consoleErrors);
  }
  assert.equal(consoleErrors.length, 0, 'Expected 0 browser console errors');
  console.log('   ✓ Zero browser console errors recorded throughout the session.');

  console.log('\nPASS: All browser verification checks PASSED cleanly for RTS Deadline & Escalation Assistant!');
} finally {
  cleanup();
}
