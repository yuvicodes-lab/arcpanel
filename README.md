# YUVI Panel — Next.js + Tailwind + Neon

Converted from the supplied PHP panel to Next.js App Router with a light Tailwind UI and Neon PostgreSQL.

## Stack
- Next.js 16.1.1
- React 18.3.1
- Tailwind CSS 3.4.1
- Neon PostgreSQL via `@neondatabase/serverless`
- bcryptjs
- lucide-react

## Neon setup
1. Create a Neon project.
2. Open Neon SQL Editor.
3. Run `schema.sql`.
4. Copy the Neon pooled connection string.
5. Add it to Vercel as `DATABASE_URL`.
6. Add a long random `SESSION_SECRET`.
7. Add Turnstile keys if you want CAPTCHA enabled.

Example:
`DATABASE_URL=postgresql://...?...sslmode=require`

## Local
```bash
npm install
npm run dev
```

## Vercel
Import the repository, add the environment variables, and deploy. The Neon serverless driver is designed for serverless environments and Vercel has an official Neon integration.

## Important
The original PHP database was MySQL. This project uses a real PostgreSQL schema and PostgreSQL-compatible queries; it does not rely on MySQL compatibility tricks. Existing MySQL data must be migrated separately if you already have production records.
