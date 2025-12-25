# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed ([download](https://nodejs.org))
- PostgreSQL installed ([download](https://www.postgresql.org/download/))
- Git installed

### Step 1: Clone and Install
```bash
git clone https://github.com/Digberi/badminton.git
cd badminton
npm install
```

### Step 2: Database Setup
```bash
# Create database (if using local PostgreSQL)
createdb badminton

# Or use a free cloud database:
# - Supabase: https://supabase.com (recommended)
# - Neon: https://neon.tech
# - Railway: https://railway.app
```

### Step 3: Cloudinary Setup (Free)
1. Sign up at [cloudinary.com](https://cloudinary.com) (takes 1 minute)
2. Go to your [Dashboard](https://cloudinary.com/console)
3. Copy: Cloud Name, API Key, API Secret

### Step 4: Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/badminton"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### Step 5: Initialize Database
```bash
npm run db:push
```

### Step 6: Create Admin User
```bash
npm run create-admin
```
Enter:
- Name: Admin
- Email: admin@example.com
- Password: admin123 (change in production!)

### Step 7: Run the App
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🎯 What to Try

### 1. View the Home Page
- Beautiful landing page with navigation
- Links to gallery and admin panel

### 2. Browse Gallery
- Click "View Gallery"
- See "No photos yet" message (upload some first!)

### 3. Sign In as Admin
- Click "Admin Panel"
- Email: admin@example.com
- Password: admin123

### 4. Upload a Photo
- Fill in title: "My First Photo"
- Add description (optional)
- Select an image file
- Click "Upload Photo"
- ✅ Success! Photo uploaded to Cloudinary

### 5. View in Gallery
- Go back to Gallery
- See your uploaded photo
- Click to view full size

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx          # 🏠 Home page
│   ├── gallery/          # 📸 Photo gallery
│   ├── admin/            # 👨‍💼 Admin upload interface
│   ├── auth/             # 🔐 Sign in page
│   └── api/              # 🔌 API endpoints
├── lib/                  # 🛠️ Utilities
└── components/           # 🧩 UI components
```

## 🎨 Key Features

✅ **Photo Upload** - Admins can upload photos with title and description  
✅ **Photo Gallery** - Users can browse and view photos  
✅ **Authentication** - Secure login with role-based access  
✅ **Cloud Storage** - Images stored on Cloudinary CDN  
✅ **Responsive** - Works on mobile, tablet, and desktop  
✅ **TypeScript** - Type-safe code  
✅ **Modern Stack** - Next.js 15, React 19, Tailwind CSS  

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run linter

# Database
npm run db:push          # Push schema to database
npm run db:studio        # Open Prisma Studio GUI
npm run create-admin     # Create admin user
```

## 🚢 Deploy to Production

### Option 1: Vercel (Recommended - Free)
1. Push code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy! ✨

### Option 2: Manual
See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions

## 📚 Documentation

- [README.md](README.md) - Full documentation
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [TESTING.md](TESTING.md) - Testing guide

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check DATABASE_URL in `.env`
- Make sure PostgreSQL is running
- Try: `npm run db:push`

### "Module not found"
- Run: `npm install`
- Clear cache: `rm -rf node_modules package-lock.json && npm install`

### "Build failed"
- Check all environment variables are set
- Run: `npm run lint` to check for errors
- Check Node.js version: `node -v` (should be 18+)

### "Upload failed"
- Verify Cloudinary credentials in `.env`
- Check you're logged in as admin
- Check browser console for errors

## 🎓 Learn More

### Technologies Used
- [Next.js](https://nextjs.org) - React framework
- [Prisma](https://www.prisma.io) - Database ORM
- [NextAuth.js](https://next-auth.js.org) - Authentication
- [Cloudinary](https://cloudinary.com) - Image storage
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [TypeScript](https://www.typescriptlang.org) - Type safety

### Next Steps
1. ✅ Get the app running locally
2. ✅ Upload your first photo
3. 📖 Read the full documentation
4. 🎨 Customize the design
5. 🚀 Deploy to production
6. 🔧 Add new features

## 💡 Tips

- Use Prisma Studio to view/edit database: `npm run db:studio`
- Cloudinary free tier is generous: 25GB storage, 25GB bandwidth/month
- Keep `.env` file secret - never commit it to git
- Generate strong NEXTAUTH_SECRET: `openssl rand -base64 32`
- For production, use a managed database (Supabase, Neon, etc.)

## 🆘 Need Help?

1. Check the [documentation](README.md)
2. Review [troubleshooting](#🐛-troubleshooting)
3. Check browser console for errors
4. Check server logs in terminal
5. Create an issue on GitHub

## 🎉 You're Ready!

Your badminton photo gallery is ready to use! Start uploading photos and sharing with your community.

Happy coding! 🏸
