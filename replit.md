# Event Management System

## Overview

This is a full-stack event management application built with React, Express, and PostgreSQL. The system allows users to create, manage, and publish events with authentication via Replit Auth. It features a modern UI with shadcn/ui components and a Western-themed design.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and production builds
- **Routing**: Wouter for client-side routing
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom Western-themed color palette
- **State Management**: TanStack Query for server state management
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Style**: REST endpoints with JSON responses
- **Middleware**: Express middleware for logging, CORS, and request parsing

### Database Architecture
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Migrations**: Drizzle Kit for schema management
- **Connection**: Connection pooling with @neondatabase/serverless

## Key Components

### Authentication System
- **User Login**: Custom email/password authentication (replaced Replit Auth)
- **Session Management**: Express sessions with PostgreSQL storage
- **Password Security**: bcryptjs hashing with salt rounds
- **Security**: HTTP-only cookies with secure flags
- **Database**: User credentials stored in PostgreSQL users table
- **Calendar Integration**: Google OAuth for personal calendar access (separate from login)

### Event Management
- **CRUD Operations**: Full create, read, update, delete functionality with modal editing dialog
- **Event Properties**: Title, description, date, venue, publishing options
- **Status Workflow**: Draft → Pending → Published status progression
- **Statistics**: Event counts and status analytics
- **Venue Input**: Google Maps integration for location suggestions with Quebec fallback data
- **Calendar Integration**: Individual event synchronization with Google Calendar (includes emoji 🤠)

### UI Components
- **Design System**: shadcn/ui with consistent theming
- **Forms**: Validated forms with error handling and Google Maps venue suggestions
- **Modal Dialogs**: Event editing with comprehensive form validation
- **Notifications**: Toast notifications for user feedback
- **Navigation**: Dashboard buttons across all pages for easy navigation
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints

## Data Flow

1. **Authentication Flow**:
   - User registers with email/password or logs in with existing credentials
   - Password hashed with bcryptjs for security
   - Session created and stored in PostgreSQL
   - User data stored and managed in local database

2. **Event Management Flow**:
   - Form submission with client-side validation
   - API request to Express backend
   - Database operations through Drizzle ORM
   - Response with updated data
   - UI updates through TanStack Query cache

3. **Data Persistence**:
   - All data stored in PostgreSQL
   - Sessions table for authentication state
   - Users table for profile information
   - Events table for event data with foreign key relationships

## External Dependencies

### Development Dependencies
- **Vite**: Development server and build tool
- **TypeScript**: Type checking and compilation
- **ESBuild**: Production bundling for server code

### Runtime Dependencies
- **Database**: Neon PostgreSQL serverless
- **Authentication**: Custom email/password system with bcryptjs
- **UI Library**: Radix UI primitives
- **Validation**: Zod schema validation
- **Date Handling**: date-fns for date manipulation

### Third-party Integrations
- **Google APIs**: Full Calendar integration with OAuth2 and event synchronization
- **Google Maps**: Location suggestions for venue input (with Quebec-focused fallback)
- **Session Storage**: PostgreSQL with connect-pg-simple
- **Mobile OAuth**: Enhanced redirect handling for mobile devices
- **CSS Framework**: Tailwind CSS with PostCSS

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds static assets to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **Development**: Uses tsx for TypeScript execution
- **Production**: Compiled JavaScript with Node.js
- **Database**: Requires `DATABASE_URL` environment variable
- **Auth**: Custom email/password authentication with PostgreSQL session storage
- **Google Calendar**: Requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALENDAR_ID`
- **OAuth Status**: Google Calendar OAuth functional (deployed at https://evenements.replit.app)
- **Mobile Compatibility**: Enhanced OAuth flow for mobile devices
- **Google Maps Integration**: Location suggestions with fallback for venue input
- **Event Management**: Full CRUD operations including edit functionality

### File Structure
```
├── client/          # React frontend application
├── server/          # Express backend application
├── shared/          # Shared TypeScript schemas and types
├── migrations/      # Database migration files
└── dist/           # Production build output
```

The application follows a monorepo structure with clear separation between frontend, backend, and shared code. The build process creates a single deployable artifact with both static assets and server code.

## Recent Changes (August 1, 2025)

- **Authentication System Overhaul**: Completely replaced Replit Auth with custom email/password authentication
- **Database Migration**: All tables dropped and recreated to support new authentication schema
- **User Registration/Login**: New pages created with western-themed design for user registration and login
- **Password Security**: Implemented bcryptjs hashing for secure password storage
- **Session Management**: Updated to work with custom authentication system
- **API Routes**: Modified all protected routes to work with new user ID system