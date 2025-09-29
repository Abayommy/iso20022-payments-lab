# Deployment Guide - ISO 20022 Payments Lab

## Prerequisites

1. GitHub account
2. Vercel account (free tier works)
3. Your project pushed to GitHub

## Step 1: Prepare for Production

### 1.1 Update Configuration

Edit `/app/api/payments/route.ts` and set test mode to false:

```typescript
const TEST_CONFIG = {
  enabled: false,  // Changed from true
  speedMultiplier: 1,
  failureRate: 0,  // Set to 0 for production
  // ...
}
```

### 1.2 Create Production Environment File

Create `.env.production`:
```env
DATABASE_URL="file:./prod.db"
NODE_ENV="production"
```

### 1.3 Update .gitignore

Ensure these are in your `.gitignore`:
```
# Database
*.db
*.db-journal
prisma/dev.db
prisma/prod.db

# Environment
.env
.env.local
.env.production.local

# Dependencies
node_modules/

# Build
.next/
out/
build/

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/
```

### 1.4 Create Package Scripts

Update `package.json`:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate"
  }
}
```

## Step 2: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Production ready - ISO 20022 Payments Lab"

# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/iso20022-payments-lab.git

# Push to main branch
git push -u origin main
```

## Step 3: Deploy to Vercel

### 3.1 Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select the `iso20022-payments-lab` repository

### 3.2 Configure Build Settings

Vercel should auto-detect Next.js. Verify these settings:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build` or `prisma generate && next build`
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install`

### 3.3 Set Environment Variables

In Vercel dashboard, add:

```
DATABASE_URL=file:./prod.db
```

### 3.4 Deploy

Click "Deploy" and wait for the build to complete.

## Step 4: Post-Deployment Configuration

### 4.1 Test Your Deployment

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Create a test payment at `/compose`
3. Track it at `/payments`
4. Verify XML generation works

### 4.2 Custom Domain (Optional)

1. In Vercel dashboard, go to Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 4.3 Enable Production Mode Features

For production, consider:

1. **Remove Test Controls**: Comment out or conditionally render the test control panel in `/app/payments/page.tsx`:

```typescript
{process.env.NODE_ENV === 'development' && showControlPanel && (
  // Test control panel code
)}
```

2. **Add Authentication** (optional):

```bash
npm install next-auth
```

3. **Add Rate Limiting** (optional):

```typescript
// In API routes
import rateLimit from 'express-rate-limit'
```

## Step 5: Database Considerations

### SQLite Limitations on Vercel

SQLite works on Vercel but with limitations:
- Database resets on each deployment
- Not suitable for persistent production data

### Production Database Options

#### Option 1: Vercel Postgres (Recommended)

1. In Vercel dashboard, go to Storage
2. Create a Postgres database
3. Update your `schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

4. Update environment variables with Postgres URL

#### Option 2: PlanetScale

1. Create account at [planetscale.com](https://planetscale.com)
2. Create database
3. Get connection string
4. Update Prisma schema for MySQL:

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}
```

#### Option 3: Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Get database URL
3. Update environment variables

### Migration Command

After changing database:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

## Step 6: Monitoring & Maintenance

### 6.1 Enable Vercel Analytics

1. In Vercel dashboard, go to Analytics
2. Enable Web Analytics
3. Add to your app:

```bash
npm install @vercel/analytics
```

```typescript
// In app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 6.2 Set Up Error Monitoring

Consider adding Sentry for error tracking:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

## Deployment Checklist

- [ ] Test mode disabled in production
- [ ] Environment variables set
- [ ] Database configured
- [ ] Git repository created
- [ ] Pushed to GitHub
- [ ] Imported to Vercel
- [ ] Custom domain configured (optional)
- [ ] Production database set up
- [ ] Test controls removed/hidden
- [ ] Error monitoring enabled
- [ ] Analytics configured

## Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Issues

```bash
# Regenerate Prisma client
npx prisma generate
npx prisma db push
```

### Environment Variables Not Working

1. Check Vercel dashboard → Settings → Environment Variables
2. Redeploy after adding variables
3. Ensure variables are added for Production environment

## Security Considerations

1. **API Protection**: Add API key authentication for production
2. **Rate Limiting**: Implement rate limits on payment creation
3. **Input Validation**: Already implemented via Zod/validators
4. **CORS**: Configure appropriate CORS headers
5. **HTTPS**: Automatically enabled on Vercel

## Support & Maintenance

- Monitor Vercel dashboard for errors
- Check function logs for API issues
- Use Vercel CLI for local debugging:

```bash
npm install -g vercel
vercel dev
```

---

Your app is now ready for production deployment! 
