import https from 'https';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const match = env.match(/LASTFM_API_KEY=(.*)/);
const apiKey = match[1].trim();

const url = `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=Radiohead&api_key=${apiKey}&format=json`;

https.get(url, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log(JSON.stringify(json.toptags.tag.slice(0, 15), null, 2));
  });
});
