# Fleet Management System

## Overview

This is a full-stack fleet management system built with React and Express. The application helps manage vehicles, drivers, maintenance records, expenses, and documentation for a transportation fleet. It features a modern, responsive interface with real-time data management capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a monorepo structure with clear separation between client and server code:

### Directory Structure
- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript schemas and types
- Database configuration and migrations at root level

### Technology Stack
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui components
- **Backend**: Express.js, TypeScript, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **Routing**: Wouter (lightweight React router)
- **Styling**: TailwindCSS with CSS variables for theming

## Key Components

### Frontend Architecture
- **Component Library**: Uses shadcn/ui components built on Radix UI primitives
- **State Management**: TanStack Query handles server state, local state managed with React hooks
- **Routing**: Wouter provides client-side routing with a simple API
- **Forms**: React Hook Form with Zod schema validation for type safety
- **Styling**: TailwindCSS with custom design system using CSS variables

### Backend Architecture
- **API Structure**: RESTful API with Express.js
- **Data Layer**: Drizzle ORM with PostgreSQL database
- **Type Safety**: Shared TypeScript schemas between frontend and backend
- **Storage Interface**: Abstract storage interface for data operations

### Database Schema
The system manages five main entities:
- **Vehicles**: Fleet vehicles with status tracking
- **Drivers**: Driver information and license management
- **Maintenance Records**: Service history and scheduling
- **Expenses**: Financial tracking by category
- **Driver Documents**: Document management with expiry tracking

## Data Flow

1. **Client Requests**: Frontend makes API calls using TanStack Query
2. **API Layer**: Express routes handle HTTP requests and validate data
3. **Business Logic**: Server processes requests using storage interface
4. **Database**: Drizzle ORM handles database operations with PostgreSQL
5. **Response**: Data flows back through the same layers with proper typing

### Key Features
- Real-time dashboard with fleet metrics
- Vehicle management with status tracking
- Driver management with license expiry alerts
- Maintenance scheduling and history
- Expense tracking and reporting
- Document management with expiry notifications

## External Dependencies

### Database
- **PostgreSQL**: Primary database using Neon serverless
- **Drizzle ORM**: Type-safe database operations
- **Connection**: Uses `@neondatabase/serverless` for database connectivity

### UI Components
- **Radix UI**: Unstyled, accessible component primitives
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library for UI elements

### Development Tools
- **Vite**: Build tool and development server
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Production bundling for server code

## Deployment Strategy

### Development Mode
- Vite dev server serves the frontend
- Express server runs the API
- Hot module replacement for rapid development
- Development-specific error overlays and debugging tools

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: ESBuild bundles server code for Node.js
- **Database**: Migrations handled via Drizzle Kit
- **Environment**: Configured for Node.js production environment

### Key Scripts
- `dev`: Runs development server with hot reload
- `build`: Creates production builds for both frontend and backend
- `start`: Runs production server
- `db:push`: Applies database schema changes

The application is designed to be deployed on platforms like Replit with support for PostgreSQL databases and can easily scale with proper database provisioning.