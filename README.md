# Polln8

Private cofounder matchmaking. Web app (Next.js 15 + Supabase) at
[polln8.com](https://polln8.com), Expo mobile app at `polln8.com/m/`
plus native iOS / Android.

## Stack

- **Web**: Next.js 15 (App Router), React 18, Tailwind, shadcn/ui
- **Mobile**: Expo Router, React Native; the web build is exported
  to `public/m/` and served by Next
- **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions +
  pg_net)
- **Email**: Resend
- **Hosting**: Vercel, Supabase

## Local dev

```bash
npm install --legacy-peer-deps
npm run dev          # next dev on :3000
```

For the mobile app:

```bash
cd mobile
npm install --legacy-peer-deps
npx expo start --lan --offline   # Expo Go on the LAN
```

## Build

```bash
npm run build        # mobile web export + next build
```
