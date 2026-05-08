# freebites
Personalized free food calendar for the Greater Toronto Area. Enter your birthday once and get a year-round calendar of every free food deal available, birthday freebies, national food days, and recurring weekly specials. No account required.

## Features
- Calendar view with month grid showing every deal day, colour-coded by type, with bottom-sheet detail modals
- Map view with custom Mapbox pins per restaurant category and live filter/search over 56 locations
- Birthday-aware validity engine computing 6 distinct window types per chain
- Filter by tier (free, free with purchase, discount), signup type, and category
- localStorage-based user state, zero auth, no tracking

## Tech Stack
- **Framework**: Next.js 16 (App Router), TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Database**: PostgreSQL (Neon serverless) via Prisma 7.8
- **Maps**: Mapbox GL JS 3
- **Animation**: Framer Motion 12
- **Dates**: date-fns 4
- **Testing**: Vitest
- **Deployment**: Vercel

## Data
- 56 GTA restaurant chains across 6 categories (Coffee & Drinks, Bakeries & Sweets, Fast Food, Sit-Down, Ice Cream, Convenience)
- 110+ verified deals, 67 birthday freebies, 43 national food days, plus recurring weekly specials
- 3 deal tiers: Tier 1 (truly free), Tier 2 (free with purchase), Tier 3 (deals/discounts)

## Validity Engine

Birthday deals support 6 window types, computed per user per month:

| Type | Example |
|---|---|
| `birthday_only` | Exact birthday only |
| `days_around` | 7 days before → 7 days after (Chatime) |
| `birthday_month` | Entire birth month (Buffalo Wild Wings) |
| `days_from_birthday` | Birthday → 1 day, lasting 30 days (Krispy Kreme) |
| `weeks_after` | Birthday through 6 weeks later (Crumbl) |
| `month_from_birthday` | Birthday through same date next month (Lindt) |

Cross-year boundaries handled (e.g. Dec 28 birthday with a 30-day window rolling into January). 150+ Vitest unit tests cover all edge cases.
## Getting Started
**Prerequisites**: Node.js 18+, PostgreSQL database (Neon or Supabase), Mapbox account

```
git clone https://github.com/your-username/freebites
cd freebites
npm install
```

### Environment Variables
Create `.env.local` with:
```
DATABASE_URL=your_postgres_url
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```
### Database Setup
```
npx prisma generate
npx prisma db push
npx prisma db seed
```
### Run
```
npm run dev
```
