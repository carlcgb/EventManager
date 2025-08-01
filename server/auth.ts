import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import admin from "firebase-admin";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "fallback-secret-for-dev",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      });
    } catch (error) {
      console.error("Firebase Admin initialization error:", error);
    }
  }
}

export function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  
  // Initialize Firebase Admin
  initializeFirebaseAdmin();

  // Google OAuth login route
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { idToken, accessToken } = req.body;
      
      if (!idToken) {
        return res.status(400).json({ message: "Token ID requis" });
      }

      // Verify the Firebase token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const { email, name, picture } = decodedToken;

      if (!email) {
        return res.status(400).json({ message: "Email requis depuis Google" });
      }

      // Check if user exists, create if not
      let user = await storage.getUserByEmail(email);
      
      if (!user) {
        // Extract first/last name from Google name
        const nameParts = (name || email.split('@')[0]).split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        user = await storage.createUser({
          email,
          firstName,
          lastName,
          profileImageUrl: picture || null,
          password: '', // Not used for Google auth
        });
      } else {
        // Update user profile image if it changed
        if (picture && user.profileImageUrl !== picture) {
          await storage.updateUser(user.id, { profileImageUrl: picture });
          user.profileImageUrl = picture;
        }
      }

      // Store user in session
      (req.session as any).userId = user.id;

      // Create or update Google Calendar integration if accessToken is provided
      if (accessToken) {
        try {
          console.log("Creating/updating Google Calendar integration for user:", user.email);
          
          // Check if user already has a Google Calendar integration
          const existingIntegration = await storage.getActiveCalendarIntegration(user.id, 'google');
          
          if (existingIntegration) {
            // Update existing integration with new token
            await storage.updateCalendarIntegration(existingIntegration.id, user.id, {
              accessToken: accessToken,
              isActive: true,
              expiresAt: new Date(Date.now() + 3600 * 1000) // 1 hour from now
            });
            console.log("Updated existing Google Calendar integration");
          } else {
            // Create new integration
            await storage.createCalendarIntegration({
              userId: user.id,
              provider: 'google',
              accessToken: accessToken,
              refreshToken: null,
              expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
              calendarId: 'primary',
              isActive: true
            });
            console.log("Created new Google Calendar integration");
          }
        } catch (calendarError) {
          console.error("Error setting up Google Calendar integration:", calendarError);
          // Don't fail the login if calendar integration fails
        }
      }
      
      res.json({ 
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        calendarIntegration: !!accessToken
      });
    } catch (error) {
      console.error("Google auth error:", error);
      res.status(401).json({ message: "Token Google invalide" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erreur lors de la déconnexion" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Déconnexion réussie" });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  let userId = (req.session as any)?.userId;
  
  // If no session user, check for Firebase token in Authorization header
  if (!userId) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const idToken = authHeader.substring(7);
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const { email } = decodedToken;
        
        if (email) {
          const user = await storage.getUserByEmail(email);
          if (user) {
            userId = user.id;
            // Optionally store in session for subsequent requests
            (req.session as any).userId = user.id;
          }
        }
      } catch (error) {
        console.error("Firebase token verification error:", error);
      }
    }
  }
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Store user in request for later use
  (req as any).user = user;
  next();
};