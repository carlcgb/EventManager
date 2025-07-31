# Steps to Enable Google Calendar Integration

## Why Deployment is Required
Google OAuth requires an HTTPS URL for security. In development (localhost), Google won't allow the authentication flow to complete.

## What to Do:

### 1. Deploy the Application
- Click the "Deploy" button in Replit
- Your app will get a public HTTPS URL like: `https://your-app.replit.app`

### 2. After Deployment
Once deployed with an HTTPS URL:
1. Go to "Paramètres > Intégrations calendrier" 
2. Click "Connecter" (button will now be enabled)
3. Authorize access to your Google Calendar
4. Create events - they'll sync automatically with 🤠 emoji

### 3. What Will Work
- ✅ Button "Connecter Google" becomes active
- ✅ Google OAuth authorization flow works
- ✅ Events sync to your personal Google Calendar
- ✅ Automatic reminders (1 day + 1 hour before)
- ✅ Events marked with cowboy emoji 🤠

## Current Status
- 🔧 Technical setup: Complete (API keys configured)
- 👤 User authentication: Complete (Replit Auth working)
- 📅 Calendar permission: Blocked (needs HTTPS deployment)

The app is ready - deployment will unlock Google Calendar sync!