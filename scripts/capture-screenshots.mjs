import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const artifactDir = 'C:\\Users\\Soham Parab\\.gemini\\antigravity\\brain\\d929ac14-8417-4300-b750-02815ffa25f2';
const base = 'http://localhost:5173';

// 1. Get authenticated session cookie for Asha Sharma (citizen) and Admin
console.log('Authenticating as DEMO-1001 (Asha Sharma)...');
const authRes = await fetch(`${base}/api/auth/demo`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: base },
  body: JSON.stringify({ citizenId: 'DEMO-1001' }),
});
const rawCookies = authRes.headers.getSetCookie();
let sessionValue = '';
for (const c of rawCookies) {
  const match = c.match(/govsync_session=([^;]+)/);
  if (match) sessionValue = match[1];
}

// 2. Launch headless Chrome with CDP
console.log('Launching headless Chrome with remote debugging...');
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\temp\\cdp_profile',
  '--window-size=1280,1024',
  'about:blank',
]);

await new Promise((r) => setTimeout(r, 1500));

// 3. Get WebSocket debugger URL
const versionRes = await fetch('http://127.0.0.1:9222/json/version');
const versionData = await versionRes.json();
const wsUrl = versionData.webSocketDebuggerUrl;
console.log('Connecting to CDP WebSocket:', wsUrl);

const ws = new WebSocket(wsUrl);
await new Promise((resolve) => ws.addEventListener('open', resolve));

let id = 1;
const pending = new Map();
ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(msg.error);
    else resolve(msg.result);
  }
});

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const curId = id++;
    pending.set(curId, { resolve, reject });
    ws.send(JSON.stringify({ id: curId, method, params }));
  });
}

// 4. Create new target page
const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

function sendSession(method, params = {}) {
  return new Promise((resolve, reject) => {
    const curId = id++;
    pending.set(curId, { resolve, reject });
    ws.send(JSON.stringify({ id: curId, sessionId, method, params }));
  });
}

await sendSession('Page.enable');
await sendSession('Network.enable');
await sendSession('Runtime.enable');

// Set authenticated session cookie
if (sessionValue) {
  await sendSession('Network.setCookie', {
    name: 'govsync_session',
    value: sessionValue,
    domain: 'localhost',
    path: '/',
  });
}

await sendSession('Emulation.setDeviceMetricsOverride', {
  width: 1280,
  height: 1100,
  deviceScaleFactor: 1,
  mobile: false,
});

// Navigate to GovSync
console.log('Navigating to http://localhost:5173...');
await sendSession('Page.navigate', { url: `${base}/` });
await new Promise((r) => setTimeout(r, 2500));

// Capture Screenshot 1: Full Marketplace
console.log('Capturing Screenshot 1: 7-Service Marketplace...');
const snap1 = await sendSession('Page.captureScreenshot', { format: 'png' });
const file1 = path.join(artifactDir, 'marketplace-7-services.png');
fs.writeFileSync(file1, Buffer.from(snap1.data, 'base64'));
console.log('Saved:', file1);

// Filter by Documentation category
console.log('Filtering by Documentation category...');
await sendSession('Runtime.evaluate', {
  expression: `
    const buttons = Array.from(document.querySelectorAll('button'));
    const docTab = buttons.find(b => b.textContent && b.textContent.includes('Documentation'));
    if (docTab) docTab.click();
  `,
});
await new Promise((r) => setTimeout(r, 1000));

// Capture Screenshot 2: Filtered view
console.log('Capturing Screenshot 2: Filtered Services View...');
const snap2 = await sendSession('Page.captureScreenshot', { format: 'png' });
const file2 = path.join(artifactDir, 'marketplace-filtered.png');
fs.writeFileSync(file2, Buffer.from(snap2.data, 'base64'));
console.log('Saved:', file2);

// Click "Start Application" on Ration Card
console.log('Clicking Start Application on service card...');
await sendSession('Runtime.evaluate', {
  expression: `
    const allTab = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('All'));
    if (allTab) allTab.click();
  `,
});
await new Promise((r) => setTimeout(r, 600));

await sendSession('Runtime.evaluate', {
  expression: `
    const startBtns = Array.from(document.querySelectorAll('.service-card .text-link'));
    if (startBtns.length > 2) startBtns[2].click();
  `,
});
await new Promise((r) => setTimeout(r, 1500));

// Capture Screenshot 3: Application Wizard
console.log('Capturing Screenshot 3: Application Wizard...');
const snap3 = await sendSession('Page.captureScreenshot', { format: 'png' });
const file3 = path.join(artifactDir, 'application-wizard.png');
fs.writeFileSync(file3, Buffer.from(snap3.data, 'base64'));
console.log('Saved:', file3);

// Navigate to My Applications to capture Application Timeline
console.log('Navigating to My Applications for Application Timeline...');
await sendSession('Runtime.evaluate', {
  expression: `
    const myAppsLink = Array.from(document.querySelectorAll('a, button')).find(el => el.textContent && el.textContent.includes('My applications'));
    if (myAppsLink) myAppsLink.click();
  `,
});
await new Promise((r) => setTimeout(r, 1500));

// Open the first application in history
await sendSession('Runtime.evaluate', {
  expression: `
    const openBtns = Array.from(document.querySelectorAll('.data-table button'));
    if (openBtns.length > 0) openBtns[0].click();
  `,
});
await new Promise((r) => setTimeout(r, 2000));

// Capture Screenshot 4: Application Timeline
console.log('Capturing Screenshot 4: Application Timeline...');
const snap4 = await sendSession('Page.captureScreenshot', { format: 'png' });
const file4 = path.join(artifactDir, 'application-timeline.png');
fs.writeFileSync(file4, Buffer.from(snap4.data, 'base64'));
console.log('Saved:', file4);

// Now navigate to Department & API Registry
console.log('Switching to Admin to capture Department & API Registry...');
// Authenticate as Admin
const adminCfg = JSON.parse(fs.readFileSync('.private/admin-account.json', 'utf8'));
const adminPw = process.env.TEST_ADMIN_PASSWORD || fs.readFileSync('.private/ADMIN-LOGIN.txt', 'utf8').match(/^Password: (.+)$/m)[1];
const adminRes = await fetch(`${base}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: base },
  body: JSON.stringify({ mobile: adminCfg.mobile, password: adminPw, role: 'admin' }),
});
let adminCookieVal = '';
for (const c of adminRes.headers.getSetCookie()) {
  const match = c.match(/govsync_session=([^;]+)/);
  if (match) adminCookieVal = match[1];
}

if (adminCookieVal) {
  await sendSession('Network.setCookie', {
    name: 'govsync_session',
    value: adminCookieVal,
    domain: 'localhost',
    path: '/',
  });
}

await sendSession('Page.navigate', { url: `${base}/admin` });
await new Promise((r) => setTimeout(r, 2000));

// Click "API registry" in Admin nav
await sendSession('Runtime.evaluate', {
  expression: `
    const links = Array.from(document.querySelectorAll('a, button'));
    const apiRegLink = links.find(el => el.textContent && el.textContent.includes('API registry'));
    if (apiRegLink) apiRegLink.click();
  `,
});
await new Promise((r) => setTimeout(r, 1500));

// Click "Department & API Registry" tab
await sendSession('Runtime.evaluate', {
  expression: `
    const triggers = Array.from(document.querySelectorAll('.tab-trigger'));
    const regTab = triggers.find(t => t.textContent && t.textContent.includes('Department & API Registry'));
    if (regTab) regTab.click();
  `,
});
await new Promise((r) => setTimeout(r, 1200));

// Capture Screenshot 5: Department & API Registry
console.log('Capturing Screenshot 5: Department & API Registry...');
const snap5 = await sendSession('Page.captureScreenshot', { format: 'png' });
const file5 = path.join(artifactDir, 'department-api-registry.png');
fs.writeFileSync(file5, Buffer.from(snap5.data, 'base64'));
console.log('Saved:', file5);

// Cleanup
ws.close();
chrome.kill();
console.log('ALL SCREENSHOTS CAPTURED SUCCESSFULLY.');
