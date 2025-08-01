# Event Management System

## Overview

This is a comprehensive web application for creating and managing events with advanced customization and interactive social features. The system allows users to create, manage, and publish events with robust authentication, bidirectional calendar integration, and social functionalities. It features a western cowboy theme throughout the interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18 with TypeScript** - Modern React setup for type safety and component-based architecture
- **Vite** - Fast development server and build tool for optimal performance
- **Wouter** - Lightweight client-side routing solution
- **TanStack Query** - Server state management with caching, synchronization, and background updates
- **shadcn/ui with Radix UI** - Accessible component library for consistent UI patterns
- **Tailwind CSS** - Utility-first styling with custom western theme variables

### Backend Architecture
- **Express.js with TypeScript** - RESTful API server with type safety
- **Session-based Authentication** - Secure session management with PostgreSQL storage
- **Replit Auth Integration** - OpenID Connect authentication provider
- **RESTful API Design** - Standard HTTP methods for resource management
- **Real-time Features** - WebSocket integration for live notifications (currently disabled)

### Database Design
- **PostgreSQL with Drizzle ORM** - Type-safe database operations and schema management
- **Core Tables**:
  - Users (authentication and profile data)
  - Events (main event data with status workflow)
  - Calendar Integrations (external calendar connections)
  - Badges and User Badges (gamification system)
  - Event Shares (social sharing tracking)
  - User Stats (engagement metrics)
  - Sessions (authentication session storage)

### Event Management System
- **Event Lifecycle**: Draft → Pending → Published status workflow
- **Rich Event Data**: Title, description, date/time, venue with address suggestions
- **Publication Options**: Calendar sync, website publishing, notifications
- **CRUD Operations**: Full create, read, update, delete functionality with validation

### Authentication & Authorization
- **Replit Auth** - Primary authentication using OpenID Connect
- **Session Management** - Secure server-side sessions with PostgreSQL storage
- **Route Protection** - Both client and server-side authentication checks
- **Token Management** - Automatic token refresh and validation

## External Dependencies

### Authentication Services
- **Replit Auth** - OpenID Connect provider for user authentication
- **connect-pg-simple** - PostgreSQL session store for Express sessions

### Database & ORM
- **Neon Database** - Serverless PostgreSQL hosting
- **Drizzle ORM** - Type-safe database operations and migrations
- **@neondatabase/serverless** - Serverless database connection

### Calendar Integration
- **Google Calendar API** - Bidirectional calendar synchronization
- **Google Places API** - Address suggestions and location data
- **Microsoft Graph API** - Microsoft Calendar integration support
- **ical-generator** - iCalendar format generation

### Frontend Libraries
- **React Hook Form** - Form validation and management
- **Zod** - Runtime type validation and schema definition
- **date-fns** - Date manipulation and formatting
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library for consistent iconography

### Development Tools
- **TypeScript** - Type safety across the entire stack
- **Vite** - Development server and build tooling
- **Tailwind CSS** - Utility-first styling framework
- **ESBuild** - Fast JavaScript bundling for production

### Geographic Services
- **Google Maps Platform** - Address autocomplete and mapping
- **Quebec-specific fallback data** - Local address suggestions when API unavailable

### Build & Deployment
- **Replit deployment** - Native Replit hosting and domain management
- **Environment-based configuration** - Development and production environment handling