# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  - Next.js Pages (SSR/SSG)                                  │
│  - React Components                                          │
│  - Tailwind CSS                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                     Vercel Edge Network                      │
│  - CDN                                                       │
│  - DDoS Protection                                           │
│  - SSL/TLS                                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Application                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              API Routes (Serverless)                 │    │
│  │  - /api/auth/[...nextauth] - Authentication         │    │
│  │  - /api/photos - Photo CRUD operations              │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    Middleware                        │    │
│  │  - NextAuth.js - Session management                 │    │
│  │  - Sentry - Error tracking                          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
            ↓                               ↓
┌──────────────────────────┐    ┌──────────────────────────┐
│   PostgreSQL Database    │    │   Cloudinary CDN         │
│  - Users                 │    │  - Image Storage         │
│  - Photos (metadata)     │    │  - Image Optimization    │
│  - Sessions              │    │  - Image Delivery        │
│  - Accounts              │    │  - Transformations       │
└──────────────────────────┘    └──────────────────────────┘
            ↓
┌──────────────────────────┐
│   Sentry (Optional)      │
│  - Error Monitoring      │
│  - Performance Tracking  │
└──────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (React 19)
  - App Router for routing
  - Server Components for performance
  - API Routes for backend
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS for utility-first styling
- **UI Components**: shadcn/ui design system

### Backend
- **Runtime**: Node.js (serverless on Vercel)
- **API**: Next.js API Routes
- **Authentication**: NextAuth.js v4
  - Credentials provider
  - JWT sessions
  - Role-based access control

### Database
- **Database**: PostgreSQL (relational)
- **ORM**: Prisma
  - Type-safe queries
  - Migrations
  - Schema management

### Storage
- **Images**: Cloudinary
  - Cloud storage
  - Automatic optimization
  - CDN delivery
  - Image transformations

### Monitoring
- **Errors**: Sentry
  - Error tracking
  - Performance monitoring
  - Release tracking

### Infrastructure
- **Deployment**: Vercel
  - Serverless functions
  - Edge network
  - Automatic scaling
- **IaC**: Pulumi (optional)
  - Database provisioning
  - Cloud resources

## Data Flow

### Photo Upload Flow
```
1. Admin logs in → NextAuth creates session
2. Admin selects photo → Browser validation
3. Form submission → POST /api/photos
4. API verifies authentication → Check session
5. API verifies authorization → Check role = ADMIN
6. File conversion → ArrayBuffer to Buffer
7. Upload to Cloudinary → Cloudinary SDK
8. Cloudinary returns metadata → URL, size, format
9. Save to database → Prisma creates record
10. Response to client → Success + photo data
11. UI updates → Display new photo
```

### Photo Viewing Flow
```
1. User visits /gallery → Next.js renders page
2. Client fetches photos → GET /api/photos
3. API queries database → Prisma findMany
4. Database returns records → Photo metadata
5. Client receives data → JSON response
6. Render grid → Next.js Image component
7. Images load → From Cloudinary CDN
8. Click photo → Open modal
9. Full image loads → Optimized by Cloudinary
```

### Authentication Flow
```
1. User submits credentials → POST to NextAuth
2. NextAuth validates → Check email/password
3. Prisma queries database → Find user
4. bcrypt verifies password → Compare hashes
5. Create JWT token → Sign with secret
6. Set cookie → http-only, secure
7. Return session → User object
8. Redirect → Admin or requested page
```

## Database Schema

```prisma
User {
  id: String (CUID)
  email: String (unique)
  password: String (hashed)
  name: String?
  role: Enum (USER, ADMIN)
  photos: Photo[]
  sessions: Session[]
  accounts: Account[]
  createdAt: DateTime
  updatedAt: DateTime
}

Photo {
  id: String (CUID)
  title: String
  description: String?
  imageUrl: String (Cloudinary URL)
  publicId: String (Cloudinary ID)
  width: Int?
  height: Int?
  format: String?
  userId: String (FK → User)
  uploadedBy: User
  createdAt: DateTime
  updatedAt: DateTime
  
  Indexes: [userId, createdAt]
}

Session {
  id: String (CUID)
  sessionToken: String (unique)
  userId: String (FK → User)
  expires: DateTime
  user: User
}

Account {
  id: String (CUID)
  userId: String (FK → User)
  type: String
  provider: String
  providerAccountId: String
  // OAuth fields...
  
  Unique: [provider, providerAccountId]
}
```

## Security Architecture

### Authentication
- Password hashing: bcryptjs (10 rounds)
- Session tokens: JWT signed with NEXTAUTH_SECRET
- Cookie flags: httpOnly, secure, sameSite
- Session expiration: configurable

### Authorization
- Role-based access control (RBAC)
- Admin-only routes protected
- API endpoints validate user role
- Middleware redirects unauthorized users

### Data Protection
- Environment variables for secrets
- No secrets in code or git
- HTTPS only in production
- Input validation with Zod (ready)
- SQL injection protection (Prisma)
- XSS protection (React)

### Upload Security
- File type validation
- Size limits (configurable)
- Admin-only upload permission
- Cloudinary handles malware scanning

## Performance Optimizations

### Frontend
- Server Components (faster initial load)
- Image optimization (Next.js Image)
- Lazy loading images
- Code splitting (automatic)
- Static generation where possible

### Backend
- Serverless functions (scale to zero)
- Database connection pooling
- Indexed database queries
- Efficient Prisma queries

### Images
- Cloudinary CDN (global delivery)
- Automatic format optimization
- Responsive image sizes
- Browser caching

## Scalability

### Current Capacity
- Vercel: Unlimited requests (hobby tier)
- Cloudinary: 25GB storage, 25GB bandwidth/month (free)
- Database: Depends on provider

### Scaling Strategy
1. **Phase 1** (Current): Free tiers, suitable for 1K users
2. **Phase 2**: Paid tiers, 10K users
   - Upgrade Cloudinary
   - Upgrade database
   - Add Redis cache
3. **Phase 3**: Enterprise, 100K+ users
   - Multiple regions
   - CDN optimization
   - Database read replicas
   - Queue system for uploads

### Bottlenecks
1. Database connections (serverless)
   - Solution: Connection pooling (PgBouncer)
2. Cloudinary bandwidth
   - Solution: Upgrade plan or migrate to S3
3. Cold starts
   - Solution: Keep functions warm or use edge

## Folder Structure

```
badminton/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Authentication
│   │   │   └── photos/        # Photo CRUD
│   │   ├── admin/             # Admin pages
│   │   ├── auth/              # Auth pages
│   │   ├── gallery/           # Gallery pages
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   └── ui/                # UI components (shadcn)
│   ├── lib/                   # Utilities
│   │   ├── auth.ts            # Auth config
│   │   ├── prisma.ts          # Prisma client
│   │   ├── cloudinary.ts      # Cloudinary config
│   │   └── utils.ts           # Helper functions
│   └── types/                 # TypeScript types
│       └── next-auth.d.ts     # Auth types
├── prisma/
│   └── schema.prisma          # Database schema
├── infrastructure/            # Pulumi IaC
│   ├── index.ts
│   └── Pulumi.yaml
├── scripts/
│   └── create-admin.js        # Admin creation script
├── public/                    # Static files
├── .env.example               # Environment template
├── next.config.js             # Next.js config
├── tailwind.config.ts         # Tailwind config
├── tsconfig.json              # TypeScript config
└── package.json               # Dependencies
```

## API Design

### REST Endpoints

#### GET /api/photos
- Purpose: List all photos
- Auth: None (public)
- Response: Array of photo objects
```json
[{
  "id": "clxxx",
  "title": "Photo 1",
  "description": "...",
  "imageUrl": "https://res.cloudinary.com/...",
  "createdAt": "2024-01-01T00:00:00Z",
  "uploadedBy": {
    "name": "Admin",
    "email": "admin@example.com"
  }
}]
```

#### POST /api/photos
- Purpose: Upload new photo
- Auth: Required (Admin only)
- Content-Type: multipart/form-data
- Body: 
  - file: File (required)
  - title: String (required)
  - description: String (optional)
- Response: Created photo object

## Future Enhancements

### Phase 1 (Basic Features)
- [x] Photo upload
- [x] Photo gallery
- [x] Authentication
- [x] Admin panel

### Phase 2 (Enhancements)
- [ ] Photo deletion
- [ ] Photo editing (title, description)
- [ ] User registration
- [ ] Password reset
- [ ] Photo categories/albums
- [ ] Pagination
- [ ] Search

### Phase 3 (Advanced)
- [ ] Comments on photos
- [ ] Likes/favorites
- [ ] Social sharing
- [ ] Bulk upload
- [ ] Video support
- [ ] Advanced image editing
- [ ] Mobile app

## Monitoring & Observability

### Metrics to Track
- User signups
- Photos uploaded per day
- Page views
- Error rates
- API response times
- Database query performance
- Cloudinary usage

### Tools
- Sentry: Error tracking
- Vercel Analytics: Page views, performance
- Cloudinary Analytics: Storage, bandwidth
- Database provider metrics: Queries, connections

## Disaster Recovery

### Backups
- Database: Daily automated backups
- Photos: Stored in Cloudinary (redundant)
- Code: Git repository

### Recovery Plan
1. Database corruption: Restore from backup
2. Cloudinary issue: Images have publicId for re-upload
3. Vercel outage: Can deploy to other platforms
4. Complete disaster: Restore from backups + redeploy

## Development Workflow

```
1. Local Development
   ↓
2. Git Commit
   ↓
3. Push to GitHub
   ↓
4. Vercel Auto-Deploy (Preview)
   ↓
5. Testing on Preview
   ↓
6. Merge to Main
   ↓
7. Production Deployment
   ↓
8. Monitor (Sentry)
```

## License

MIT - See LICENSE file
