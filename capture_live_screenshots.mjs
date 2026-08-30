import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.resolve(__dirname, 'live_screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  console.log('Launching headless browser to capture live Vercel application screenshots...');
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1440, height: 900 } });
  const page = await browser.newPage();

  // Navigate to live app
  console.log('Navigating to https://kpi-engine.vercel.app ...');
  await page.goto('https://kpi-engine.vercel.app', { waitUntil: 'networkidle0', timeout: 60000 });
  await sleep(2500);

  // 1. Capture Overview Page
  console.log('1. Capturing Overview Page...');
  await page.screenshot({ path: path.join(screenshotsDir, '01_overview.png'), fullPage: false });

  // 2. Capture Insight Analysis Tab
  console.log('2. Capturing Insight Analysis Tab...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button, a, span')).find(e => e.textContent.includes('Insight Analysis'));
    if (el) el.click();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '02_insight.png'), fullPage: false });

  // 3. Capture Abstention State (Select "Contradictory Evidence" from scenario dropdown)
  console.log('3. Capturing Abstention Protocol Frame (Contradictory Scenario)...');
  await page.evaluate(() => {
    const select = document.querySelector('select');
    if (select) {
      select.value = 'contradictory';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await sleep(2500);
  // Navigate back to Overview to show Abstention Banner
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button, a, span')).find(e => e.textContent.trim() === 'Overview');
    if (el) el.click();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '03_abstention.png'), fullPage: false });

  // Switch scenario back to Revenue Decline
  await page.evaluate(() => {
    const select = document.querySelector('select');
    if (select) {
      select.value = 'revenue_decline';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await sleep(2000);

  // 4. Capture Driver Attribution Tab
  console.log('4. Capturing Driver Attribution Tab...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button, a, span')).find(e => e.textContent.includes('Driver Attribution'));
    if (el) el.click();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '04_drivers.png'), fullPage: false });

  // 5. Capture Live Simulator Tab
  console.log('5. Capturing Live Simulator Tab...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button, a, span')).find(e => e.textContent.includes('Simulator'));
    if (el) el.click();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '05_simulator.png'), fullPage: false });

  // 6. Capture Data Sources Tab
  console.log('6. Capturing Data Sources Tab...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button, a, span')).find(e => e.textContent.includes('Data Sources') || e.textContent.includes('Sources'));
    if (el) el.click();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '06_sources.png'), fullPage: false });

  // 7. Capture Semantic Layer Tab
  console.log('7. Capturing Semantic Layer Tab...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button, a, span')).find(e => e.textContent.includes('Semantic Layer') || e.textContent.includes('Semantic'));
    if (el) el.click();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '07_semantic.png'), fullPage: false });

  // 8. Capture Feedback Loop Tab
  console.log('8. Capturing Feedback Loop Tab...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button, a, span')).find(e => e.textContent.includes('Feedback'));
    if (el) el.click();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '08_feedback.png'), fullPage: false });

  // 9. Capture System Health Tab
  console.log('9. Capturing System Health Tab...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button, a, span')).find(e => e.textContent.includes('Health') || e.textContent.includes('System Health'));
    if (el) el.click();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '09_health.png'), fullPage: false });

  // 10. Capture Chat Drawer
  console.log('10. Capturing Analyst Chat Drawer...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('button, a, span')).find(e => e.textContent.includes('Chat') || e.textContent.includes('Analyst'));
    if (el) el.click();
  });
  await sleep(2000);
  await page.screenshot({ path: path.join(screenshotsDir, '10_chat_drawer.png'), fullPage: false });

  console.log('All screenshots captured successfully!');
  await browser.close();
})();
