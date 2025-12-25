# Badminton Photo Gallery

A modern photo gallery application built with Next.js, PostgreSQL, and Cloudinary for badminton events.

## Features

- **Admin Panel**: Upload and manage photos
- **User Gallery**: View photos in a beautiful grid layout
- **Authentication**: Secure login with NextAuth.js
- **Cloud Storage**: Images stored on Cloudinary (free tier available)
- **Database**: PostgreSQL with Prisma ORM
- **Error Tracking**: Sentry integration
- **Infrastructure as Code**: Pulumi configuration for cloud deployment

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui design system
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Image Storage**: Cloudinary (free alternative to AWS S3)
- **Error Tracking**: Sentry
- **Deployment**: Vercel-ready
- **Infrastructure**: Pulumi (optional for production)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Cloudinary account (free tier available at https://cloudinary.com)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Digberi/badminton.git
cd badminton
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and fill in your values:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for development)
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- Cloudinary credentials from your Cloudinary dashboard
- Sentry DSN (optional, for error tracking)

4. Set up the database:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

5. Create an admin user:
```bash
npx prisma studio
```
Then manually create a user with `role: ADMIN` and a hashed password.

Or use this script:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 10).then(hash => console.log(hash));"
```
Then add the user via Prisma Studio with the hashed password.

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
badminton/
├── src/
│   ├── app/
│   │   ├── admin/          # Admin panel for uploading photos
│   │   ├── auth/           # Authentication pages
│   │   ├── gallery/        # Public photo gallery
│   │   ├── api/            # API routes
│   │   └── ...
│   ├── components/         # Reusable React components
│   ├── lib/               # Utility functions and configurations
│   └── types/             # TypeScript type definitions
├── prisma/
│   └── schema.prisma      # Database schema
├── infrastructure/        # Pulumi infrastructure code
└── ...
```

## Features in Detail

### Admin Panel
- Secure login required
- Upload photos with title and description
- Preview before upload
- View recent uploads
- Images automatically uploaded to Cloudinary

### User Gallery
- Browse all photos in a responsive grid
- Click to view full-size images
- Modal view with details
- Responsive design for mobile and desktop

### Authentication
- Credentials-based authentication with NextAuth.js
- Role-based access control (ADMIN/USER)
- Secure password hashing with bcryptjs

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set all variables from `.env.example` in your Vercel project settings.

## Database Migration

For production, use:
```bash
npx prisma migrate deploy
```

## Cloudinary Setup

1. Sign up at [Cloudinary](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret from the dashboard
3. Add them to your `.env` file
4. The app will automatically upload images to Cloudinary

**Why Cloudinary?**
- Free tier: 25GB storage, 25GB bandwidth/month
- Easy to migrate to AWS S3 later if needed
- Built-in image transformations and optimizations
- CDN included

## Infrastructure with Pulumi (Optional)

For production deployment with infrastructure as code:

```bash
cd infrastructure
npm install
pulumi up
```

This will provision:
- PostgreSQL database on Google Cloud SQL
- (Can be extended for other cloud resources)

## Future Enhancements

This is the basic framework. Future features could include:
- Photo categories/albums
- Comments on photos
- Likes and favorites
- Advanced search and filtering
- Photo editing capabilities
- Bulk upload
- Video support
- Social sharing

## License

MIT