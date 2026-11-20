import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const artifactDir = 'C:\\Users\\Soham Parab\\.gemini\\antigravity\\brain\\d929ac14-8417-4300-b750-02815ffa25f2';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';

console.log('--- Phase 3 Day 3: Headless Browser Quality Verification ---');

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
const profileDir = 'C:\\temp\\cdp_profile_day3_' + Date.now();
console.log('2. Launching headless Chrome with remote debugging on port 9224...');
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9224',
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
const versionRes = await fetch('http://127.0.0.1:9224/json/version');
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
  // TEST A: Navigate to Public Route /recommendations
  console.log('\n--- A. Testing Public Recommendations Route (/recommendations) ---');
  await setViewport(1280, 1000);
  await sendSession('Page.navigate', { url: `${base}/recommendations` });
  await new Promise((r) => setTimeout(r, 2000));

  const pageTitle = await evaluate('document.title');
  console.log('   Page Title:', pageTitle);
  assert.ok(pageTitle.includes('Recommendations'), 'Title must mention Recommendations');

  const headingText = await evaluate('document.getElementById("rec-title")?.innerText || ""');
  console.log('   Heading:', headingText);
  assert.equal(headingText, 'Smart Service Recommendations');

  // STEP 1: Select Needs
  console.log('   Selecting Education and Certificates needs...');
  await evaluate(`
    document.getElementById('need-opt-education')?.click();
    document.getElementById('need-opt-certificates')?.click();
  `);
  await new Promise((r) => setTimeout(r, 500));

  // Advance to Step 2
  await evaluate(`document.getElementById('btn-next-step')?.click()`);
  await new Promise((r) => setTimeout(r, 600));

  const step2Heading = await evaluate('document.getElementById("step-title")?.innerText || ""');
  console.log('   Step 2 Heading:', step2Heading);
  assert.ok(step2Heading.toLowerCase().includes('district'), 'Step 2 must ask for district');

  // Advance to Step 3 (Skipping district)
  console.log('   Skipping district step...');
  await evaluate(`(document.getElementById('btn-skip-step') || document.getElementById('btn-next-step'))?.click()`);
  await new Promise((r) => setTimeout(r, 600));

  const step3Heading = await evaluate('document.getElementById("step-title")?.innerText || ""');
  console.log('   Step 3 Heading:', step3Heading);
  assert.ok(step3Heading.toLowerCase().includes('intended for'), 'Step 3 must ask who the service is intended for');

  // Select "Myself"
  console.log('   Selecting "Myself"...');
  await evaluate(`document.getElementById('beneficiary-opt-myself')?.click()`);
  await new Promise((r) => setTimeout(r, 500));

  // Advance to Step 4
  await evaluate(`document.getElementById('btn-next-step')?.click()`);
  await new Promise((r) => setTimeout(r, 600));

  const step4Heading = await evaluate('document.getElementById("step-title")?.innerText || ""');
  console.log('   Step 4 Heading:', step4Heading);
  assert.ok(step4Heading.toLowerCase().includes('accomplish'), 'Step 4 must ask what user wants to accomplish');

  // Select "Find an educational or scholarship opportunity"
  console.log('   Selecting "educational_opportunity"...');
  await evaluate(`document.getElementById('goal-opt-educational_opportunity')?.click()`);
  await new Promise((r) => setTimeout(r, 500));

  // Click "View recommendations"
  console.log('   Clicking "View recommendations"...');
  await evaluate(`document.getElementById('btn-view-recs')?.click()`);
  await new Promise((r) => setTimeout(r, 800));

  // Verify Results Rendered
  const recCardsCount = await evaluate('document.querySelectorAll(".recommendation-item-card").length');
  console.log('   Rendered Recommendation Cards Count:', recCardsCount);
  assert.ok(recCardsCount >= 2, 'Must display at least 2 recommendation cards');

  const topRecHeading = await evaluate('document.querySelector(".recommendations-results-list h3")?.innerText || ""');
  console.log('   Section Heading:', topRecHeading);
  assert.equal(topRecHeading, 'Top recommendations');

  // Take Desktop Screenshot
  const desktopSsPath = path.join(artifactDir, 'recommendations-desktop.png');
  await takeScreenshot(desktopSsPath);
  console.log('   ✓ Desktop screenshot saved:', desktopSsPath);

  // Modal Dialog Verification
  console.log('   Testing Scheme Details Dialog...');
  await evaluate(`document.querySelector('.btn-scheme-details')?.click()`);
  await new Promise((r) => setTimeout(r, 800));

  const modalOpen = await evaluate('!!(document.getElementById("scheme-details-dialog") || document.querySelector(".scheme-dialog-content"))');
  assert.ok(modalOpen, 'Scheme details modal must open on click');
  console.log('   ✓ Scheme Details Dialog opened successfully.');

  // Close Modal
  await evaluate(`(document.getElementById('btn-close-scheme-dialog') || document.querySelector('[data-slot="dialog-close"]'))?.click()`);
  await new Promise((r) => setTimeout(r, 500));

  // TEST B: Multi-Viewport Responsiveness & Horizontal Overflow
  console.log('\n--- B. Testing Multi-Viewport Responsiveness ---');

  // 1. Tablet Viewport (768px)
  await setViewport(768, 1024);
  await new Promise((r) => setTimeout(r, 600));
  const tabletOverflow = await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  console.log('   Tablet (768px) horizontal overflow:', tabletOverflow, 'px');
  assert.equal(tabletOverflow, 0, 'Tablet viewport must have 0px overflow');
  const tabletSsPath = path.join(artifactDir, 'recommendations-tablet.png');
  await takeScreenshot(tabletSsPath);
  console.log('   ✓ Tablet screenshot saved:', tabletSsPath);

  // 2. Mobile Viewport (375px)
  await setViewport(375, 667);
  await new Promise((r) => setTimeout(r, 600));
  const mobileOverflow = await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  console.log('   Mobile (375px) horizontal overflow:', mobileOverflow, 'px');
  assert.equal(mobileOverflow, 0, 'Mobile viewport must have 0px overflow');
  const mobileSsPath = path.join(artifactDir, 'recommendations-mobile-375.png');
  await takeScreenshot(mobileSsPath);
  console.log('   ✓ Mobile 375px screenshot saved:', mobileSsPath);

  // 3. Small Mobile Viewport (320px)
  await setViewport(320, 568);
  await new Promise((r) => setTimeout(r, 600));
  const smallMobileOverflow = await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  console.log('   Small Mobile (320px) horizontal overflow:', smallMobileOverflow, 'px');
  assert.equal(smallMobileOverflow, 0, 'Small mobile viewport must have 0px overflow');
  const smallMobileSsPath = path.join(artifactDir, 'recommendations-mobile-320.png');
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

  const hindiHeading = await evaluate('document.getElementById("rec-title")?.innerText || ""');
  console.log('   Hindi Heading:', hindiHeading);
  assert.equal(hindiHeading, 'स्मार्ट सेवा सिफ़ारिशें');

  const hindiSsPath = path.join(artifactDir, 'recommendations-hindi.png');
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

  const marathiHeading = await evaluate('document.getElementById("rec-title")?.innerText || ""');
  console.log('   Marathi Heading:', marathiHeading);
  assert.equal(marathiHeading, 'स्मार्ट सेवा शिफारशी');

  const marathiSsPath = path.join(artifactDir, 'recommendations-marathi.png');
  await takeScreenshot(marathiSsPath);
  console.log('   ✓ Marathi screenshot saved:', marathiSsPath);

  // TEST D: Authenticated Citizen Dashboard Navigation
  console.log('\n--- D. Testing Citizen Dashboard Recommendation Banner ---');
  await sendSession('Page.navigate', { url: `${base}/` });
  await new Promise((r) => setTimeout(r, 2500));

  const hasRecBanner = await evaluate('!!document.querySelector(".recommendation-banner")');
  console.log('   Recommendation banner on Citizen Dashboard:', hasRecBanner);
  assert.ok(hasRecBanner, 'Citizen Dashboard must include recommendation banner');

  // Click "Get Recommendations" banner button
  console.log('   Clicking "Get Recommendations" banner button...');
  const clickRes = await evaluate(`
    const btn = document.querySelector('.recommendation-banner button');
    if (!btn) return 'NO_BANNER_BTN';
    btn.click();
    return 'CLICKED';
  `);
  console.log('   Banner button click result:', clickRes);
  await new Promise((r) => setTimeout(r, 1500));

  const mainH1 = await evaluate(`Array.from(document.querySelectorAll('h1')).map(h => h.id + ':' + h.innerText)`);
  console.log('   Rendered H1 elements after click:', mainH1);

  const inAppRecTitle = await evaluate('document.getElementById("rec-title")?.innerText || ""');
  console.log('   In-app Recommendations Heading after banner click:', inAppRecTitle);
  assert.ok(inAppRecTitle.length > 0, 'Must navigate to recommendations view in citizen workspace');

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
