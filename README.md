# Today's Play

Today's live music choices: see which bands are playing near you on any day, and hear a sample of their music before you buy a ticket.

**Live site:** https://rfanfant.github.io/todays-play/

Based on the 2019 Today's Play class project ([cplank/Today-s-Play](https://github.com/cplank/Today-s-Play)), rebuilt in 2026 as a single page with no login.

## Features

- **Find shows:** tap "Who's playing near me" (uses your location), or search a city, "city, state", or ZIP code with a 10, 25 or 50 mile radius.
- **Pick a date:** the 📅 Date field shows listings for any upcoming day; **Today** jumps back. Changing the date reruns the last search.
- **One card per show:** headliner on top, warm-up bands listed underneath in billing order. Duplicate Ticketmaster listings (VIP packages and so on) are merged.
- **Music samples:**
  - Big **▶** plays the whole lineup: each band's top 5 songs, headliner first.
  - Small **▶** beside each band (multi-band shows only) starts with that band.
  - **⏭** appears while playing and skips to the next song.
  - Shows and bands with no samples have their play buttons greyed out.
- **Tickets:** tap any band's name to open the show's Ticketmaster page.
- **Install as an app:** in Chrome on Android, ⋮ → *Install and create shortcut* adds a home-screen icon that opens full screen.

## How it works

Everything runs in the browser from `index.html`; there is no server.

| Job | Service | Key needed |
|---|---|---|
| Show listings | [Ticketmaster Discovery API](https://developer.ticketmaster.com/) | Yes (built into the page) |
| Top songs + 30-second previews | [Deezer API](https://developers.deezer.com/api), ranked by popularity | No |
| Fallback previews | [iTunes Search API](https://performance-partners.apple.com/search-api) | No |
| City → coordinates | [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | No |
| ZIP → coordinates | [Zippopotam.us](https://www.zippopotam.us/) | No |

Notes:

- Ticketmaster's `city` and `postalCode` filters only match venues inside that exact city or ZIP, so the page converts the place to coordinates and searches by radius (`geoPoint`). If the lookup fails it falls back to the exact match.
- Samples only play when the artist name matches exactly, so the wrong band is never played.
- After each search, every band's songs are loaded in the background (3 at a time), with one retry on failure, so ▶ starts instantly.

## Files

| File | Purpose |
|---|---|
| `index.html` | The whole app: markup, styles and script |
| `manifest.webmanifest` | Lets phones install it as an app |
| `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | App icons |

## Ticketmaster key

The key is set in `index.html`:

```js
const TM_KEY = "…";
```

To change it, edit that line and push; GitHub Pages updates in about a minute. Only the **Consumer Key** goes here, never the Consumer Secret.

The key is visible to anyone who views the page source. It only reads public event listings, so the risk is someone using up the daily request quota. To hide it properly, move the Ticketmaster call behind a small proxy (for example a Cloudflare Worker) that stores the key as a secret.

## Deploying

GitHub Pages serves the `main` branch from the repository root (Settings → Pages → Deploy from a branch → `main` / `/ (root)`).

## Ideas for later

- Hide the Ticketmaster key behind a Cloudflare Worker.
- Ask Ticketmaster to reissue the key (the current one has been public since 2019).
