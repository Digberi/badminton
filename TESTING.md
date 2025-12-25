# Testing Guide

## Manual Testing (No Database Required)

To test the basic structure without setting up a database:

### 1. Check Build
```bash
npm run build
```
✓ Should complete successfully

### 2. Check Linting
```bash
npm run lint
```
✓ Should show no errors

### 3. Visual Inspection
Review the created pages:
- `src/app/page.tsx` - Home page
- `src/app/gallery/page.tsx` - Gallery view
- `src/app/admin/page.tsx` - Admin upload interface
- `src/app/auth/signin/page.tsx` - Sign in page

## Full Integration Testing (Requires Setup)

### Prerequisites
1. PostgreSQL database running
2. Cloudinary account with credentials
3. Environment variables configured

### Setup Test Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with test credentials
# Use a separate test database

# Initialize test database
npm run db:push

# Create test admin user
npm run create-admin
# Enter: admin@test.com / TestPassword123
```

### Run Application
```bash
npm run dev
```

### Test Scenarios

#### 1. Home Page
- Visit http://localhost:3000
- ✓ Should see welcome page with navigation
- ✓ Click "View Gallery" and "Admin Panel" buttons work

#### 2. Gallery (Empty State)
- Visit http://localhost:3000/gallery
- ✓ Should see "No photos yet" message
- ✓ Navigation bar displays correctly

#### 3. Sign In
- Visit http://localhost:3000/auth/signin
- Try invalid credentials
  - ✓ Should show error message
- Enter admin credentials
  - ✓ Should redirect to admin panel

#### 4. Admin Panel (Upload)
- Must be signed in as admin
- Visit http://localhost:3000/admin
- Fill in form:
  - Title: "Test Photo"
  - Description: "Testing upload functionality"
  - Select an image file
- ✓ Should show preview
- Click "Upload Photo"
- ✓ Should show success message
- ✓ Photo appears in "Recent Uploads"
- ✓ Photo appears in Cloudinary dashboard

#### 5. Gallery (With Photos)
- Visit http://localhost:3000/gallery
- ✓ Should display uploaded photos in grid
- Click on a photo
  - ✓ Should open modal with full-size image
  - ✓ Shows title and description
- Click outside modal
  - ✓ Modal closes

#### 6. Sign Out
- In admin panel, click "Sign Out"
- ✓ Should return to sign in page
- Try accessing /admin directly
  - ✓ Should redirect to sign in

#### 7. Non-Admin Access
- Create regular user with role "USER"
- Sign in as regular user
- Visit /admin
  - ✓ Should redirect to home (not authorized)

## API Endpoint Testing

You can test API endpoints with curl or Postman:

### Get All Photos
```bash
curl http://localhost:3000/api/photos
```
Response: Array of photo objects

### Upload Photo (requires authentication)
```bash
curl -X POST http://localhost:3000/api/photos \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "title=Test Photo" \
  -F "description=Test Description"
```

## Performance Testing

### Image Upload Performance
- Test with various image sizes:
  - Small: < 500KB
  - Medium: 1-5MB
  - Large: 5-10MB
- ✓ All should upload successfully
- ✓ Cloudinary should optimize automatically

### Page Load Performance
```bash
# Build for production
npm run build
npm run start
```
- Check Lighthouse scores
- Gallery should load efficiently
- Images should lazy load

## Security Testing

### Authentication
- ✓ Cannot access /admin without login
- ✓ Cannot access /api/photos POST without admin role
- ✓ Passwords are hashed (check in database)
- ✓ Session expires correctly

### Authorization
- ✓ Regular users cannot upload photos
- ✓ Only admins can POST to /api/photos
- ✓ API validates user role

### Input Validation
- Try uploading non-image files
  - ✓ Should reject
- Try uploading very large files
  - ✓ Should handle appropriately
- Try SQL injection in title/description
  - ✓ Prisma protects against this

## Browser Compatibility

Test in:
- ✓ Chrome/Edge (latest)
- ✓ Firefox (latest)
- ✓ Safari (latest)
- ✓ Mobile browsers (iOS Safari, Chrome Android)

## Responsive Design

Test at various breakpoints:
- ✓ Mobile (375px)
- ✓ Tablet (768px)
- ✓ Desktop (1024px+)
- ✓ Large desktop (1440px+)

## Error Handling

### Database Connection Error
- Stop database
- Try to access any page
- ✓ Should show appropriate error
- ✓ Sentry should capture error (if configured)

### Cloudinary Error
- Use invalid Cloudinary credentials
- Try to upload photo
- ✓ Should show error message
- ✓ Should not crash application

### Network Errors
- Test with slow network (DevTools throttling)
- ✓ Loading states display correctly
- ✓ Timeouts handled gracefully

## Automated Testing (Future Enhancement)

Currently no automated tests, but recommended setup:

```bash
# Add testing dependencies
npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom

# Add to package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

Example test structure:
```
tests/
  ├── unit/
  │   ├── lib/
  │   └── components/
  ├── integration/
  │   └── api/
  └── e2e/
      └── gallery.spec.ts
```

## Checklist for Production

Before deploying to production:

- [ ] All manual tests pass
- [ ] Build completes without errors
- [ ] Linting passes
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Admin user created
- [ ] Cloudinary configured and tested
- [ ] Sentry configured (optional)
- [ ] Error pages tested
- [ ] Mobile responsive design verified
- [ ] Performance acceptable
- [ ] Security checklist completed
- [ ] Backup strategy in place
- [ ] Monitoring configured

## Known Limitations

1. No automated tests yet (manual testing required)
2. No rate limiting on uploads (consider adding)
3. No image compression before upload (Cloudinary handles)
4. No bulk upload feature (single file at a time)
5. No photo deletion feature (admin can delete from Cloudinary dashboard)
6. No user registration (admin creates users manually)

## Troubleshooting Common Issues

### "Cannot connect to database"
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Run `npm run db:push`

### "Failed to fetch photos"
- Check browser console for errors
- Verify API route is working
- Check database has data

### "Upload failed"
- Check Cloudinary credentials
- Check file size and format
- Check browser console for errors
- Verify admin is logged in

### "Module not found"
- Run `npm install`
- Delete node_modules and reinstall
- Check import paths

## Support

For issues or questions:
1. Check this testing guide
2. Check DEPLOYMENT.md
3. Check README.md
4. Review error messages in browser console
5. Check Sentry dashboard (if configured)
