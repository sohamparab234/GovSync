import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const artifactDir = 'C:\\Users\\Soham Parab\\.gemini\\antigravity\\brain\\d929ac14-8417-4300-b750-02815ffa25f2';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';

console.log('--- Phase 3 Day 8: Agriculture & Farmer Service Hub Browser Verification ---');

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
const profileDir = 'C:\\temp\\cdp_profile_day8_' + Date.now();
console.log('2. Launching headless Chrome with remote debugging on port 9229...');
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9229',
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
const versionRes = await fetch('http://127.0.0.1:9229/json/version');
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
await sendSession('DOM.enable');
await sendSession('Network.enable');

// Set Session Cookie for authenticated routes
await sendSession('Network.setCookie', {
  name: 'govsync_session',
  value: sessionValue,
  domain: '127.0.0.1',
  path: '/',
  httpOnly: true,
  secure: false,
});

async function evaluate(expression) {
  const res = await sendSession('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) {
    throw new Error('Evaluation failed: ' + JSON.stringify(res.exceptionDetails));
  }
  return res.result.value;
}

async function captureScreenshot(filename) {
  const { data } = await sendSession('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(data, 'base64');
  const targetPath = path.join(artifactDir, filename);
  fs.writeFileSync(targetPath, buffer);
  console.log(`   Captured artifact: ${filename} (${buffer.length} bytes)`);
}

async function setViewport(width, height) {
  await sendSession('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
  await sendSession('Emulation.setVisibleSize', { width, height });
  await new Promise((r) => setTimeout(r, 400));
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
  // ============================================================================
  // STEP 1: Desktop Viewport (1280px) on /agriculture
  // ============================================================================
  console.log('\n4. Navigating to /agriculture (Desktop 1280px)...');
  await setViewport(1280, 900);
  await sendSession('Page.navigate', { url: `${base}/agriculture` });
  await new Promise((r) => setTimeout(r, 2500));

  // Verify page title and heading
  const title = await evaluate(`document.title`);
  console.log('   Page Title:', title);
  assert.ok(title.includes('Agriculture'), 'Title must mention Agriculture');

  const h1Text = await evaluate(`document.querySelector('h1')?.innerText`);
  console.log('   H1 Heading:', h1Text);
  assert.equal(h1Text, 'Agriculture & Farmer Service Hub');

  // Check stats row
  const statsValues = await evaluate(`
    Array.from(document.querySelectorAll('section.panel strong'))
      .map(el => el.innerText.trim())
      .filter(t => t.includes('+') || t === '10' || t.includes('%'))
  `);
  console.log('   Stats Values:', statsValues);
  assert.ok(statsValues.length >= 2, 'Stats row must display verified counts');

  // Check horizontal overflow at 1280px
  await checkHorizontalOverflow('Desktop (1280px)');
  await captureScreenshot('agriculture-desktop.png');

  // ============================================================================
  // STEP 2: Interactive Filtering & Search
  // ============================================================================
  console.log('\n5. Testing search and interactive filtering...');

  // Search for "tractor" using prototype setter
  await evaluate(`
    (() => {
      const input = document.querySelector('input[type="text"]');
      if (input) {
        const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        inputSetter.call(input, 'tractor');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  const tractorResultsCount = await evaluate(`document.querySelectorAll('article.panel').length`);
  console.log('   Cards matching "tractor":', tractorResultsCount);
  assert.ok(tractorResultsCount >= 1 && tractorResultsCount <= 4, 'Tractor search must filter items');

  // Clear search by clicking clear button
  await evaluate(`
    (() => {
      const clearBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Clear Filters'));
      if (clearBtn) clearBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  const resetCount = await evaluate(`document.querySelectorAll('article.panel').length`);
  console.log('   Cards after filter reset:', resetCount);
  assert.ok(resetCount >= 18, 'Reset must restore full catalogue');

  // Click "Irrigation & Water" category button
  console.log('\n6. Testing category click filter (Irrigation)...');
  await evaluate(`
    (() => {
      const catButtons = Array.from(document.querySelectorAll('button'));
      const irrigationBtn = catButtons.find(b => b.innerText.includes('Irrigation & Water') || b.innerText.includes('Irrigation'));
      if (irrigationBtn) irrigationBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  const irrigationCount = await evaluate(`document.querySelectorAll('article.panel').length`);
  console.log('   Cards in Irrigation category:', irrigationCount);
  assert.ok(irrigationCount >= 2, 'Irrigation category must show at least 2 schemes');

  // ============================================================================
  // STEP 3: Interactive Detail Modal / Drawer
  // ============================================================================
  console.log('\n7. Testing detail modal / drawer...');

  // Click first "View Details & Criteria" button
  await evaluate(`
    (() => {
      const detailBtns = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('View Details & Criteria'));
      if (detailBtns[0]) detailBtns[0].click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 800));

  const modalVisible = await evaluate(`Boolean(document.querySelector('div[role="dialog"]'))`);
  assert.ok(modalVisible, 'Detail modal must open and have role="dialog"');

  const modalSchemeTitle = await evaluate(`document.querySelector('#modal-scheme-title')?.innerText`);
  console.log('   Modal Scheme Title:', modalSchemeTitle);
  assert.ok(modalSchemeTitle && modalSchemeTitle.length > 0, 'Modal must display scheme title');

  // Check modal sections: Benefits, Eligibility, Documents, Process
  const hasBenefits = await evaluate(`document.body.innerText.includes('Statutory Benefits & Financial Assistance')`);
  const hasEligibility = await evaluate(`document.body.innerText.includes('Eligibility Criteria')`);
  const hasDocuments = await evaluate(`document.body.innerText.includes('Required Documents Checklist')`);
  const hasProcess = await evaluate(`document.body.innerText.includes('Step-by-Step Application Process')`);

  assert.ok(hasBenefits, 'Modal must contain Statutory Benefits');
  assert.ok(hasEligibility, 'Modal must contain Eligibility Criteria');
  assert.ok(hasDocuments, 'Modal must contain Required Documents Checklist');
  assert.ok(hasProcess, 'Modal must contain Step-by-Step Application Process');

  // Close modal via Escape key
  await sendSession('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise((r) => setTimeout(r, 500));
  const modalClosed = await evaluate(`!document.querySelector('div[role="dialog"]')`);
  assert.ok(modalClosed, 'Modal must close on Escape key');

  // Reset category filter
  await evaluate(`
    (() => {
      const clearBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Clear Filters'));
      if (clearBtn) clearBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 500));

  // ============================================================================
  // STEP 4: Language Switching (Hindi & Marathi)
  // ============================================================================
  console.log('\n8. Testing Hindi language switching...');
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
  await new Promise((r) => setTimeout(r, 800));

  const hindiHeading = await evaluate(`document.querySelector('h1')?.innerText`);
  console.log('   Heading in Hindi:', hindiHeading);
  assert.equal(hindiHeading, 'कृषि एवं किसान सेवा केंद्र', 'Heading must translate to Hindi');
  await captureScreenshot('agriculture-hindi.png');

  console.log('\n9. Testing Marathi language switching...');
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
  await new Promise((r) => setTimeout(r, 800));

  const marathiHeading = await evaluate(`document.querySelector('h1')?.innerText`);
  console.log('   Heading in Marathi:', marathiHeading);
  assert.equal(marathiHeading, 'कृषी व शेतकरी सेवा केंद्र', 'Heading must translate to Marathi');
  await captureScreenshot('agriculture-marathi.png');

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
  await new Promise((r) => setTimeout(r, 800));

  // ============================================================================
  // STEP 5: Responsive Viewports & Horizontal Overflow Check (0px)
  // ============================================================================
  console.log('\n10. Testing Tablet viewport (768px)...');
  await setViewport(768, 1024);
  await checkHorizontalOverflow('Tablet (768px)');
  await captureScreenshot('agriculture-tablet.png');

  console.log('\n11. Testing Mobile viewport (375px)...');
  await setViewport(375, 812);
  await checkHorizontalOverflow('Mobile (375px)');
  await captureScreenshot('agriculture-mobile-375.png');

  console.log('\n12. Testing Small Mobile viewport (320px)...');
  await setViewport(320, 658);
  await checkHorizontalOverflow('Small Mobile (320px)');
  await captureScreenshot('agriculture-mobile-320.png');

  // ============================================================================
  // STEP 6: Citizen Dashboard Quick Action Integration (tone-8)
  // ============================================================================
  console.log('\n13. Testing Citizen Dashboard Quick Action navigation...');
  await setViewport(1280, 900);
  await sendSession('Page.navigate', { url: `${base}/` });
  await new Promise((r) => setTimeout(r, 2500));

  // Check tone-8 quick action card on dashboard
  const hasTone8Card = await evaluate(`
    Boolean(document.querySelector('button.quick-action-card.tone-8[data-action="agriculture"]'))
  `);
  console.log('    Has tone-8 agriculture quick-action card:', hasTone8Card);
  assert.ok(hasTone8Card, 'Citizen dashboard must render tone-8 agriculture quick-action card');

  // Click tone-8 quick action card
  await evaluate(`
    const card = document.querySelector('button.quick-action-card.tone-8[data-action="agriculture"]');
    if (card) card.click();
  `);
  await new Promise((r) => setTimeout(r, 1200));

  const embeddedHubVisible = await evaluate(`
    Boolean(document.querySelector('.agriculture-embedded-view') || document.body.innerText.includes('Agriculture & Farmer Service Hub'))
  `);
  console.log('    Embedded Agriculture Hub visible in workspace:', embeddedHubVisible);
  assert.ok(embeddedHubVisible, 'Clicking quick-action card must load Agriculture Hub in citizen workspace');

  // ============================================================================
  // STEP 7: Assert 0 Console Errors
  // ============================================================================
  console.log('\n14. Checking console errors...');
  console.log('    Console errors captured:', consoleErrors);
  assert.equal(consoleErrors.length, 0, 'No console errors allowed during verification');

  console.log('\n--- BROWSER VERIFICATION PASSED WITH 0 CONSOLE ERRORS & 0px OVERFLOW! ---');

  cleanup();
  process.exit(0);
} catch (err) {
  console.error('Browser test failed:', err);
  cleanup();
  process.exit(1);
}
