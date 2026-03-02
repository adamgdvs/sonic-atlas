import fs from 'fs';
import https from 'https';

const API_KEY = process.env.LASTFM_API_KEY || '28feded1a968459ab28390fa8dba0deb';

const NOISE_FILTER = new Set([
    "seen live", "favorite", "loved", "awesome", "favourite", "favorites", "favourite artists",
    "under 2000 listeners", "female vocalists", "male vocalists", "90s", "80s", "00s", "10s",
    "70s", "60s", "british", "american", "canadian", "swedish", "uk", "usa", "french", "german",
    "beautiful", "genius", "love", "classic", "chillout", "chill", "relax", "mellow",
    "amazing", "best", "epic", "good", "great", "nice", "my favorite", "my favorites",
    "favorite artists", "favourite artist", "fucking awesome", "all", "love at first listen",
    "1001 albums you must hear before you die", "albums i own"
]);

function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'SonicAtlasSpider/1.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

// Pause function to prevent 429 rate limits
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function scrape() {
    console.log("Fetching top 3000 global artists...");
    let artists = [];
    for (let p = 1; p <= 3; p++) {
        const chartRes = await fetchJSON(`https://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=${API_KEY}&format=json&limit=1000&page=${p}`);
        artists = artists.concat(chartRes.artists.artist.map(a => a.name));
    }

    const allGenres = new Set();

    console.log(`Starting spider on ${artists.length} artists to extract deep tags...`);

    for (let i = 0; i < artists.length; i++) {
        const artistName = artists[i];
        try {
            const tagRes = await fetchJSON(`https://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=${encodeURIComponent(artistName)}&api_key=${API_KEY}&format=json`);
            if (tagRes.toptags && tagRes.toptags.tag) {
                tagRes.toptags.tag.forEach(t => {
                    const name = t.name.toLowerCase();
                    // Filter out noise, numbers (years), and weird characters
                    if (!NOISE_FILTER.has(name) && name.length > 2 && name.length <= 40 && !/^\d+$/.test(name)) {
                        // Basic filtering to ensure it's a genre-like string (no special symbols mostly)
                        if (/^[a-z0-9\s\-&]+$/.test(name)) {
                            allGenres.add(name);
                        }
                    }
                });
            }
            process.stdout.write(`\rSpidering: ${i + 1}/${artists.length} - Acquired ${allGenres.size} unique authentic genres...         `);

            // Stop early if we hit a massive amount
            if (allGenres.size > 8000) break;

            // Small sleep to respect rate limits
            await sleep(10);
        } catch (e) {
            // ignore
        }
    }

    // Convert to array and take top 3000
    const finalArray = Array.from(allGenres).slice(0, 3000);

    const output = { genres: finalArray };
    fs.writeFileSync('src/data/genres.json', JSON.stringify(output, null, 2));

    console.log(`\n\nSuccess! Extracted and saved ${finalArray.length} pristine micro-genres to src/data/genres.json.`);
}

scrape();
