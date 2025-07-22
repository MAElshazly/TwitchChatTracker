# Replit.md

## Overview

This is a Twitch Chat Monitor application built with a full-stack TypeScript architecture. The application provides real-time monitoring of Twitch chat across multiple channels with filtering capabilities, statistics tracking, and a modern web interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with custom Twitch-themed color variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket connection for live chat updates

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Real-time**: WebSocket Server (ws library) for broadcasting chat messages
- **External Integration**: Twitch IRC client for connecting to Twitch chat channels

### Data Storage Solutions
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Database**: PostgreSQL (via Neon Database serverless)
- **Development Storage**: In-memory storage implementation for development/testing
- **Session Management**: PostgreSQL session store (connect-pg-simple)

## Key Components

### Database Schema
- **Channels**: Stores monitored Twitch channels with activity status and viewer counts
- **Chat Messages**: Stores chat messages with user metadata, timestamps, and moderation flags
- **Chat Filters**: Configurable filters for chat display (timestamps, mentions, bot filtering)

### External Integrations
- **Twitch IRC**: Anonymous connection to Twitch IRC servers for real-time chat monitoring
- **Neon Database**: Serverless PostgreSQL hosting

### UI Components
- **Chat Monitor**: Main dashboard for viewing live chat streams
- **Channel Manager**: Interface for adding/removing monitored channels
- **Chat Filters**: Controls for customizing chat display options
- **Connection Status**: Real-time connection status indicator
- **Chat Statistics**: Live metrics (messages/minute, unique users, etc.)

## Data Flow

1. **Chat Ingestion**: Twitch IRC client connects to channels and receives messages
2. **Message Processing**: Messages are parsed, stored in database, and broadcast via WebSocket
3. **Real-time Updates**: Frontend receives WebSocket events and updates UI reactively
4. **User Interaction**: Channel management and filter updates trigger API calls
5. **Statistics Calculation**: Real-time metrics computed from message streams

## External Dependencies

### Backend Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **ws**: WebSocket server implementation
- **express**: Web application framework

### Frontend Dependencies
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Headless UI primitives
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Minimalist routing

### Development Tools
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type safety across the stack
- **Drizzle Kit**: Database migrations and schema management

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds optimized production bundle to `dist/public`
- **Backend**: ESBuild bundles Node.js server to `dist/index.js`
- **Database**: Drizzle migrations manage schema changes

### Environment Configuration
- **Development**: Uses Vite dev server with HMR and Express backend
- **Production**: Serves static files from Express with API routes
- **Database**: Requires `DATABASE_URL` environment variable for PostgreSQL connection

### Key Scripts
- `npm run dev`: Development mode with hot reloading
- `npm run build`: Production build (frontend + backend)
- `npm run start`: Production server
- `npm run db:push`: Apply database schema changes

The application uses a monorepo structure with shared TypeScript definitions between client and server, enabling type-safe API communication and consistent data models across the full stack.