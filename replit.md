# Event Management System

## Overview

This is a comprehensive web application for event creation and management with advanced customization and interactive social features. The system allows users to create, manage, and publish events with a robust authentication system, bidirectional calendar integration, and social features including a badge system and real-time notifications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern React features
- **Vite** for fast development builds and hot module replacement
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management, caching, and synchronization
- **shadcn/ui** components built on Radix UI primitives for accessibility
- **Tailwind CSS** with custom western theme for styling
- **React Hook Form** with Zod validation for form handling

### Backend Architecture
- **Express.js** server with TypeScript
- **Replit Auth** using OpenID Connect for authentication
- **Session management** with PostgreSQL-based session storage
- **RESTful API** design with protected routes
- **WebSocket** integration for real-time notifications (currently disabled)

### Database Architecture
- **PostgreSQL** with Neon serverless hosting
- **Drizzle ORM** for type-safe database operations
- **Schema-driven** approach with shared types between frontend and backend

Key database tables:
- `users` - User accounts and profiles
- `events` - Event data with status workflow (draft → pending → published)
- `calendar_integrations` - Third-party calendar connections
- `badges` and `user_badges` - Gamification system
- `event_shares` - Social sharing tracking
- `user_stats` - User engagement metrics
- `sessions` - Secure session storage

### Authentication & Authorization
- **Replit Auth** with OpenID Connect flow
- **Session-based** authentication with secure HTTP-only cookies
- **Route protection** on both client and server sides
- **Token management** with automatic refresh handling

### Calendar Integration
- **Google Calendar API** with OAuth2 flow
- **Bidirectional synchronization** - events sync both ways
- **Automatic event creation** with cowboy emoji branding
- **Fallback data** for Quebec-specific locations when Google APIs are unavailable

### Geographic Features
- **Google Maps API** integration for address suggestions
- **Quebec-focused** fallback data for location services
- **Direct navigation** links to Google Maps for directions
- **Geocoding** support for venue locations

### Social Features
- **Badge system** with achievement tracking
- **Social sharing** across multiple platforms (Facebook, Twitter, LinkedIn, etc.)
- **User statistics** tracking events created, shares, and social score
- **Real-time notifications** via WebSocket (infrastructure ready, currently disabled)

### State Management
- **TanStack Query** for server state with caching and background updates
- **React Hook Form** for form state management
- **React Context** for global UI state (auth, notifications)
- **Local storage** for user preferences and session persistence

### Error Handling & Validation
- **Zod schemas** for runtime type validation shared between client and server
- **Comprehensive error boundaries** for graceful failure handling
- **Form validation** with real-time feedback
- **API error handling** with user-friendly messages

### Development & Build System
- **TypeScript** with strict configuration for type safety
- **ESBuild** for production builds
- **Path aliases** for clean imports
- **Hot reload** in development with Vite
- **Runtime error overlay** for development debugging

## External Dependencies

### Authentication Services
- **Replit Auth** - Primary authentication provider using OpenID Connect
- Session storage via PostgreSQL with `connect-pg-simple`

### Database Services
- **Neon** - Serverless PostgreSQL hosting with connection pooling
- **Drizzle Kit** - Database migrations and schema management

### Calendar Services
- **Google Calendar API** - Bidirectional event synchronization
- **Microsoft Graph API** - Alternative calendar integration (infrastructure ready)
- OAuth2 flows for secure calendar access

### Mapping & Location Services
- **Google Maps API** - Address suggestions and geocoding
- **Google Places API** - Location search and validation
- Fallback location data for Quebec regions

### UI & Component Libraries
- **Radix UI** - Accessible, unstyled component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **shadcn/ui** - Pre-built component system

### Development Tools
- **Vite** - Build tool and development server
- **TypeScript** - Type checking and compilation
- **ESLint/Prettier** - Code formatting and linting
- **Drizzle Kit** - Database schema management

### Third-party Integrations
- **Social media platforms** - Direct sharing links for Facebook, Twitter, LinkedIn, WhatsApp
- **Email sharing** - Mailto links for event sharing
- **WebSocket** infrastructure for real-time features (ready for activation)

### Runtime Dependencies
- **bcryptjs** - Password hashing for local authentication fallback
- **date-fns** - Date manipulation and formatting with French locale
- **nanoid** - Unique ID generation
- **memoizee** - Function memoization for performance optimization