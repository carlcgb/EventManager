# Système de Gestion d'Événements

## Overview

This is a comprehensive event management web application built with a modern tech stack. The system allows users to create, manage, and publish events with advanced customization features and interactive social functionalities. Key features include Google Calendar integration, Google Maps location services, real-time notifications, user badge system, and social sharing capabilities. The application is designed with a Western theme and supports French localization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern component development
- **Vite** as the build tool and development server for fast development experience
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** with custom Western-themed color palette and styling
- **React Hook Form** with Zod validation for form handling

### Backend Architecture
- **Express.js** server with TypeScript
- **Session-based authentication** using express-session with PostgreSQL storage
- **RESTful API** design with proper error handling and middleware
- **Drizzle ORM** for database operations and schema management
- **WebSocket integration** for real-time notifications (currently disabled)

### Database Design
- **PostgreSQL** as the primary database
- **Drizzle migrations** for schema versioning
- Core tables: users, events, calendar_integrations, badges, user_badges, event_shares, user_stats, sessions
- **Session storage** table required for Replit Auth integration

### Authentication Strategy
- **Single-user access** - Restricted to samheberthumoriste@gmail.com only
- **Google-only authentication** via Firebase Auth for simplified user experience
- **Automatic Google Calendar integration** - calendar permissions requested during login
- **Session management** with secure HTTP-only cookies and PostgreSQL storage
- **Route protection** implemented on both client and server sides
- **Auto-calendar setup** - Google Calendar integration created automatically on login

### External Service Integrations
- **Google Calendar API** for bidirectional calendar synchronization
- **Google Maps API** for address autocomplete and location services
- **Google Places API** for venue suggestions with Quebec-specific fallbacks
- **Microsoft Graph API** for potential Microsoft Calendar integration

### State Management
- **TanStack Query** for server state with automatic caching and invalidation
- **React Hook Form** for form state management
- **React Context** for authentication state and notifications

### UI/UX Design
- **Western theme** with custom color variables and styling
- **Responsive design** with mobile-first approach
- **Accessibility** through Radix UI components
- **Toast notifications** for user feedback
- **Modal dialogs** for event details and editing

### Development Environment
- **Replit-optimized** with cartographer plugin for development
- **Hot module replacement** via Vite
- **TypeScript** strict mode enabled
- **Path aliases** configured for clean imports

### Build and Deployment
- **Production build** via Vite with esbuild for server bundling
- **Static asset serving** in production mode
- **Environment variable** configuration for API keys and database connections

## External Dependencies

### Core Frameworks and Libraries
- **React 18** - Frontend UI library
- **Express.js** - Backend web framework
- **TypeScript** - Type safety across the application
- **Vite** - Build tool and development server
- **Drizzle ORM** - Database ORM with PostgreSQL support

### Database and Storage
- **PostgreSQL** - Primary database (Neon serverless)
- **express-session** - Session management
- **connect-pg-simple** - PostgreSQL session store

### Authentication Services
- **Replit Auth** - OpenID Connect authentication
- **Firebase Auth** - Google authentication
- **Passport.js** - Authentication middleware
- **bcryptjs** - Password hashing

### External APIs
- **Google Calendar API** - Calendar synchronization
- **Google Maps API** - Location services and directions
- **Google Places API** - Address autocomplete
- **Microsoft Graph API** - Microsoft services integration

### UI Component Libraries
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Pre-built component library
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

### Form and Validation
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **@hookform/resolvers** - Form validation integration

### Data Fetching and State
- **TanStack Query** - Server state management
- **date-fns** - Date manipulation and formatting

### Development Tools
- **@replit/vite-plugin-cartographer** - Replit development integration
- **@replit/vite-plugin-runtime-error-modal** - Error handling in development

### Recent Changes
- **Modern color scheme** - Updated to purple/violet theme with improved contrast and readability
- **French date format** - Updated to display dates as "17 NOVEMBRE 2025" throughout the application
- **Date-only format** - Changed from timestamp to date-only for simplified user experience
- **Automatic Google Calendar integration** - No manual connection required, integrated on login
- **Simplified event creation** - Removed time component, events are now date-only
- **All-day calendar events** - Google Calendar events created as all-day events
- **Direct Google authentication** - Removed intermediate login page, authentication now happens directly from landing page
- **Single-user authentication** - Restricted access to samheberthumoriste@gmail.com only
- **Tickets URL functionality** - Added tickets URL field to events with validation and display on event pages
- **Removed "Publier sur le site web"** - Simplified form by removing website publishing checkbox
- **Enhanced Google Calendar UI** - Improved integration display with management options
- **CSS fixes** - Resolved @apply directive issues in Tailwind CSS configuration
- **Date timezone fix** - Corrected date formatting to prevent timezone issues showing dates 1 day earlier
- **Venue field ordering** - "Adresse complète" field positioned before "Nom du bar/lieu" for optimal workflow
- **Auto-fill venue name** - Implemented intelligent extraction of venue names from address autocomplete selections
- **Google Places fallback** - Added Quebec venue suggestions when API restrictions prevent Google Places usage

### Build and Bundling
- **esbuild** - Fast JavaScript bundler for production
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing