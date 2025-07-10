# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Definition

This project is a restaurant reservation management system designed exclusively for virtual assistants like Nora via an API. The system manages multi-tenant restaurant reservations, handling availability queries and automatic reservation creation with intelligent table assignment.

### Core Architecture

- **Backend**: Next.js 15 API Routes + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **UI Components**: Radix UI Themes + Tailwind CSS
- **Deployment**: Vercel (Next.js) + supabase database

### Key Design Principles

- **API-first**: No user interfaces, purely API-driven
- **Multi-tenant**: Each restaurant has its own configuration via API keys
- **Auto-confirmation**: Reservations are automatically created when availability permits
- **Smart table assignment**: System selects optimal tables based on capacity and availability

## Common Development Commands

```bash
# Development
npm run dev           # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database operations (when Prisma is fully set up)
npx prisma generate  # Generate Prisma client
npx prisma migrate   # Run database migrations
npx prisma studio    # Open Prisma Studio
```

## Code Organization

### Directory Structure

```
app/                 # Next.js app directory (pages and API routes)
  ├── (auth)/       # Authentication routes (Clerk)
  ├── api/          # API routes (when implemented)
  └── globals.css   # Global styles
actions/            # Server actions (currently empty)
services/           # Business logic layer (currently empty)
repositories/       # Database connectors
middleware.ts       # Clerk authentication middleware
```

### Database Schema

The system uses the following main entities:

- **restaurants**: Core tenant entity with API keys and settings
- **zones**: Optional table groupings (terrace, dining room, etc.)
- **tables**: Physical tables with capacity and zone assignment
- **schedules**: Weekly operating hours per restaurant
- **reservations**: Booking records with automatic table assignment
- **schedule_exceptions**: Special hours/closures (holidays, etc.)

### Business Logic Rules

1. **Reservation Duration**: Configurable per restaurant (default: 60 minutes)
2. **Buffer Time**: Minimum time between reservations (default: 15 minutes)
3. **Table Assignment**: Automatic selection based on capacity ≥ guest count
4. **No Overlaps**: Reservations cannot overlap including buffer time
5. **Operating Hours**: Reservations only within defined schedules
6. **Multi-tenancy**: All operations scoped by restaurant_id

## Development Guidelines

### Code Structure

- **File size limit**: Maximum 500 lines per file
- **Prefer server components**: Use Next.js server components when possible
- **Folder organization**: Group by feature/responsibility
- **Import style**: Use relative imports within packages, `@/*` for absolute paths

### Authentication

- Uses Clerk for authentication
- Middleware protects all routes except `/sign-in` and `/sign-up`
- Public routes are defined in `middleware.ts`

### Current State

The project is in early development with:
- ✅ Next.js 15 setup with TypeScript
- ✅ Clerk authentication configured
- ✅ Radix UI + Tailwind CSS styling
- ⚠️ Database layer not yet implemented (Prisma mentioned but no schema files present)
- ⚠️ API routes not yet implemented
- ⚠️ Services/repositories folders are empty

### Important Notes

- The database is specified as PostgreSQL but no Prisma schema is currently present
- The project mentions using Supabase but package.json shows no Supabase dependencies
- There's a typo in the directory name: "respositories" should be "repositories"
- No test framework is currently configured despite testing guidelines in the original file

### Next Steps for Implementation

When implementing core features:
1. Set up Prisma schema with the database entities
2. Create API routes for reservation management
3. Implement services layer for business logic
4. Add repository layer for database operations
5. Set up proper testing framework
6. Configure database connection (PostgreSQL/Supabase)