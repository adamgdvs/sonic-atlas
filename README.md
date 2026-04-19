This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Curated Playlists Bridge

The Discovery page can surface curated mood playlists from YouTube Music through a lightweight Python bridge.

Setup:

```bash
python3 -m venv .venv
.venv/bin/pip install ytmusicapi
```

The bridge entrypoint is `scripts/ytmusic_bridge.py`. If `ytmusicapi` is not installed, curated rows fail soft and remain hidden.

## Deezer Acquisition

`sonic_atlas` now includes a standalone Deezer acquisition pipeline that saves:

- raw Deezer playlist metadata
- raw Deezer track pages
- normalized local playlist JSON
- optional YouTube-matched playlist output

Run it with:

```bash
npm run deezer:acquire -- --playlist 760160361 --match-youtube
```

Useful modes:

```bash
# crawl playlists from a Deezer user
npm run deezer:acquire -- --user 2529 --limit-playlists 100

# search Deezer playlists by query and ingest the results
npm run deezer:acquire -- --search "indie rock" --search shoegaze --match-youtube

# ingest a local bundle shaped as { "playlist": {...}, "trackPages": [...] }
npm run deezer:acquire -- --bundle-json ./fixtures/indie-rock-now.bundle.json --match-youtube
```

Artifacts are written under `data/deezer/`:

- `raw/users/*.playlists.json`
- `raw/search/*.json`
- `raw/playlists/{id}.json`
- `raw/playlists/{id}.tracks.json`
- `normalized/playlists/{id}.json`
- `matched/playlists/{id}.json`
- `index/playlists.json`

The acquisition script follows Deezer pagination automatically by using the `next` URL returned in playlist and track payloads. It also short-circuits rebuilds when the playlist `checksum` is unchanged unless `--force` is provided.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
