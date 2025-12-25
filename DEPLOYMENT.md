# Deployment Guide

## Quick Start (Development)

### 1. Prerequisites
- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Cloudinary account (free at https://cloudinary.com)

### 2. Installation Steps

```bash
# Clone the repository
git clone https://github.com/Digberi/badminton.git
cd badminton

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Initialize database
npm run db:push

# Create an admin user
npm run create-admin

# Run development server
npm run dev
```

Visit http://localhost:3000

## Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/badminton"

# Next Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Cloudinary (get from https://cloudinary.com/console)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN="your-sentry-dsn"
```

## Production Deployment to Vercel

### 1. Prepare Your Database

Option A: Use a managed PostgreSQL service:
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Supabase](https://supabase.com)
- [Neon](https://neon.tech)
- [Railway](https://railway.app)

Option B: Use Pulumi to provision infrastructure:
```bash
cd infrastructure
npm install
pulumi up
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

Or use the Vercel Dashboard:
1. Go to https://vercel.com
2. Import your GitHub repository
3. Add environment variables in project settings
4. Deploy

### 3. Set Environment Variables in Vercel

In your Vercel project settings, add all variables from `.env.example`:

- DATABASE_URL
- NEXTAUTH_URL (your production URL)
- NEXTAUTH_SECRET
- NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- NEXT_PUBLIC_SENTRY_DSN (optional)

### 4. Run Database Migration

After first deployment:

```bash
# Using Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy
```

Or set up automatic migrations in your Vercel build:
- Add to `package.json` scripts: `"vercel-build": "prisma migrate deploy && next build"`

### 5. Create Admin User

After deployment, you can create an admin user:

Option A: Use Prisma Studio locally with production database:
```bash
npx prisma studio
```

Option B: Create a temporary admin creation endpoint (remove after use):
```typescript
// src/app/api/setup-admin/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  // Add security: only allow if no users exist
  const userCount = await prisma.user.count()
  if (userCount > 0) {
    return NextResponse.json({ error: 'Setup already completed' }, { status: 400 })
  }

  const { email, password, name } = await request.json()
  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'ADMIN',
    },
  })

  return NextResponse.json({ success: true, userId: user.id })
}
```

## Cloudinary Setup

1. Sign up at https://cloudinary.com (Free tier: 25GB storage, 25GB bandwidth/month)
2. Go to Dashboard
3. Copy:
   - Cloud Name
   - API Key
   - API Secret
4. Add to your `.env` file

## Database Setup

### Local PostgreSQL

```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql

# Create database
createdb badminton

# Update DATABASE_URL in .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/badminton"

# Run migrations
npm run db:push
```

### Supabase (Recommended for production)

1. Create account at https://supabase.com
2. Create new project
3. Go to Settings > Database
4. Copy connection string (Transaction pooler)
5. Add to DATABASE_URL in Vercel

### Vercel Postgres

1. In Vercel Dashboard, go to Storage
2. Create Postgres database
3. Connect to your project
4. Environment variables are auto-added

## Monitoring with Sentry

1. Create account at https://sentry.io
2. Create new project (Next.js)
3. Copy DSN
4. Add to environment variables:
   - NEXT_PUBLIC_SENTRY_DSN
   - SENTRY_ORG
   - SENTRY_PROJECT
   - SENTRY_AUTH_TOKEN

## Security Checklist

- [ ] Set strong NEXTAUTH_SECRET (use `openssl rand -base64 32`)
- [ ] Use production database credentials (not development)
- [ ] Set up database connection pooling for serverless
- [ ] Configure Cloudinary upload presets with restrictions
- [ ] Set up CORS if needed
- [ ] Enable Sentry error tracking
- [ ] Set up database backups
- [ ] Use environment variables for all secrets
- [ ] Never commit `.env` file
- [ ] Set up rate limiting for uploads (future enhancement)

## Troubleshooting

### Build fails on Vercel
- Check all environment variables are set
- Check DATABASE_URL is accessible
- Check Node.js version (should be 18+)

### Database connection fails
- Check DATABASE_URL format
- Ensure database allows external connections
- For serverless, use connection pooling URL

### Images not uploading
- Check Cloudinary credentials
- Check file size limits
- Check network connectivity
- Check API key permissions

### Auth not working
- Check NEXTAUTH_URL matches your domain
- Check NEXTAUTH_SECRET is set
- Clear browser cookies and try again

## Performance Tips

1. **Image Optimization**: Cloudinary auto-optimizes images
2. **Database Indexing**: Already configured in Prisma schema
3. **Caching**: Consider adding Redis for session storage in high-traffic scenarios
4. **CDN**: Vercel includes CDN, Cloudinary has global CDN
5. **Connection Pooling**: Use Prisma Data Proxy or PgBouncer for serverless

## Scaling Considerations

- **Database**: Start with Supabase or Vercel Postgres, scale as needed
- **Images**: Cloudinary free tier handles 25GB/month, upgrade as needed
- **Compute**: Vercel scales automatically
- **Alternative to Cloudinary**: Can migrate to AWS S3 + CloudFront later

## Cost Estimates (Starting)

- **Vercel**: Free tier for hobby projects
- **Cloudinary**: Free tier (25GB storage, 25GB bandwidth/month)
- **Supabase**: Free tier (500MB database, 1GB bandwidth)
- **Sentry**: Free tier (5k errors/month)

**Total**: $0/month to start, scales with usage
