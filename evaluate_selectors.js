import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
  
  // Click on Settings tab first if needed to populate DOM, or evaluate in all tabs
  // Actually, let's just evaluate them immediately to see if they exist.
  // We can just dump the textContent of the elements.
  
  const selectors = [
    "div#root:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1)",
    "div#root:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2)"
  ];
  
  for (const s of selectors) {
    const el = await page.$(s);
    if (el) {
       const text = await page.evaluate(e => e.textContent, el);
       const className = await page.evaluate(e => e.className, el);
       console.log("Found:", s);
       console.log("Class:", className);
       console.log("Text:", text.substring(0, 100));
    } else {
       console.log("Not found:", s);
    }
  }

  // If not found, let's click Settings and check again
  console.log("Clicking Settings...");
  try {
     const settingsBtn = await page.$('button[title="Settings"]'); // Assuming there's a title
     if(settingsBtn) await settingsBtn.click();
     else {
        // try finding settings by text or icon
        const btns = await page.$$('button');
        for(const b of btns) {
           const t = await page.evaluate(x => x.textContent, b);
           if(t.includes('Settings')) await b.click();
        }
     }
  } catch (e) {}
  
  await new Promise(r => setTimeout(r, 1000));
  
  for (const s of selectors) {
    const el = await page.$(s);
    if (el) {
       const text = await page.evaluate(e => e.textContent, el);
       const className = await page.evaluate(e => e.className, el);
       console.log("Found after Settings:", s);
       console.log("Class:", className);
       console.log("Text:", text.substring(0, 100));
    } else {
       console.log("Not found after Settings:", s);
    }
  }
  
  await browser.close();
})();
