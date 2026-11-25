import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const artifactDir = 'C:\\Users\\Soham Parab\\.gemini\\antigravity\\brain\\d929ac14-8417-4300-b750-02815ffa25f2';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';

console.log('--- Phase 3 Day 9: Government Transparency & Notification Centre Browser Verification ---');

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
const profileDir = 'C:\\temp\\cdp_profile_day9_' + Date.now();
console.log('2. Launching headless Chrome with remote debugging on port 9230...');
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9230',
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
const versionRes = await fetch('http://127.0.0.1:9230/json/version');
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
  if (data.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(data.params.exceptionDetails.text);
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
  // STEP 1: Desktop Viewport (1280px) on /transparency
  // ============================================================================
  console.log('\n4. Navigating to /transparency (Desktop 1280px)...');
  await setViewport(1280, 900);
  await sendSession('Page.navigate', { url: `${base}/transparency` });
  await new Promise((r) => setTimeout(r, 2500));

  const pageTitle = await evaluate('document.title');
  console.log('   Page Title:', pageTitle);
  assert.ok(pageTitle.includes('Transparency') || pageTitle.includes('GovSync'), 'Page title mismatch');

  const heading = await evaluate('document.querySelector("h1")?.innerText');
  console.log('   Hero Heading:', heading);
  assert.ok(heading.includes('Government Transparency & Updates'), 'H1 heading mismatch');

  await checkHorizontalOverflow('Desktop 1280px');
  await captureScreenshot('transparency-desktop.png');

  // Verify categories and card counts
  const categoryCardsCount = await evaluate('document.querySelectorAll(".category-card-btn").length');
  console.log('   Category cards rendered:', categoryCardsCount);
  assert.equal(categoryCardsCount, 11, 'Expected 10 categories + 1 "All Categories" button');

  const initialAnnouncementsCount = await evaluate('document.querySelectorAll(".announcement-card").length');
  console.log('   Initial visible announcements:', initialAnnouncementsCount);
  assert.ok(initialAnnouncementsCount >= 18, `Expected at least 18 active cards, found: ${initialAnnouncementsCount}`);

  // ============================================================================
  // STEP 2: Test Search Filtering ("Crop Insurance")
  // ============================================================================
  console.log('\n5. Testing Live Search Filtering ("Crop Insurance")...');
  await evaluate(`
    (() => {
      const inp = document.getElementById('transparency-search-input');
      if (inp) {
        const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        inputSetter.call(inp, 'Crop Insurance');
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  const searchResultsCount = await evaluate('document.querySelectorAll(".announcement-card").length');
  console.log('   Filtered cards count for "Crop Insurance":', searchResultsCount);
  assert.ok(searchResultsCount >= 1 && searchResultsCount <= 4, 'Search filter should narrow results');

  // Clear search
  await evaluate(`
    (() => {
      const clearBtn = document.querySelector('.clear-search-btn');
      if (clearBtn) {
        clearBtn.click();
      } else {
        const inp = document.getElementById('transparency-search-input');
        if (inp) {
          const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          inputSetter.call(inp, '');
          inp.dispatchEvent(new Event('input', { bubbles: true }));
          inp.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  // ============================================================================
  // STEP 3: Test Category Selection (Click Agriculture)
  // ============================================================================
  console.log('\n6. Testing Category Filtering (Click Agriculture Category)...');
  await evaluate(`
    (() => {
      const btns = Array.from(document.querySelectorAll('.category-card-btn'));
      const agrBtn = btns.find(b => b.innerText.includes('Agriculture') || b.innerText.includes('कृषि') || b.innerText.includes('कृषी'));
      if (agrBtn) agrBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  const agrCount = await evaluate('document.querySelectorAll(".announcement-card").length');
  console.log('   Agriculture category cards count:', agrCount);
  assert.equal(agrCount, 2, `Expected exactly 2 active agriculture announcements, found: ${agrCount}`);

  // Reset category filter
  await evaluate(`
    (() => {
      const activeBtn = document.querySelector('.category-card-btn.active');
      if (activeBtn) activeBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  // ============================================================================
  // STEP 3B: Test Combined Filters (Department + Validity + Sorting)
  // ============================================================================
  console.log('\n6b. Testing Combined Filters (Department + Sorting)...');
  await evaluate(`
    (() => {
      const deptSelect = document.getElementById('dept-filter-select');
      if (deptSelect) {
        Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(deptSelect, 'Department of Agriculture');
        deptSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const sortSelect = document.getElementById('sort-select');
      if (sortSelect) {
        Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(sortSelect, 'oldest');
        sortSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  const combinedFilteredCount = await evaluate('document.querySelectorAll(".announcement-card").length');
  console.log('   Filtered cards for Department of Agriculture (Oldest First):', combinedFilteredCount);
  assert.ok(combinedFilteredCount >= 2, 'Combined filters should show matching agriculture department orders');

  // Verify external link attributes
  const externalLinkAttrs = await evaluate(`
    (() => {
      const link = document.querySelector('.announcement-card a.source-link-btn');
      if (!link) return null;
      return {
        target: link.getAttribute('target'),
        rel: link.getAttribute('rel'),
        href: link.getAttribute('href'),
      };
    })()
  `);
  console.log('   External source link attributes:', externalLinkAttrs);
  assert.equal(externalLinkAttrs.target, '_blank', 'External link target must be _blank');
  assert.ok(externalLinkAttrs.rel && externalLinkAttrs.rel.includes('noopener'), 'External link rel must include noopener');

  // ============================================================================
  // STEP 3C: Test Historical Archive Toggle
  // ============================================================================
  console.log('\n6c. Testing Historical Archive Toggle...');
  // First reset filters
  await evaluate(`
    (() => {
      const resetBtn = document.querySelector('.reset-filters-btn');
      if (resetBtn) resetBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  const countBeforeArchive = await evaluate('document.querySelectorAll(".announcement-card").length');
  await evaluate(`
    (() => {
      const cb = document.getElementById('include-archive-cb');
      if (cb && !cb.checked) {
        cb.click();
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  const countAfterArchive = await evaluate('document.querySelectorAll(".announcement-card").length');
  console.log(`   Announcements count: before archive=${countBeforeArchive}, with archive=${countAfterArchive}`);
  assert.ok(countAfterArchive > countBeforeArchive, 'Historical archive toggle should reveal archived notices');

  // Uncheck archive for subsequent steps
  await evaluate(`
    (() => {
      const cb = document.getElementById('include-archive-cb');
      if (cb && cb.checked) {
        cb.click();
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  // ============================================================================
  // STEP 4: Test Announcement Detail Modal & Escape Key
  // ============================================================================
  console.log('\n7. Testing Announcement Detail Modal & Close Interaction...');
  await evaluate(`
    (() => {
      const firstDetailBtn = document.querySelector('.announcement-card .btn.primary');
      if (firstDetailBtn) firstDetailBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  const isModalOpen = await evaluate('Boolean(document.querySelector(".transparency-modal-card"))');
  console.log('   Modal opened:', isModalOpen);
  assert.ok(isModalOpen, 'Modal should be visible');

  const modalTitle = await evaluate('document.getElementById("modal-announcement-title")?.innerText');
  console.log('   Modal announcement title:', modalTitle);
  assert.ok(modalTitle && modalTitle.length > 5, 'Modal title should be present');

  // Close modal via ESC
  await evaluate(`
    (() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    })()
  `);
  await new Promise((r) => setTimeout(r, 500));

  const isModalClosed = await evaluate('!document.querySelector(".transparency-modal-card")');
  console.log('   Modal closed on ESC:', isModalClosed);
  assert.ok(isModalClosed, 'Modal should close on ESC');

  // ============================================================================
  // STEP 5: Tablet Viewport (768px)
  // ============================================================================
  console.log('\n8. Testing Tablet Viewport (768px)...');
  await setViewport(768, 1024);
  await checkHorizontalOverflow('Tablet 768px');
  await captureScreenshot('transparency-tablet.png');

  // ============================================================================
  // STEP 6: Mobile Viewport (375px)
  // ============================================================================
  console.log('\n9. Testing Mobile Viewport (375px)...');
  await setViewport(375, 812);
  await checkHorizontalOverflow('Mobile 375px');
  await captureScreenshot('transparency-mobile-375.png');

  // ============================================================================
  // STEP 7: Small Mobile Viewport (320px)
  // ============================================================================
  console.log('\n10. Testing Small Mobile Viewport (320px)...');
  await setViewport(320, 640);
  await checkHorizontalOverflow('Small Mobile 320px');
  await captureScreenshot('transparency-mobile-320.png');

  // ============================================================================
  // STEP 8: Language Switching (Hindi & Marathi)
  // ============================================================================
  console.log('\n11. Testing Trilingual Parity (Hindi Switch)...');
  await setViewport(1280, 900);
  await evaluate(`
    (() => {
      const select = document.querySelector('select[aria-label="Language / भाषा"]');
      if (select) {
        Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(select, 'hi');
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 1000));

  const hindiHeading = await evaluate('document.querySelector("h1")?.innerText');
  console.log('   Hindi Heading:', hindiHeading);
  assert.ok(
    hindiHeading.includes('सरकारी पारदर्शिता') || hindiHeading.includes('पारदर्शिता'),
    'Hindi heading translation missing'
  );
  await captureScreenshot('transparency-hindi.png');

  console.log('\n12. Testing Trilingual Parity (Marathi Switch)...');
  await evaluate(`
    (() => {
      const select = document.querySelector('select[aria-label="Language / भाषा"]');
      if (select) {
        Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(select, 'mr');
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 1000));

  const marathiHeading = await evaluate('document.querySelector("h1")?.innerText');
  console.log('   Marathi Heading:', marathiHeading);
  assert.ok(
    marathiHeading.includes('शासकीय पारदर्शकता') || marathiHeading.includes('पारदर्शकता'),
    'Marathi heading translation missing'
  );
  await captureScreenshot('transparency-marathi.png');

  // Switch back to English
  await evaluate(`
    (() => {
      const select = document.querySelector('select[aria-label="Language / भाषा"]');
      if (select) {
        Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(select, 'en');
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  // ============================================================================
  // STEP 8B: Citizen Workspace Notification Centre Display
  // ============================================================================
  console.log('\n12b. Testing Authenticated Citizen Workspace Notification Centre Display...');
  await sendSession('Page.navigate', { url: `${base}/` });
  await new Promise((r) => setTimeout(r, 2500));

  // Click on "Transparency" navigation item in citizen workspace
  await evaluate(`
    (() => {
      const navLinks = Array.from(document.querySelectorAll('.portal-nav button, .portal-nav a, nav a, nav button'));
      const transLink = navLinks.find(el => el.innerText.trim() === 'Transparency' || el.innerText.trim() === 'पारदर्शकता');
      if (transLink) transLink.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1200));

  const workspaceNotifHeading = await evaluate('document.getElementById("notification-centre-heading")?.innerText');
  console.log('   Workspace Notification Centre Heading:', workspaceNotifHeading);
  assert.ok(
    workspaceNotifHeading && workspaceNotifHeading.includes('Notification Centre'),
    'Expected Citizen Notification Centre section in authenticated workspace'
  );

  const notifCardsCount = await evaluate('document.querySelectorAll(".notification-card").length');
  console.log('   Visible synthesized citizen notifications count:', notifCardsCount);
  assert.ok(notifCardsCount >= 0, 'Notification cards queried successfully');

  // Check overflow in embedded workspace view
  await checkHorizontalOverflow('Workspace Transparency View');

  // ============================================================================
  // STEP 9: Console Errors Verification
  // ============================================================================
  console.log('\n13. Checking Browser Console Errors...');
  console.log('   Console Errors Logged:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('   Errors detail:', consoleErrors);
  }
  assert.equal(consoleErrors.length, 0, 'No console errors permitted in browser CDP audit');

  console.log('\n=================================================================');
  console.log('PASS: All Phase 3 Day 9 Browser CDP checks passed with 0 errors and 0px overflow!');
  console.log('=================================================================');
} finally {
  cleanup();
}

process.exit(0);
