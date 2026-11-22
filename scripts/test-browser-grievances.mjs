import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const artifactDir = 'C:\\Users\\Soham Parab\\.gemini\\antigravity\\brain\\d929ac14-8417-4300-b750-02815ffa25f2';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:5173';

console.log('--- Phase 3 Day 6: Unified Grievance Centre Browser Verification ---');

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
const profileDir = 'C:\\temp\\cdp_profile_day6_' + Date.now();
console.log('2. Launching headless Chrome with remote debugging on port 9227...');
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9227',
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
const versionRes = await fetch('http://127.0.0.1:9227/json/version');
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
  // TEST A: Navigate to Public Standalone Route /grievances
  console.log('\n--- A. Navigating to Public Standalone Route /grievances ---');
  await setViewport(1280, 1000);
  await sendSession('Page.navigate', { url: `${base}/grievances` });
  await new Promise((r) => setTimeout(r, 2500));

  // 1. Verify Page Title
  const pageTitle = await evaluate('document.title');
  console.log('   Page Title:', pageTitle);
  assert.ok(pageTitle.includes('Grievance') || pageTitle.includes('GovSync'), 'Page title must include Grievance or GovSync');

  // 2. Verify Non-Representation Notice
  const disclaimerExists = await evaluate(`
    document.body.innerText.includes('coordination and tracking portal') ||
    document.body.innerText.includes('independent citizen coordination')
  `);
  console.log('   Non-representation disclaimer present:', disclaimerExists);
  assert.ok(disclaimerExists, 'Non-representation disclaimer must be visible');

  // 3. Verify Official Grievance Portals Links
  const aapleSarkarGrievance = await evaluate(`
    Boolean(document.querySelector('a[href*="grievances.maharashtra.gov.in"]'))
  `);
  const cpgramsLink = await evaluate(`
    Boolean(document.querySelector('a[href*="pgportal.gov.in"]'))
  `);
  console.log('   Aaple Sarkar Grievance portal link:', aapleSarkarGrievance);
  console.log('   CPGRAMS central portal link:', cpgramsLink);
  assert.ok(aapleSarkarGrievance, 'Aaple Sarkar grievance portal link must exist');
  assert.ok(cpgramsLink, 'CPGRAMS portal link must exist');

  // 4. Verify RTS Separation Callout
  const rtsCallout = await evaluate(`
    document.body.innerText.includes('Filing a grievance does not constitute a statutory appeal') ||
    document.body.innerText.includes('Section 9(1)')
  `);
  console.log('   RTS statutory separation callout present:', rtsCallout);
  assert.ok(rtsCallout, 'Must include explicit RTS statutory separation notice');

  // 5. Capture Desktop Screenshot
  const desktopSsPath = path.join(artifactDir, 'grievances-desktop.png');
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
  const tabletSsPath = path.join(artifactDir, 'grievances-tablet.png');
  await takeScreenshot(tabletSsPath);
  console.log('   ✓ Tablet screenshot saved:', tabletSsPath);

  // 2. Mobile Viewport (375px)
  await setViewport(375, 667);
  await new Promise((r) => setTimeout(r, 600));
  const mobileOverflow = await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  console.log('   Mobile (375px) horizontal overflow:', mobileOverflow, 'px');
  assert.equal(mobileOverflow, 0, 'Mobile viewport must have 0px overflow');
  const mobileSsPath = path.join(artifactDir, 'grievances-mobile-375.png');
  await takeScreenshot(mobileSsPath);
  console.log('   ✓ Mobile 375px screenshot saved:', mobileSsPath);

  // 3. Small Mobile Viewport (320px)
  await setViewport(320, 568);
  await new Promise((r) => setTimeout(r, 600));
  const smallMobileOverflow = await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
  console.log('   Small Mobile (320px) horizontal overflow:', smallMobileOverflow, 'px');
  assert.equal(smallMobileOverflow, 0, 'Small mobile viewport must have 0px overflow');
  const smallMobileSsPath = path.join(artifactDir, 'grievances-mobile-320.png');
  await takeScreenshot(smallMobileSsPath);
  console.log('   ✓ Small Mobile 320px screenshot saved:', smallMobileSsPath);

  // TEST C: In-Memory Dynamic Language Switching
  console.log('\n--- C. Testing Trilingual In-Memory Dynamic Switching ---');
  await setViewport(1280, 1000);

  // Switch to Hindi
  console.log('   Switching to Hindi (hi)...');
  await evaluate(`
    (() => {
      const sel = document.querySelector('.login-language select');
      if (sel) {
        sel.value = 'hi';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 1200));
  const hindiHeading = await evaluate('document.body.innerText');
  assert.ok(hindiHeading.includes('शिकायत केंद्र') || hindiHeading.includes('एकीकृत शिकायत केंद्र'), 'Hindi heading verified');
  const hindiSsPath = path.join(artifactDir, 'grievances-hindi.png');
  await takeScreenshot(hindiSsPath);
  console.log('   ✓ Hindi screenshot saved:', hindiSsPath);

  // Switch to Marathi
  console.log('   Switching to Marathi (mr)...');
  await evaluate(`
    (() => {
      const sel = document.querySelector('.login-language select');
      if (sel) {
        sel.value = 'mr';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 1200));
  const marathiHeading = await evaluate('document.body.innerText');
  assert.ok(marathiHeading.includes('तक्रार') || marathiHeading.includes('तक्रार निवारण'), 'Marathi heading verified');
  const marathiSsPath = path.join(artifactDir, 'grievances-marathi.png');
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
  await new Promise((r) => setTimeout(r, 800));

  // TEST D: Authenticated Citizen Dashboard & Grievance Flow
  console.log('\n--- D. Testing Citizen Dashboard Integration & Submission Flow ---');
  await sendSession('Page.navigate', { url: `${base}/` });
  await new Promise((r) => setTimeout(r, 2500));

  // Reset language to English in localStorage and page
  await evaluate(`
    (() => {
      try { localStorage.setItem('GovSync-language', 'en'); } catch {}
      const sel = document.querySelector('.login-language select, .lang-menu select');
      if (sel) {
        sel.value = 'en';
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 1000));

  // 1. Verify Quick Action card for Grievance Centre exists
  const hasQuickAction = await evaluate(`
    Boolean(document.querySelector('.quick-action-card[data-action="grievances"]'))
  `);
  console.log('   Quick action card tone-6 exists:', hasQuickAction);
  assert.ok(hasQuickAction, 'Grievance quick action card must exist on dashboard');

  // 2. Click Quick Action card to navigate to Grievance Centre
  await evaluate(`
    document.querySelector('.quick-action-card[data-action="grievances"]').click()
  `);
  await new Promise((r) => setTimeout(r, 1500));

  // 3. Verify Grievance Centre view is active
  const hasGrievanceContainer = await evaluate(`
    Boolean(document.querySelector('.grievance-centre-container'))
  `);
  const bodyTextSnippet = await evaluate(`document.body.innerText.slice(0, 300)`);
  console.log('   Grievance container present:', hasGrievanceContainer);
  console.log('   Body text snippet:', bodyTextSnippet.replace(/\\n/g, ' '));
  assert.ok(hasGrievanceContainer, 'Must be in Grievance Centre view');

  // 4. Verify 4 summary metric stat cards exist
  const statCardCount = await evaluate(`
    document.querySelectorAll('.grievance-centre-container .stat-card').length
  `);
  console.log('   Grievance summary stat cards rendered:', statCardCount);
  assert.equal(statCardCount, 4, 'Must render exactly 4 mutually exclusive summary cards');

  // 5. Open "Lodge New Grievance" modal
  console.log('   Opening Lodge New Grievance modal...');
  await evaluate(`
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Lodge New Grievance'));
    if (btn) btn.click();
  `);
  await new Promise((r) => setTimeout(r, 800));

  const modalOpen = await evaluate('Boolean(document.querySelector(\'[role="dialog"]\'))');
  console.log('   Lodge Grievance modal opened:', modalOpen);
  assert.ok(modalOpen, 'Modal dialog must open');

  // 6. Test Real-time PII Alert
  console.log('   Testing real-time PII safety alert on Aadhaar entry...');
  await evaluate(`
    (() => {
      const textarea = document.querySelector('textarea');
      if (textarea) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(textarea, 'My Aadhaar is 1234 5678 9012 and issue is pending.');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  const piiAlertVisible = await evaluate(`
    document.body.innerText.includes('Aadhaar') ||
    Boolean(document.querySelector('.note.error, [role="alert"]'))
  `);
  console.log('   PII alert shown on Aadhaar entry:', piiAlertVisible);
  assert.ok(piiAlertVisible, 'Real-time PII warning must be displayed');

  // 7. Clear PII and submit valid grievance
  console.log('   Filling valid grievance details...');
  await evaluate(`
    (() => {
      const inputs = document.querySelectorAll('input[type="text"]');
      const subjectInput = Array.from(inputs).find(i => i.placeholder && i.placeholder.includes('summary'));
      if (subjectInput) {
        const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        inputSetter.call(subjectInput, 'Government portal upload error during verification');
        subjectInput.dispatchEvent(new Event('input', { bubbles: true }));
        subjectInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const textarea = document.querySelector('textarea');
      if (textarea) {
        const taSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        taSetter.call(textarea, 'Attempted to upload revenue residence certificate. The portal returned error 500 session timeout after multiple tries.');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const ackCheckbox = document.getElementById('form-ack');
      if (ackCheckbox && !ackCheckbox.checked) {
        ackCheckbox.click();
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));

  console.log('   Submitting grievance form...');
  const submitInfo = await evaluate(`
    (() => {
      const submitBtn = Array.from(document.querySelectorAll('button[type="submit"]')).find(b => b.innerText.includes('Submit Grievance'));
      if (!submitBtn) return 'NO_BUTTON';
      const isDisabled = submitBtn.disabled;
      if (!isDisabled) submitBtn.click();
      return { disabled: isDisabled };
    })()
  `);
  console.log('   Submit button status:', submitInfo);
  await new Promise((r) => setTimeout(r, 2500));

  // 8. Verify submission result: detail modal with generated GRV reference
  const createdRef = await evaluate(`
    (() => {
      const title = document.getElementById('detail-modal-title');
      return title ? title.innerText.trim() : '';
    })()
  `);
  console.log('   Created Grievance Reference:', createdRef);
  assert.match(createdRef, /^GRV-\d{4}-[A-Z0-9]{8}$/, 'Must display valid generated GRV reference');

  // 9. Verify Chronological Events Timeline in detail view
  const eventsCount = await evaluate(`
    document.querySelectorAll('.modal-content strong').length
  `);
  console.log('   Detail view event elements present:', eventsCount > 0);
  assert.ok(eventsCount > 0, 'Detail view must contain event timeline entries');

  // 10. Check Console Errors
  console.log('\n--- E. Console Errors Check ---');
  console.log('   Console error count:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('   Encountered console errors:', consoleErrors);
  }
  assert.equal(consoleErrors.length, 0, 'There must be zero console errors');

  console.log('\nPASS: All Phase 3 Day 6 Browser CDP Tests PASSED cleanly!');
} finally {
  cleanup();
}
