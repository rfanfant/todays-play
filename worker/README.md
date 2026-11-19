# Ticketmaster proxy (Cloudflare Worker)

`worker.js` sits between the page and Ticketmaster so the API key is never sent to the browser or app.

- The key is stored as a Cloudflare **secret** named `TM_KEY` (Worker → Settings → Variables and Secrets). It is never in this repo.
- Only `GET /events` is served, only for requests from `https://rfanfant.github.io`, and only the search parameters the app uses are passed through.
- Each search is cached for 10 minutes, so repeated searches don't use up the 5,000-calls-a-day quota.

To change the key: update the `TM_KEY` secret in the Cloudflare dashboard. No code change or redeploy of the site is needed.
