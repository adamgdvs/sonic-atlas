import fs from 'fs';
import https from 'https';

const API_KEY = "28feded1a968459ab28390fa8dba0deb";

const data = JSON.parse(fs.readFileSync('src/data/genres.json', 'utf-8'));
const allGenres = data.genres;

const activeGenres = [];
let errorCount = 0;
let processed = 0;

// To avoid banning, 5 requests at a time, wait 100ms
const BATCH_SIZE = 5;

function checkGenre(genre, retries = 3) {
    return new Promise((resolve) => {
        const url = `https://ws.audioscrobbler.com/2.0/?method=tag.gettopartists&tag=${encodeURIComponent(genre)}&limit=1&api_key=${API_KEY}&format=json`;
        https.get(url, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (json.error) {
                        // API error (like rate limit usually 29 or 8)
                        if (retries > 0) {
                            setTimeout(() => {
                                resolve(checkGenre(genre, retries - 1));
                            }, 1000);
                        } else {
                            resolve({ genre, active: false, error: true, msg: json.message });
                        }
                    } else if (json.topartists && json.topartists.artist && json.topartists.artist.length > 0) {
                        resolve({ genre, active: true });
                    } else {
                        resolve({ genre, active: false });
                    }
                } catch (e) {
                    if (retries > 0) {
                        setTimeout(() => resolve(checkGenre(genre, retries - 1)), 1000);
                    } else {
                        resolve({ genre, active: false, error: true });
                    }
                }
            });
        }).on('error', () => {
            if (retries > 0) {
                setTimeout(() => resolve(checkGenre(genre, retries - 1)), 1000);
            } else {
                resolve({ genre, active: false, error: true });
            }
        });
    });
}

async function run() {
    console.log(`Starting validation of ${allGenres.length} genres against Last.fm...`);

    for (let i = 0; i < allGenres.length; i += BATCH_SIZE) {
        const batch = allGenres.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(batch.map(g => checkGenre(g)));

        for (const res of results) {
            if (res.active) {
                activeGenres.push(res.genre);
            } else if (res.error) {
                errorCount++;
            }
        }

        processed += batch.length;
        process.stdout.write(`\rProgress: ${processed} / ${allGenres.length} | Active: ${activeGenres.length} | Errors: ${errorCount}`);

        // throttle heavily to 50 requests per second max
        await new Promise(r => setTimeout(r, 100)); // 100ms per 5 reqs = 50 req/sec
    }

    console.log(`\n\nValidation complete.`);
    console.log(`Valid Last.fm mapped genres: ${activeGenres.length}`);
    console.log(`API Dropouts/Errors: ${errorCount}`);

    if (activeGenres.length > 0) {
        fs.writeFileSync('src/data/genres.json', JSON.stringify({ genres: activeGenres }, null, 2));
        console.log("Safely overwrote src/data/genres.json with ONLY playable, compatible genres.");
    }
}

run();
