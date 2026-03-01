const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

async function run() {
  const data = await spotifyApi.clientCredentialsGrant();
  spotifyApi.setAccessToken(data.body['access_token']);

  try {
    const searchRes = await spotifyApi.searchArtists("Radiohead", { limit: 1 });
    const artist = searchRes.body.artists.items[0];
    console.log("Radiohead ID:", artist.id);

    const relatedRes = await spotifyApi.getArtistRelatedArtists(artist.id);
    console.log('Related APIs:', relatedRes.body.artists.length);
  } catch (e) {
    console.log('Similar error:', e.message, e.body);
  }
}
run();
