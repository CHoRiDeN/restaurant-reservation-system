name: "Restaurant Reservation Conflict Prevention & Client Management System"
description: |

## Purpose
Implement robust table booking conflict prevention and comprehensive client management for a multi-tenant restaurant reservation system, ensuring zero double bookings and accurate availability tracking.

## Core Principles
1. **Database Integrity First**: Use PostgreSQL constraints as primary defense
2. **Multi-tenant Security**: Enforce restaurant-level data isolation
3. **Race Condition Prevention**: Handle concurrent booking attempts
4. **Accurate Availability**: Real-time table count calculations
5. **Follow CLAUDE.md**: Adhere to all established patterns and conventions

---

## Goal
Transform the restaurant reservation system to prevent any possibility of double booking the same table at the same time, while introducing comprehensive client management with proper foreign key relationships and accurate availability reporting.

## Why
- **Business Critical**: Prevent overbooking incidents that damage restaurant reputation and customer trust
- **Revenue Protection**: Accurate availability prevents lost bookings due to false "unavailable" responses
- **Operational Efficiency**: Automated table assignment reduces manual intervention
- **Customer Experience**: Clients can be tracked and managed for better service
- **Data Integrity**: Proper foreign key relationships enable future CRM features

## What
Enhanced reservation system with zero-tolerance conflict prevention:

### Core Features
1. **Conflict Prevention**: Database-level constraints prevent double booking
2. **Intelligent Table Assignment**: Automatic selection of optimal available tables
3. **Real-time Availability**: Accurate table counts in API responses
4. **Client Management**: Full CRUD operations for customer data
5. **Enhanced Error Handling**: Specific constraint violation responses

### Success Criteria
- [ ] Zero double bookings possible even under high concurrent load
- [ ] Availability API returns accurate available table counts
- [ ] Reservation creation automatically assigns optimal tables
- [ ] Client CRUD operations fully functional with validation
- [ ] All existing functionality preserved (backward compatibility)
- [ ] Comprehensive test coverage for edge cases and race conditions

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://supabase.com/docs/guides/database/postgres/row-level-security
  section: "Multi-tenant RLS patterns"
  why: "Security isolation between restaurants"

- url: https://stackoverflow.com/questions/74806321/booking-system-avoiding-double-insertion-postgresql
  why: "PostgreSQL strategies for preventing booking conflicts"
  critical: "Use unique constraints + optimistic concurrency rather than locking"

- url: https://oleg0potapov.medium.com/how-to-design-a-booking-system-to-avoid-overlapping-reservation-fe17194c1337
  section: "Database constraint patterns"
  why: "Time overlap detection algorithms and constraint design"

- file: /Users/danijimenez/Documents/projects/nora-reservation-system/repositories/database.ts
  why: "Repository patterns, Supabase client usage, existing conflict detection"
  
- file: /Users/danijimenez/Documents/projects/nora-reservation-system/services/reservations.ts
  why: "Service layer patterns, validation, error handling"
  
- file: /Users/danijimenez/Documents/projects/nora-reservation-system/app/api/restaurants/[restId]/reservations/route.ts
  why: "API route patterns, authentication, response formatting"

- file: /Users/danijimenez/Documents/projects/nora-reservation-system/migrations.sql
  why: "Database schema patterns, constraint syntax"

- file: /Users/danijimenez/Documents/projects/nora-reservation-system/lib/utils/responses.ts
  why: "Standardized API response patterns"

- docfile: /Users/danijimenez/Documents/projects/nora-reservation-system/CLAUDE.md
  why: "Project conventions, testing requirements, architecture patterns"
```

### Current Codebase Tree
```bash
├── app/api/restaurants/[restId]/
│   ├── availability/route.ts    # GET availability with table counts
│   └── reservations/route.ts    # POST reservation creation
├── services/
│   ├── availability.ts          # Business logic for availability checking
│   └── reservations.ts          # Business logic for reservation creation
├── repositories/
│   └── database.ts             # Supabase database operations
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Supabase client creation
│   │   └── types.ts            # TypeScript interfaces
│   ├── auth/api-auth.ts        # API key authentication
│   └── utils/responses.ts      # Standardized responses
└── migrations.sql              # Database schema
```

### Desired Codebase Tree with New Components
```bash
├── app/api/restaurants/[restId]/
│   ├── availability/route.ts    # ENHANCED: Return table counts
│   ├── reservations/route.ts    # ENHANCED: Client support, conflict handling
│   └── clients/                # NEW: Client management endpoints
│       ├── route.ts            # GET/POST clients
│       └── [clientId]/route.ts # GET/PUT/DELETE specific client
├── services/
│   ├── availability.ts          # ENHANCED: Accurate table counting
│   ├── reservations.ts          # ENHANCED: Auto table assignment
│   └── clients.ts              # NEW: Client CRUD operations
├── repositories/
│   └── database.ts             # ENHANCED: Conflict prevention, client ops
├── migrations.sql              # ENHANCED: Clients table, constraints
└── tests/                      # NEW: Comprehensive test suite
    ├── availability.test.ts
    ├── reservations.test.ts
    └── clients.test.ts
```

### Known Gotchas of our codebase & Library Quirks
```typescript
// CRITICAL: Supabase client must be awaited in Next.js 15
const supabase = await createClient()

// CRITICAL: Next.js 15 API route params are async
const params = await context.params

// CRITICAL: PostgreSQL unique constraints on timestamps
// Use table_id + date combination for conflict prevention

// CRITICAL: Supabase error codes for constraint violations
// 23505 = unique_violation, 23503 = foreign_key_violation

// CRITICAL: Buffer time calculations must include timezone handling
const bufferEnd = new Date(slotEnd.getTime() + restaurant.buffer_time * 60000)

// CRITICAL: Restaurant-level data isolation
// Always filter by restaurant_id for multi-tenant security

// CRITICAL: Race condition prevention requires atomic operations
// Use database constraints as primary defense, not application locks
```

## Implementation Blueprint

### Data Models and Structure

Enhance database schema with client management and strict conflict prevention:

```sql
-- Core clients table with proper constraints
create table clients (
  id bigint primary key generated always as identity,
  name text not null check (length(name) >= 2 and length(name) <= 100),
  email text unique not null check (email ~* '^[^@]+@[^@]+\.[^@]+$'),
  phone text check (phone is null or phone ~* '^\+?[1-9]\d{0,15}$'),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add client relationship to reservations
alter table reservations
add column client_id bigint references clients (id);

-- CRITICAL: Prevent double booking with unique constraint
alter table reservations
add constraint unique_table_time_slot unique (table_id, date);

-- Additional safety constraints
alter table reservations
add constraint valid_guest_count check (guests > 0 AND guests <= 20);

-- Performance indexes
create index idx_reservations_client_id on reservations(client_id);
create index idx_reservations_table_date on reservations(table_id, date);
create index idx_reservations_restaurant_date on reservations(restaurant_id, date);
```

### List of Tasks to be Completed in Order

```yaml
Task 1:
MODIFY lib/supabase/types.ts:
  - ADD Client interface with validation-ready types
  - MODIFY Reservation interface to include optional client_id
  - ADD enhanced API response types for table counts
  - PRESERVE existing type compatibility for backward compatibility

Task 2:
MODIFY migrations.sql:
  - ADD clients table with proper constraints and validations
  - ADD unique constraint on reservations (table_id, date)
  - ADD foreign key relationship reservations.client_id -> clients.id
  - ADD performance indexes for common query patterns

Task 3:
ENHANCE repositories/database.ts:
  - ADD comprehensive client CRUD operations following existing patterns
  - ENHANCE getConflictingReservations with proper overlap detection
  - ADD getAvailableTableCount method for real-time availability
  - ADD createReservationWithLock for atomic table assignment
  - PRESERVE all existing method signatures

Task 4:
CREATE services/clients.ts:
  - MIRROR pattern from services/reservations.ts structure
  - ADD createClient, getClient, updateClient, deleteClient functions
  - ADD validateClientData with create/update mode support
  - ADD findOrCreateClient for seamless integration
  - USE consistent error handling patterns

Task 5:
ENHANCE services/availability.ts:
  - MODIFY checkAvailability to return accurate table counts
  - ADD getAvailabilityForSlot for specific time slot checking
  - IMPROVE conflict detection using enhanced repository methods
  - MAINTAIN existing function signatures for compatibility

Task 6:
ENHANCE services/reservations.ts:
  - ADD client_id parameter support to createReservation
  - ADD createReservationWithClientData for inline client creation
  - ENHANCE conflict prevention using database constraints
  - IMPROVE error handling for constraint violations

Task 7:
CREATE app/api/restaurants/[restId]/clients/route.ts:
  - MIRROR authentication pattern from existing routes
  - ADD GET (list), POST (create) endpoints
  - USE existing response formatting patterns
  - FOLLOW Next.js 15 async params pattern

Task 8:
CREATE app/api/restaurants/[restId]/clients/[clientId]/route.ts:
  - ADD GET (single), PUT (update), DELETE endpoints
  - USE same authentication/authorization patterns
  - HANDLE client not found scenarios gracefully

Task 9:
ENHANCE app/api/restaurants/[restId]/availability/route.ts:
  - MODIFY response to include tablesAvailable and totalTables
  - PRESERVE existing API contract for backward compatibility
  - ADD enhanced error responses for edge cases

Task 10:
ENHANCE app/api/restaurants/[restId]/reservations/route.ts:
  - ADD support for client_id and inline client data
  - ENHANCE error handling for constraint violations
  - MAINTAIN backward compatibility (client_id optional)
  - ADD specific error messages for conflict scenarios

Task 11:
CREATE comprehensive test suite:
  - ADD tests/availability.test.ts for table counting accuracy
  - ADD tests/reservations.test.ts for conflict prevention
  - ADD tests/clients.test.ts for CRUD operations
  - COVER concurrent booking scenarios and edge cases
```

### Per Task Pseudocode

```typescript
// Task 1: Enhanced Types
interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

interface Reservation {
  id: number;
  date: string;
  guests: number;
  table_id: number;
  restaurant_id: number;
  client_id?: number; // Optional for backward compatibility
  confirmed: boolean;
}

interface AvailabilityResponse {
  success: true;
  data: {
    availableSlots: string[];
    tablesAvailable: number; // NEW: Real-time count
    totalTables: number;     // NEW: Total for capacity
    restaurant: RestaurantInfo;
  };
}

// Task 3: Enhanced Repository Methods
async getConflictingReservations(tableId: number, startTime: string, endTime: string) {
  // PATTERN: Get all reservations for table
  const { data: reservations } = await supabase
    .from('reservations')
    .select('*')
    .eq('table_id', tableId)
    .eq('confirmed', true)
    .gte('date', new Date().toISOString()) // Only future reservations
  
  // CRITICAL: Proper overlap detection algorithm
  const conflicts = reservations.filter(reservation => {
    const reservationStart = new Date(reservation.date)
    const reservationEnd = new Date(reservationStart.getTime() + duration * 60000)
    const requestStart = new Date(startTime)
    const requestEnd = new Date(endTime)
    
    // Two periods overlap if: start1 < end2 AND start2 < end1
    return reservationStart < requestEnd && requestStart < reservationEnd
  })
  
  return { data: conflicts, error: null }
}

async createReservationWithLock(reservationData) {
  // PATTERN: Automatic table assignment
  if (!reservationData.table_id) {
    const availableTable = await this.findAvailableTable(...)
    if (!availableTable) {
      throw new Error('No available tables for the requested time')
    }
    reservationData.table_id = availableTable.id
  }
  
  // CRITICAL: Final availability check to prevent race conditions
  const isAvailable = await this.isTableAvailable(...)
  if (!isAvailable) {
    throw new Error('Selected table is no longer available')
  }
  
  // PATTERN: Database insert with constraint handling
  const result = await supabase.from('reservations').insert(reservationData)
  
  if (result.error) {
    // CRITICAL: Handle constraint violations
    if (result.error.code === '23505') {
      throw new Error('Table already reserved for this time slot')
    }
    throw result.error
  }
  
  return result
}

// Task 6: Enhanced Reservation Service
async function createReservation(
  restaurantId: number,
  date: string,
  guests: number,
  clientId?: number
) {
  // PATTERN: Validation first
  const validation = await validateReservationRequest(restaurantId, date, guests)
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '))
  }
  
  // PATTERN: Client validation if provided
  if (clientId) {
    const client = await getClient(clientId)
    if (!client) {
      throw new Error('Client not found')
    }
  }
  
  // CRITICAL: Use atomic reservation creation
  try {
    const result = await db.createReservationWithLock({
      date: new Date(date).toISOString(),
      guests,
      restaurant_id: restaurantId,
      client_id: clientId,
      confirmed: true
    })
    
    return result
  } catch (error) {
    // PATTERN: Specific error handling
    if (error.message.includes('No available tables')) {
      return null // Indicate no availability
    }
    if (error.message.includes('already reserved')) {
      throw new Error('Table already reserved for this time slot')
    }
    throw error
  }
}

// Task 4: Client Service Pattern
async function createClient(clientData: {
  name: string;
  email: string;
  phone?: string;
}) {
  // PATTERN: Validation first (see existing service patterns)
  const validation = await validateClientData(clientData)
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '))
  }
  
  // PATTERN: Check uniqueness
  const existing = await getClientByEmail(clientData.email)
  if (existing) {
    throw new Error('Client with this email already exists')
  }
  
  // PATTERN: Repository call with error handling
  const { data: client, error } = await db.createClient(clientData)
  if (error) {
    throw new Error(`Failed to create client: ${error.message}`)
  }
  
  return client
}
```

### Integration Points
```yaml
DATABASE:
  - migration: "Add clients table with validation constraints"
  - constraint: "Add unique constraint on table_id + date for conflict prevention"
  - index: "Add performance indexes for common query patterns"
  
API_ROUTES:
  - enhance: "app/api/restaurants/[restId]/availability/route.ts"
  - enhance: "app/api/restaurants/[restId]/reservations/route.ts"
  - create: "app/api/restaurants/[restId]/clients/route.ts"
  - create: "app/api/restaurants/[restId]/clients/[clientId]/route.ts"
  
SERVICES:
  - enhance: "services/availability.ts for accurate table counting"
  - enhance: "services/reservations.ts for client support and conflict prevention"
  - create: "services/clients.ts for comprehensive client management"
  
REPOSITORIES:
  - enhance: "repositories/database.ts with conflict detection and client operations"
```

## Validation Loop

### Level 1: TypeScript Compilation & Linting
```bash
# Run these FIRST - fix any errors before proceeding
npx tsc --noEmit        # Type checking
npm run lint            # ESLint validation

# Expected: No errors. If errors, READ the error and fix.
```

### Level 2: Database Schema Validation
```bash
# Validate schema changes (would normally run migration)
# Check that constraints work as expected
# Verify indexes are created properly

# For this project, validate migrations.sql syntax
cat migrations.sql | head -20  # Check syntax

# Expected: Valid SQL syntax, proper constraint definitions
```

### Level 3: Unit Tests
```typescript
// CREATE test files following existing patterns:

// tests/reservations.test.ts
describe('Enhanced Reservation Service', () => {
  test('prevents double booking under concurrent load', async () => {
    // CRITICAL: Test the core conflict prevention
    const promises = Array(10).fill(null).map(() => 
      createReservation(1, '2024-01-01T18:00:00Z', 4)
    )
    
    const results = await Promise.allSettled(promises)
    const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null)
    
    // Only one should succeed due to unique constraint
    expect(successful.length).toBe(1)
  })
  
  test('automatically assigns optimal table', async () => {
    const result = await createReservation(1, '2024-01-01T19:00:00Z', 2)
    
    expect(result).toBeTruthy()
    expect(result.table.capacity).toBeGreaterThanOrEqual(2)
    expect(result.reservation.table_id).toBe(result.table.id)
  })
  
  test('handles client relationships correctly', async () => {
    const client = await createClient({ name: 'Test', email: 'test@example.com' })
    const reservation = await createReservation(1, '2024-01-01T20:00:00Z', 4, client.id)
    
    expect(reservation.reservation.client_id).toBe(client.id)
  })
})

// tests/availability.test.ts
describe('Enhanced Availability Service', () => {
  test('returns accurate table counts', async () => {
    const result = await checkAvailability(1, '2024-01-01', '18:00', 4)
    
    expect(result).toHaveProperty('tablesAvailable')
    expect(result).toHaveProperty('totalTables')
    expect(result.tablesAvailable).toBeLessThanOrEqual(result.totalTables)
    expect(typeof result.tablesAvailable).toBe('number')
  })
})

// tests/clients.test.ts
describe('Client Management Service', () => {
  test('validates email uniqueness', async () => {
    await createClient({ name: 'John', email: 'john@example.com' })
    
    await expect(createClient({ name: 'Jane', email: 'john@example.com' }))
      .rejects.toThrow('already exists')
  })
})
```

```bash
# Run tests and iterate until passing:
npm test
# If failing: Read error, understand root cause, fix code, re-run
```

### Level 4: API Integration Tests
```bash
# Test enhanced availability endpoint
curl -X GET "http://localhost:3000/api/restaurants/1/availability?date=2024-01-01&guests=4" \
  -H "Authorization: Bearer test-api-key"

# Expected: {"success":true,"data":{"availableSlots":["18:00"],"tablesAvailable":3,"totalTables":5}}

# Test reservation creation with client
curl -X POST "http://localhost:3000/api/restaurants/1/reservations" \
  -H "Authorization: Bearer test-api-key" \
  -H "Content-Type: application/json" \
  -d '{"date":"2024-01-01T18:00:00Z","guests":4,"client":{"name":"John Doe","email":"john@example.com"}}'

# Expected: {"success":true,"data":{"reservation":{...},"table":{...},"client":{...}}}

# Test client management
curl -X GET "http://localhost:3000/api/restaurants/1/clients" \
  -H "Authorization: Bearer test-api-key"

# Expected: {"success":true,"data":{"clients":[...],"total":...}}
```

## Final Validation Checklist
- [ ] All TypeScript compilation passes: `npx tsc --noEmit`
- [ ] No linting errors: `npm run lint`
- [ ] Application builds successfully: `npm run build`
- [ ] Unit tests achieve >90% coverage: `npm test`
- [ ] API endpoints return correct response formats
- [ ] Concurrent requests handled correctly (no double bookings)
- [ ] Client relationships work as expected
- [ ] Database constraints prevent conflicts
- [ ] Existing functionality preserved (backward compatibility)
- [ ] Error handling provides specific, actionable messages

---

## Anti-Patterns to Avoid
- ❌ Don't use application-level locks instead of database constraints
- ❌ Don't assume single-threaded execution for reservation creation
- ❌ Don't skip constraint violation handling in error cases
- ❌ Don't break existing API contracts without versioning
- ❌ Don't trust optimistic availability checks without final verification
- ❌ Don't hardcode table assignment logic - make it data-driven
- ❌ Don't ignore foreign key constraint violations
- ❌ Don't use sync database operations in async contexts

## Confidence Level: 9/10

This PRP provides comprehensive context, executable validation steps, and clear implementation patterns. The combination of database constraints, proper error handling, and extensive testing should enable successful one-pass implementation with minimal ambiguity.