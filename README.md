# ViFlow

A visitor management system built with Next.js, TypeScript, and Supabase.

## Getting Started

### Prerequisites

- Node.js 22+
- npm
- A [Supabase](https://supabase.com) project (or run `supabase start` for local development)

### Environment Setup

Copy the example env file and fill in your Supabase credentials:

```bash
copy .env.example .env
```

Edit `.env` with your actual Supabase URL, anon key, and service role key.

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production (without Docker)

```bash
npm run build
npm start
```

---

## Docker

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Environment Variables

Copy the example env file and fill in your credentials:

```bash
copy .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (server-side only) |
| `NEXT_PUBLIC_APP_URL` | App base URL (default: `http://localhost:3000`) |

Optional variables (emails are skipped if not set):

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `ALLOW_SEED` | Set to `true` to allow `POST /api/seed` in production (still requires an admin login) |

> `.env` is gitignored and holds real credentials. `.env.example` contains placeholders only — copy it and fill in your own values.

### Build the Docker Image

```bash
docker compose build
```

### Start ViFlow

```bash
docker compose up
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Start in the Background

```bash
docker compose up -d
```

### View Logs

```bash
docker compose logs -f
```

### Stop the Application

```bash
docker compose down
```

### Rebuild After Changes

If you change source code, environment variables in `compose.yaml`, or dependencies:

```bash
docker compose up --build
```

To rebuild from scratch (no cache):

```bash
docker compose build --no-cache
```

### Production Notes

- Set `NEXT_PUBLIC_APP_URL` to your real domain before building. It is used for links in
  invitation / password-reset emails and is **baked into the image at build time** —
  after changing it in `.env`, always rebuild (`docker compose up --build`).
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are build args: the build
  fails fast if they are missing.
- The build fails if the Supabase URL/keys are not provided.
- `SUPABASE_SERVICE_ROLE_KEY` and `SMTP_*` are runtime-only env vars — they never end up in
  the image, only in the running container.
- `POST /api/seed` requires an admin login and is blocked in production unless `ALLOW_SEED=true`.

---

## Project Structure

```
viflow/
├── app/                  # Next.js App Router pages and API routes
├── components/           # React components
├── lib/                  # Supabase clients, helpers, types
├── public/               # Static assets
├── supabase/             # Database migrations and config
├── Dockerfile            # Multi-stage Docker build
├── compose.yaml          # Docker Compose configuration
├── .dockerignore         # Docker build context exclusions
└── .env.example          # Environment variable template
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Docker Documentation](https://docs.docker.com)
