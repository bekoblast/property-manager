# Netlify Showcase Deployment

This project can be imported directly from GitHub into Netlify as a static showcase.

## How It Works

Netlify static hosting does not run the local Express + SQLite server from `server/`.

For the public showcase, the app uses:

- Seed data from `src/data.ts`.
- Browser `localStorage` under `aqarati.*` keys.
- `VITE_SHOWCASE_MODE=true` from `netlify.toml`.

This means visitors can create, edit, delete, search, and export reports during their browser session. Their demo changes stay in their own browser only.

The local Express + SQLite backend still works for development with:

```powershell
npm run api
```

## Import From GitHub

1. Open Netlify.
2. Choose **Add new site**.
3. Choose **Import an existing project**.
4. Connect GitHub.
5. Select `bekoblast/property-manager`.
6. Keep the detected settings:

```text
Build command: npm run build
Publish directory: dist
```

The repo includes `netlify.toml`, so Netlify will automatically set:

```text
VITE_SHOWCASE_MODE=true
```

## SPA Routing

`netlify.toml` redirects all routes to `index.html`, so the React SPA keeps working after refresh.

## Important Note

This deployment is a showcase, not a shared production database. Because the data is stored in each visitor's browser, one visitor's changes will not appear for another visitor.

For a real shared company system, deploy the backend and database separately, then set:

```text
VITE_SHOWCASE_MODE=false
VITE_API_BASE_URL=https://your-api.example.com/api
```
