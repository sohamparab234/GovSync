import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const artifactDir = 'C:\\Users\\Soham Parab\\.gemini\\antigravity\\brain\\d929ac14-8417-4300-b750-02815ffa25f2';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';

console.log('--- Phase 3 Day 7: Maharashtra District & Government Office Directory Browser Verification ---');

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
const profileDir = 'C:\\temp\\cdp_profile_day7_' + Date.now();
console.log('2. Launching headless Chrome with remote debugging on port 9228...');
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9228',
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
const versionRes = await fetch('http://127.0.0.1:9228/json/version');
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

async function checkHorizontalOverflow(viewportName) {
  const overflow = await evaluate(`
    (() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      return { docW, winW, hasOverflow: docW > winW };
    })()
  `);
  console.log(`   [Overflow Check ${viewportName}]: docWidth=${overflow.docW}, winWidth=${overflow.winW}`);
  assert.ok(!overflow.hasOverflow, `Horizontal overflow detected in ${viewportName}: ${overflow.docW}px > ${overflow.winW}px`);
}

try {
  // =========================================================================
  // TEST A: PUBLIC STANDALONE ROUTE /directory
  // =========================================================================
  console.log('\n--- A. Navigating to Public Standalone Route /directory ---');
  await setViewport(1280, 900);
  await sendSession('Page.navigate', { url: `${base}/directory` });
  await new Promise((r) => setTimeout(r, 3000));

  // 1. Verify Page Title
  const pageTitle = await evaluate('document.title');
  console.log('   Page Title:', pageTitle);
  assert.ok(pageTitle.includes('Directory') || pageTitle.includes('GovSync'), 'Page title must include Directory or GovSync');

  // 2. Verify Non-Representation Notice
  const disclaimerExists = await evaluate(`
    document.body.innerText.includes('coordination and tracking portal') ||
    document.body.innerText.includes('independent directory') ||
    document.body.innerText.includes('official portals')
  `);
  console.log('   Non-representation disclaimer present:', disclaimerExists);
  assert.ok(disclaimerExists, 'Non-representation disclaimer must be visible');

  // 3. Verify Initial Office Cards Count
  let initialCardsCount = 0;
  for (let i = 0; i < 20; i++) {
    initialCardsCount = await evaluate(`document.querySelectorAll('.directory-office-card').length`);
    if (initialCardsCount > 0) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log(`   Initial office cards rendered: ${initialCardsCount}`);
  assert.ok(initialCardsCount >= 20, 'At least 20 office cards should render initially');

  // 4. Verify 36 District Administrative Portals
  const districtLinksCount = await evaluate(`document.querySelectorAll('a[href*="gov.in"], a[href*="nic.in"]').length`);
  console.log(`   Official district & office links rendered: ${districtLinksCount}`);
  assert.ok(districtLinksCount >= 36, 'All 36 district official portals must be accessible');

  // 5. Test Search Input: Type "Collector"
  console.log('   Testing search input with query "Collector"...');
  await evaluate(`
    (() => {
      const input = document.querySelector('input[type="search"]');
      if (input) {
        const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        inputSetter.call(input, 'Collector');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  const filteredCollectorCount = await evaluate(`document.querySelectorAll('.directory-office-card').length`);
  console.log(`   Filtered cards for "Collector": ${filteredCollectorCount}`);
  assert.ok(filteredCollectorCount > 0 && filteredCollectorCount < initialCardsCount, 'Collector search must narrow down results');

  // 6. Test District Dropdown Filter: Select "Pune"
  console.log('   Filtering by District: Pune...');
  await evaluate(`
    (() => {
      const select = document.getElementById('filter-district');
      if (select) {
        const selectSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
        selectSetter.call(select, 'Pune');
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  const puneCollectorCount = await evaluate(`document.querySelectorAll('.directory-office-card').length`);
  console.log(`   Filtered cards for Pune + "Collector": ${puneCollectorCount}`);
  assert.ok(puneCollectorCount >= 1 && puneCollectorCount <= filteredCollectorCount, 'Pune Collectorate should be visible');

  // 7. Test Office Card Expansion (View Details)
  console.log('   Expanding office details...');
  const expandResult = await evaluate(`
    (() => {
      const expandBtn = document.querySelector('.directory-expand-btn');
      if (!expandBtn) return { error: 'No .directory-expand-btn found' };
      expandBtn.click();
      return { success: true, text: expandBtn.innerText };
    })()
  `);
  console.log('   Expand button clicked:', expandResult);
  await new Promise((r) => setTimeout(r, 600));

  const detailsExpanded = await evaluate(`
    document.body.innerText.includes('Office Timings') ||
    document.body.innerText.includes('Jurisdiction') ||
    document.body.innerText.includes('Talukas')
  `);
  console.log('   Office details expanded:', detailsExpanded);
  assert.ok(detailsExpanded, 'Office details should expand with timings, jurisdiction, and address');

  // 8. Test Clear Filters Button
  console.log('   Clicking "Clear Filters"...');
  await evaluate(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const clearBtn = buttons.find(b => b.innerText.includes('Clear') || b.innerText.includes('पुसा') || b.innerText.includes('साफ़'));
      if (clearBtn) clearBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  const restoredCardsCount = await evaluate(`document.querySelectorAll('.directory-office-card').length`);
  console.log(`   Cards count after clearing filters: ${restoredCardsCount}`);
  assert.equal(restoredCardsCount, initialCardsCount, 'Filters should be reset to initial cards count');

  // =========================================================================
  // TEST B: RESPONSIVE VIEWPORTS & ZERO OVERFLOW
  // =========================================================================
  console.log('\n--- B. Testing Responsive Viewports & Capturing Artifacts ---');

  // 1. Desktop (1280px)
  await setViewport(1280, 900);
  await new Promise((r) => setTimeout(r, 500));
  await checkHorizontalOverflow('Desktop 1280px');
  const desktopPath = path.join(artifactDir, 'directory-desktop.png');
  await takeScreenshot(desktopPath);
  console.log('   Saved artifact:', desktopPath);

  // 2. Tablet (768px)
  await setViewport(768, 1024);
  await new Promise((r) => setTimeout(r, 500));
  await checkHorizontalOverflow('Tablet 768px');
  const tabletPath = path.join(artifactDir, 'directory-tablet.png');
  await takeScreenshot(tabletPath);
  console.log('   Saved artifact:', tabletPath);

  // 3. Mobile (375px)
  await setViewport(375, 812);
  await new Promise((r) => setTimeout(r, 500));
  await checkHorizontalOverflow('Mobile 375px');
  const mobile375Path = path.join(artifactDir, 'directory-mobile-375.png');
  await takeScreenshot(mobile375Path);
  console.log('   Saved artifact:', mobile375Path);

  // 4. Small Mobile (320px)
  await setViewport(320, 568);
  await new Promise((r) => setTimeout(r, 500));
  await checkHorizontalOverflow('Small Mobile 320px');
  const mobile320Path = path.join(artifactDir, 'directory-mobile-320.png');
  await takeScreenshot(mobile320Path);
  console.log('   Saved artifact:', mobile320Path);

  // =========================================================================
  // TEST C: TRILINGUAL LOCALIZATION (HINDI & MARATHI)
  // =========================================================================
  console.log('\n--- C. Testing Trilingual Localization ---');
  await setViewport(1280, 900);

  // Switch to Hindi
  console.log('   Switching to Hindi (हिन्दी)...');
  await evaluate(`
    (() => {
      const sel = document.querySelector('.login-language select, select[aria-label*="Language"]');
      if (sel) {
        const selectSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
        selectSetter.call(sel, 'hi');
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  const hindiTextVerified = await evaluate(`
    document.body.innerText.includes('निर्देशिका') ||
    document.body.innerText.includes('सरकारी कार्यालय') ||
    document.body.innerText.includes('सभी 36 जिले')
  `);
  console.log('   Hindi text rendered:', hindiTextVerified);
  assert.ok(hindiTextVerified, 'Hindi translation must render properly');
  const hindiPath = path.join(artifactDir, 'directory-hindi.png');
  await takeScreenshot(hindiPath);
  console.log('   Saved artifact:', hindiPath);

  // Switch to Marathi
  console.log('   Switching to Marathi (मराठी)...');
  await evaluate(`
    (() => {
      const sel = document.querySelector('.login-language select, select[aria-label*="Language"]');
      if (sel) {
        const selectSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
        selectSetter.call(sel, 'mr');
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  const marathiTextVerified = await evaluate(`
    document.body.innerText.includes('निर्देशिका') ||
    document.body.innerText.includes('शासकीय कार्यालय') ||
    document.body.innerText.includes('सरकारी कार्यालय') ||
    document.body.innerText.includes('जिल्हे')
  `);
  console.log('   Marathi text rendered:', marathiTextVerified);
  assert.ok(marathiTextVerified, 'Marathi translation must render properly');
  const marathiPath = path.join(artifactDir, 'directory-marathi.png');
  await takeScreenshot(marathiPath);
  console.log('   Saved artifact:', marathiPath);

  // Switch back to English
  await evaluate(`
    (() => {
      const sel = document.querySelector('.login-language select, select[aria-label*="Language"]');
      if (sel) {
        const selectSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
        selectSetter.call(sel, 'en');
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 400));
  await new Promise((r) => setTimeout(r, 400));

  // =========================================================================
  // TEST D: INTEGRATED CITIZEN PORTAL & DASHBOARD QUICK ACTION
  // =========================================================================
  console.log('\n--- D. Testing Integrated Citizen Portal & Dashboard ---');
  await sendSession('Page.navigate', { url: `${base}/` });
  await new Promise((r) => setTimeout(r, 2500));

  // 1. Verify Citizen Dashboard Loaded
  const dashboardHeading = await evaluate('document.querySelector("h1, h2")?.innerText || ""');
  console.log('   Portal Heading:', dashboardHeading);

  // 2. Verify Dashboard Quick Action Card (tone-7: Government Office Directory)
  const quickActionExists = await evaluate(`
    (() => {
      const cards = Array.from(document.querySelectorAll('.quick-action-card, .tone-7'));
      return cards.some(c => c.innerText.includes('Directory') || c.innerText.includes('कार्यालय') || c.innerText.includes('Government Office'));
    })()
  `);
  console.log('   Dashboard Quick Action card (tone-7) present:', quickActionExists);
  assert.ok(quickActionExists, 'Dashboard Quick Action card for Directory must be present');

  // 3. Click tone-7 Quick Action Card to navigate to Directory
  console.log('   Clicking tone-7 Quick Action card to navigate to Directory...');
  await evaluate(`
    (() => {
      const card = document.querySelector('.quick-action-card.tone-7, [data-action="directory"]');
      if (card) card.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1000));

  // 4. Verify Integrated Directory View Rendered in Citizen Workspace
  const integratedDirectoryRendered = await evaluate(`
    document.querySelector('.directory-container') !== null ||
    document.querySelector('.directory-office-card') !== null
  `);
  console.log('   Integrated Directory view rendered in Citizen Workspace:', integratedDirectoryRendered);
  assert.ok(integratedDirectoryRendered, 'Integrated Directory view should render in Citizen Workspace');

  // 5. Click Brand / Home button to return to Dashboard view
  console.log('   Returning to Dashboard view via Brand button...');
  await evaluate(`
    (() => {
      const brandBtn = document.querySelector('header button.brand, button.brand');
      if (brandBtn) brandBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1000));

  // =========================================================================
  // TEST E: CONSOLE AUDIT
  // =========================================================================
  console.log('\n--- E. Browser Console Errors Audit ---');
  console.log(`   Total console errors recorded: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('   Console Errors:', consoleErrors);
  }
  assert.equal(consoleErrors.length, 0, 'No console errors allowed during browser interaction');

  console.log('\n✓ PASS: All browser interaction and visual tests passed successfully!');

} finally {
  cleanup();
}
