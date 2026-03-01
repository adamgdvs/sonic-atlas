import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function scrapeGenres() {
    console.log("Launching headless browser...");
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    console.log("Navigating to everynoise.com...");
    await page.goto('https://everynoise.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log("Extracting genres...");
    const genres = await page.evaluate(() => {
        const nodes = document.querySelectorAll('.genre');
        const result = [];
        for (const node of nodes) {
            let text = node.textContent || "";
            text = text.replace('»', '').trim();
            if (text) result.push(text);
        }
        return result;
    });

    await browser.close();

    const uniqueGenres = [...new Set(genres)].sort();
    console.log(`Found ${uniqueGenres.length} unique genres.`);

    const outputDir = path.join(process.cwd(), 'src', 'data');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'genres.json');
    fs.writeFileSync(outputPath, JSON.stringify(uniqueGenres, null, 2));
    console.log(`Wrote to ${outputPath}`);
}

scrapeGenres().catch(console.error);
