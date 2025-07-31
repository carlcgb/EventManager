# Firebase Deployment Guide - Sam Hébert Events App

## Overview
This guide explains how to deploy your full-stack event management application to Firebase Hosting + Functions.

## Prerequisites

1. **Firebase CLI installed globally**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Firebase project configured** with your API keys already set in Replit Secrets

## Deployment Steps

### 1. Configure Firebase Project

1. Update `.firebaserc` with your actual Firebase project ID:
   ```json
   {
     "projects": {
       "default": "your-actual-firebase-project-id"
     }
   }
   ```

### 2. Set Environment Variables

In your Firebase Functions configuration, set these environment variables:
```bash
firebase functions:config:set database.url="your-database-url"
```

### 3. Deploy

#### Option A: Automatic Deployment
```bash
node deploy-firebase.js
```

#### Option B: Manual Steps
```bash
# 1. Build frontend
npm run build

# 2. Install Functions dependencies
cd functions && npm install && cd ..

# 3. Build Functions
cd functions && npm run build && cd ..

# 4. Deploy
firebase deploy
```

## File Structure After Deployment

```
├── dist/public/          # Static files served by Firebase Hosting
├── functions/
│   ├── src/
│   │   ├── index.ts      # Firebase Functions API
│   │   └── schema.ts     # Database schema
│   ├── lib/              # Compiled JavaScript
│   └── package.json      # Functions dependencies
├── firebase.json         # Firebase configuration
└── .firebaserc          # Firebase project settings
```

## API Endpoints

After deployment, your API will be available at:
`https://your-region-your-project-id.cloudfunctions.net/api/`

### Available Endpoints:
- `GET /api/auth/user` - Get current user info
- `GET /api/events` - Get user's events
- `GET /api/events/public` - Get published events (for website integration)
- `POST /api/events` - Create new event
- `PATCH /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/stats` - Get event statistics

## Authentication

The app uses Firebase Authentication with Google Sign-in. Make sure your Firebase project has:

1. **Authentication enabled** with Google provider
2. **Authorized domains** including your Firebase hosting domain
3. **Proper OAuth configuration**

## Database Integration

Your PostgreSQL database (Neon) connection is handled through environment variables. The functions will connect to your existing database with all the event data.

## Website Integration

Use the PHP file (`events.php`) on your existing website to pull data from the Firebase Functions API:

```php
// Update the API endpoint in events.php
$api_url = 'https://your-region-your-project-id.cloudfunctions.net/api/events/public';
```

## Monitoring

- **Functions logs**: `firebase functions:log`
- **Hosting logs**: Available in Firebase Console
- **Database monitoring**: Through your Neon dashboard

## Cost Estimation

Firebase offers generous free tiers:
- **Hosting**: 10GB storage, 10GB transfer/month free
- **Functions**: 2M invocations, 400k GB-seconds/month free
- **Authentication**: Unlimited users on free tier

For a Quebec comedian website, this should cover typical traffic levels.

## Support

If you encounter issues:
1. Check Firebase Console for detailed error messages
2. Review function logs with `firebase functions:log`
3. Verify environment variables are set correctly
4. Ensure database connectivity from Functions environment