# iVan Platform

A full-stack, production-grade service delivery and marketplace platform built with **Next.js 14**, supporting courier jobs, e-commerce shops, restaurant management, real-time chat, and subscription billing — all in one system.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Scripts](#scripts)
- [API Routes](#api-routes)
- [Internationalization](#internationalization)
- [Real-time Features](#real-time-features)
- [Payments & Subscriptions](#payments--subscriptions)
- [File Uploads](#file-uploads)
- [Maps & Location](#maps--location)
- [Deployment](#deployment)
- [Mobile App](#mobile-app)

---

## Overview

iVan is a multi-role marketplace that connects customers with service providers, shops, and restaurants. It handles the full lifecycle of service delivery: job posting, provider matching, real-time tracking, payment, tipping, reviews, and payouts — with an affiliate program and multi-language support layered on top.

---

## Features

### Core Services
- **Courier & Delivery Jobs** — Post jobs, accept bids, track deliveries in real time
- **Shop / E-Commerce** — Product catalog, cart, checkout, and order management
- **Restaurant Management** — Menu items, table reservations, dine-in and delivery orders
- **Luggage Storage** — Book luggage drop-off/pick-up at registered locations
- **Service Categories** — Courier, cleaning, locksmith, and more

### Platform Capabilities
- **Real-time Chat** — Socket.IO-powered messaging between all user types
- **Live Notifications** — In-app and email notifications for every major event
- **Digital Wallets** — Balance top-up, job/order payouts, and withdrawal
- **Stripe Payments** — Checkout, tips, Stripe Connect for provider payouts
- **Subscription Plans** — Tiered plans with feature limits and billing history
- **Affiliate Program** — Commission tracking and automated payouts
- **Document Verification** — Providers submit documents; admins approve/reject
- **Reviews & Feedback** — Ratings and replies for completed jobs and orders
- **Reports / Disputes** — Users can report issues on jobs and orders
- **Admin Dashboard** — Full platform management, user control, analytics

### Developer Features
- **OpenAPI Documentation** — Auto-generated API docs at `/api/openapi`
- **14-language i18n** — next-intl with locale-aware routing
- **Docker support** — Dockerfile + docker-compose included
- **Seed scripts** — Quickly populate the database for development

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript + JavaScript |
| Database | MySQL via Prisma ORM |
| Auth | NextAuth.js (credentials, Google, GitHub) |
| Real-time | Socket.IO |
| Payments | Stripe (Checkout, Connect, Webhooks) |
| Maps | Mapbox GL + Google Maps |
| Storage | AWS S3 |
| Email | Nodemailer (Mailtrap-compatible) |
| AI | OpenAI API |
| Styling | Tailwind CSS + React Bootstrap |
| i18n | next-intl |
| Forms | React Hook Form + Yup |
| State | React Context |

---

## Project Structure

```
├── app/                        # Next.js App Router
│   ├── [locale]/               # Locale-prefixed pages
│   │   ├── (auth)/             # Login, register, forgot password
│   │   ├── (on-board)/         # Provider onboarding flow
│   │   ├── (admin)/            # Admin dashboard pages
│   │   ├── customer/           # Customer-facing pages
│   │   ├── provider/           # Provider/courier pages
│   │   ├── restaurant/         # Restaurant owner pages
│   │   └── shop/               # Shop owner pages
│   └── api/                    # API route handlers
│       ├── (authentication)/   # Auth endpoints
│       └── (admin)/            # Protected admin/business endpoints
├── components/                 # Shared React components
├── config/                     # App-level config
├── hooks/                      # Custom React hooks
├── i18n/                       # Translation messages & routing
├── lib/                        # Contexts, email templates, shared logic
├── mobile/                     # React Native mobile app
├── prisma/                     # Schema, migrations, seed scripts
├── public/                     # Static assets
├── scripts/                    # One-off seed/utility scripts
├── types/                      # TypeScript type definitions
├── utils/                      # Business logic services
├── middleware.js               # Auth + i18n middleware
├── server.js                   # Custom server (Socket.IO + Next.js)
├── next.config.mjs             # Next.js config
├── tailwind.config.ts          # Tailwind config
├── Dockerfile
└── docker-compose.yml
```

---

## User Roles

| Role | Description |
|---|---|
| **Customer** | Browse services, place orders, book jobs, manage wallet |
| **Provider** | Accept courier/service jobs, track earnings, get verified |
| **Shop Owner** | Manage products, process orders, handle payouts |
| **Restaurant Owner** | Manage menus, reservations, delivery orders |
| **Admin** | Full platform control — users, verifications, analytics |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL database
- npm

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd new-iVan-master

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in all required values (see Environment Variables section below)

# 4. Push the database schema
npx prisma db push

# 5. Generate Prisma client
npx prisma generate

# 6. (Optional) Seed initial data
npm run seed
npm run seed-homepage-services
npm run seed-shops

# 7. Start the development server
npm run dev
```

The app will be available at `http://localhost:3001`.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# ── Database ──────────────────────────────────────────────────
DATABASE_URL=mysql://user:password@host:3306/database_name

# ── Auth ──────────────────────────────────────────────────────
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3001

# OAuth providers (optional)
GITHUB_ID=
GITHUB_SECRET=
GOOGLE_ID=
GOOGLE_SECRET=

# ── Email ─────────────────────────────────────────────────────
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=
MAILTRAP_PASS=

# ── Stripe ────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ── AWS S3 ────────────────────────────────────────────────────
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=

# ── Maps ──────────────────────────────────────────────────────
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=

# ── OpenAI ────────────────────────────────────────────────────
OPENAI_API_KEY=

# ── Server ────────────────────────────────────────────────────
PORT=3001
HOSTNAME=0.0.0.0
NODE_ENV=development

# ── i18n ──────────────────────────────────────────────────────
NEXT_PUBLIC_LOCALE_DETECTION=false
```

---

## Database

The project uses **MySQL** with **Prisma ORM**.

### Key Models

| Model | Purpose |
|---|---|
| `users` | All user accounts with role flags |
| `jobs` | Courier/service jobs with full logistics |
| `product_orders` | Shop/restaurant orders with delivery tracking |
| `reservations` | Restaurant table bookings |
| `chats` / `messages` | Real-time messaging |
| `wallets` | User balances |
| `subscriptions` | Plan-based billing |
| `cart` / `cart_items` | Shopping cart |
| `documents` | Provider verification documents |
| `notifications` | In-app notification records |
| `feedbacks` | Reviews and ratings |
| `shops` | Shop and restaurant entities |
| `products` | Products and menu items |
| `luggage_items` / `luggage_locations` | Luggage storage system |
| `stripe_connect` | Provider Stripe Connect accounts |
| `transaction` | Payment transaction ledger |
| `affiliate_settings` | Affiliate commission configuration |

### Prisma Commands

```bash
npx prisma db push           # Sync schema to database (no migration file)
npx prisma migrate dev       # Create and apply a named migration
npx prisma generate          # Regenerate Prisma client after schema changes
npx prisma studio            # Open visual database browser
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (port 3001) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run dev-start` | Start Next.js on port 5005 |
| `npm run live` | Start Next.js on port 5057 |
| `npm run seed` | Seed core database records |
| `npm run seed-homepage-services` | Seed homepage services |
| `npm run seed-shops` | Seed shop owner accounts |

---

## API Routes

All API routes live under `/app/api/`. Key groupings:

### Authentication
- `POST /api/login`
- `POST /api/register`
- `POST /api/forgot-password`
- `POST /api/reset-password`
- `GET/POST /api/auth/[...nextauth]`

### Jobs (Courier / Delivery)
- `GET/POST /api/jobs`
- `GET/PATCH/DELETE /api/jobs/[id]`
- `POST /api/jobs/accept` — Provider accepts a job
- `POST /api/jobs/cancel`
- `POST /api/jobs/payment` — Initiate job payment
- `GET /api/jobs/nearby` — Find nearby available jobs

### Orders (Shops & Restaurants)
- `GET/POST /api/orders`
- `POST /api/orders/[id]/confirm`
- `PATCH /api/orders/[id]/delivery-status`
- `POST /api/orders/payment`

### Shops & Products
- `GET/POST /api/shops`
- `GET/PATCH/DELETE /api/shops/[id]`
- `GET/POST /api/products`
- `POST /api/products/purchase`

### Subscriptions
- `GET/POST /api/subscription`
- `POST /api/subscription/create-session`
- `POST /api/subscription/cancel`
- `GET /api/subscription/billing-history`
- `POST /api/subscription/webhook` — Stripe webhook endpoint

### Payments & Payouts
- `POST /api/payment-client-secret`
- `GET/POST /api/payouts`
- `POST /api/payouts/pay`
- `POST /api/stripe-connect` — Link Stripe Connect account

### Chats
- `GET/POST /api/chats`
- `GET /api/chats/[chatId]/messages`
- `POST /api/chats/[chatId]/mark-read`

### Other
- `GET /api/health` — Health check
- `GET /api/openapi` — OpenAPI spec
- `GET /api/notifications`
- `GET /api/stats`
- `POST /api/reservations`
- `POST /api/feedbacks/submit`

---

## Internationalization

The platform supports **14 languages** using `next-intl` with locale-prefixed routing (`/en/...`, `/ar/...`, etc.):

| Code | Language |
|---|---|
| `en` | English (default) |
| `ar` | Arabic |
| `fr` | French |
| `es` | Spanish |
| `tr` | Turkish |
| `el` | Greek |
| `bg` | Bulgarian |
| `zh` | Chinese (Mandarin) |
| `pt` | Portuguese |
| `pl` | Polish |
| `bn` | Bengali |
| `gu` | Gujarati |
| `pa` | Punjabi |
| `ur` | Urdu |

Translation files are in `i18n/messages/{locale}.json`. Auto locale detection is controlled by `NEXT_PUBLIC_LOCALE_DETECTION`.

---

## Real-time Features

Real-time functionality is powered by **Socket.IO** running on the custom `server.js` alongside Next.js.

Events cover:
- New chat messages
- Job status updates (accepted, completed, cancelled)
- Order status changes
- Live delivery location tracking
- In-app notifications

The `useSocket` hook (`hooks/useSocket.js`) manages the client-side connection.

---

## Payments & Subscriptions

### One-time Payments (Stripe Checkout)
- Job payments and tips
- Shop/restaurant order payments
- Restaurant reservation deposits

### Stripe Connect (Provider Payouts)
- Providers link their Stripe account via `/api/stripe-connect`
- Earnings are tracked in wallets and paid out on demand via `/api/payouts/pay`

### Subscriptions
- Tiered plans with feature limits tracked in `plan_features` and `user_usage`
- Free trial support
- Billing history and invoice management
- Stripe webhook handles all lifecycle events at `/api/subscription/webhook`

### Affiliate Program
- Commission percentage configured per affiliate in `affiliate_settings`
- Commissions recorded automatically on qualifying orders

---

## File Uploads

File storage is handled via **AWS S3** with pre-signed URLs. Utilities are in `utils/s3Helper.js`.

Used for:
- Provider verification documents
- Shop and product images
- Restaurant gallery photos
- User profile photos

---

## Maps & Location

- **Mapbox GL** — Delivery route visualization (`MapboxDeliveryMap.js`)
- **Google Maps** — Location picking and geocoding (`useGoogleMaps.js`, `utils/geocode.js`)
- Provider location is updated live via `POST /api/providers/location`

---

## Deployment

### Docker

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d
```

### Manual Production Deploy

```bash
npm run build
npm start
```

### PM2 (Process Manager)

```bash
npm run build
pm2 start npm --name "ivan-app" -- run live
pm2 logs ivan-app
pm2 list
pm2 stop ivan-app
pm2 delete ivan-app
```

### Production Checklist
- Set `NODE_ENV=production`
- Set `NEXTAUTH_URL` to your public domain
- Register Stripe webhook: `https://your-domain.com/api/subscription/webhook`
- Allowlist your domain in AWS S3 CORS settings

---

## Mobile App

A companion React Native mobile app is in `mobile/react-native/`. It shares the same backend API as the web platform.

```bash
cd mobile/react-native
npm install
npm run dev
```

---

## Additional Documentation

- [Chat Implementation](docs/CHAT_IMPLEMENTATION.md)
- [Pricing System](docs/PRICING_SYSTEM.md)
- [Subscription Implementation](docs/SUBSCRIPTION_IMPLEMENTATION.md)
- OpenAPI Reference: `http://localhost:3001/docs/openapi` _(when running locally)_
