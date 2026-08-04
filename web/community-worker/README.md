# Community Worker

Cloudflare Worker providing auth, forum posts, card comments, and media uploads (D1 + R2).

## First-time setup

```bat
cd web\community-worker
npx wrangler login
npx wrangler d1 create bangdream-community
npx wrangler r2 bucket create bangdream-community-media
```

Paste the D1 `database_id` into `wrangler.toml`, then:

```bat
npx wrangler secret put JWT_SECRET
npx wrangler d1 migrations apply bangdream-community --remote
npx wrangler deploy
```

Set GitHub Actions variable `COMMUNITY_API_URL` (or local `NEXT_PUBLIC_COMMUNITY_API`) to the Worker URL.
