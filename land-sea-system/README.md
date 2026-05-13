# Fleet Ops System

Fleet Ops System is a Next.js business management application for handling:
- fleet assets,
- clients,
- assignments,
- revenues,
- invoices,
- salaries,
- maintenance records,
- role-based access control.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Prisma
- MySQL or MariaDB-compatible database

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and fill in your values:

```bash
copy .env.example .env
```

3. Run the app:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

## Build Check

```bash
npm run build
```

## Deployment Notes

This app is server-rendered and depends on a live MySQL-compatible database.

To deploy it publicly, you need:
- a hosting platform for the Next.js app, such as Vercel or Netlify,
- a hosted MySQL or MariaDB database,
- the production environment variables set in the hosting dashboard.

### Required Environment Variables

- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`
- `JWT_SECRET`

Optional:
- `DATABASE_URL`

### Recommended Simple Deploy Path

1. Push the repo to GitHub.
2. Create a hosted MySQL database.
3. Import or recreate the schema using Prisma migrations.
4. Add the environment variables in Vercel or Netlify.
5. Deploy the Next.js project.

## Demo Accounts

Seeded accounts include:
- `admin@landsea.local`
- `ava.holloway@landsea.local`
- `noah.mercer@landsea.local`
- `leah.bennett@landsea.local`
- `omar.rahman@landsea.local`
- `mila.carter@landsea.local`

Check the seed file if you need the exact role mapping or demo passwords.
