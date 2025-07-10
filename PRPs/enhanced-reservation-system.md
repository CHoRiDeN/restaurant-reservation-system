name: "Enhanced Reservation System with Client Management and Conflict Prevention"
description: |

## Purpose
Enhance the restaurant reservation system with robust table conflict prevention, accurate availability checking with table counts, and comprehensive client management functionality.

## Core Principles
1. **Database Integrity First**: Use PostgreSQL constraints and transactions to prevent race conditions
2. **Accurate Availability**: Show real-time table counts and handle concurrent requests
3. **Client Management**: Seamlessly integrate client data with existing reservation flow
4. **Backward Compatibility**: Maintain existing API contracts while adding new features
5. **Follow CLAUDE.md**: Adhere to all established patterns and conventions

---

## Goal
Transform the current reservation system to prevent double booking scenarios, provide accurate table availability counts, and introduce comprehensive client management with proper foreign key relationships.

## Why
- **Business Value**: Prevents overbooking incidents that damage restaurant reputation
- **User Experience**: Provides accurate availability information to virtual assistants
- **Data Integrity**: Establishes proper client relationships for future CRM features
- **System Reliability**: Eliminates race conditions during high-traffic periods

## What
Enhanced reservation system with:
- Zero-tolerance double booking prevention using database constraints
- Real-time table availability counts in API responses
- Client management with proper foreign key relationships
- Enhanced error handling and validation
- Improved concurrent request handling

### Success Criteria
- [ ] No double bookings possible even under concurrent load
- [ ] Availability API returns accurate table counts
- [ ] Client CRUD operations fully functional
- [ ] All existing functionality preserved
- [ ] Comprehensive test coverage for edge cases

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- file: /Users/danijimenez/Documents/projects/nora-reservation-system/FEATURE.md
  why: Core requirements for enhanced functionality
  
- file: /Users/danijimenez/Documents/projects/nora-reservation-system/repositories/database.ts
  why: Current repository patterns to follow
  
- file: /Users/danijimenez/Documents/projects/nora-reservation-system/services/availability.ts
  why: Current availability logic to enhance
  
- file: /Users/danijimenez/Documents/projects/nora-reservation-system/lib/supabase/types.ts
  why: Type definitions to extend
  
- file: /Users/danijimenez/Documents/projects/nora-reservation-system/app/api/restaurants/[restId]/reservations/route.ts
  why: API route patterns to follow

- docfile: /Users/danijimenez/Documents/projects/nora-reservation-system/CLAUDE.md
  why: Project conventions and architecture requirements
```

### Current Codebase tree
```bash
├── app/
│   └── api/
│       └── restaurants/
│           └── [restId]/
│               ├── availability/
│               │   └── route.ts
│               └── reservations/
│                   └── route.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── types.ts
│   ├── auth/
│   │   └── api-auth.ts
│   └── utils/
│       └── responses.ts
├── repositories/
│   └── database.ts
├── services/
│   ├── availability.ts
│   └── reservations.ts
└── migrations.sql
```

### Desired Codebase tree with files to be added
```bash
├── app/
│   └── api/
│       └── restaurants/
│           └── [restId]/
│               ├── availability/
│               │   └── route.ts (ENHANCED)
│               ├── reservations/
│               │   └── route.ts (ENHANCED)
│               └── clients/
│                   └── route.ts (NEW)
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── types.ts (ENHANCED)
│   ├── auth/
│   │   └── api-auth.ts
│   └── utils/
│       └── responses.ts
├── repositories/
│   └── database.ts (ENHANCED)
├── services/
│   ├── availability.ts (ENHANCED)
│   ├── reservations.ts (ENHANCED)
│   └── clients.ts (NEW)
├── migrations.sql (ENHANCED)
└── tests/
    ├── availability.test.ts (NEW)
    ├── reservations.test.ts (NEW)
    └── clients.test.ts (NEW)
```

### Known Gotchas of our codebase & Library Quirks
```typescript
// CRITICAL: Supabase client must be awaited in Next.js 15
const supabase = await createClient()

// CRITICAL: Next.js 15 API route params are async
const params = await context.params

// CRITICAL: PostgreSQL isolation levels for concurrent reservations
// Use SERIALIZABLE for preventing phantom reads

// CRITICAL: Supabase .or() queries need proper parentheses
.or(`and(date.lte.${startTime}, date.gte.${endTime})`)

// CRITICAL: Buffer time calculations must account for timezone
const bufferEnd = new Date(slotEnd.getTime() + restaurant.buffer_time * 60000)
```

## Implementation Blueprint

### Data models and structure

Enhance existing database schema with client management and stricter constraints:

```sql
-- Add clients table
create table clients (
  id bigint primary key generated always as identity,
  name text not null,
  email text unique not null,
  phone text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add client_id to reservations with foreign key
alter table reservations
add column client_id bigint references clients (id);

-- Add unique constraint to prevent double booking
alter table reservations
add constraint unique_table_time_slot unique (table_id, date);

-- Add check constraint for valid guest count
alter table reservations
add constraint valid_guest_count check (guests > 0 AND guests <= 20);
```

### List of tasks to be completed in order

```yaml
Task 1:
MODIFY lib/supabase/types.ts:
  - ADD Client interface with proper typing
  - MODIFY Reservation interface to include client_id
  - ADD enhanced response types for table counts
  - PRESERVE existing type compatibility

Task 2:
MODIFY migrations.sql:
  - ADD clients table creation
  - ADD foreign key constraint to reservations
  - ADD unique constraint for table conflict prevention
  - ADD check constraints for data validation

Task 3:
MODIFY repositories/database.ts:
  - ADD client CRUD operations following existing patterns
  - ENHANCE getConflictingReservations with better isolation
  - ADD table count methods for availability
  - PRESERVE existing method signatures

Task 4:
CREATE services/clients.ts:
  - MIRROR pattern from services/reservations.ts
  - ADD validation for client data
  - ADD error handling following existing patterns
  - USE repository pattern consistently

Task 5:
ENHANCE services/availability.ts:
  - MODIFY checkAvailability to return table counts
  - ADD concurrent request handling
  - IMPROVE conflict detection accuracy
  - MAINTAIN existing function signatures

Task 6:
ENHANCE services/reservations.ts:
  - ADD client_id handling in createReservation
  - ENHANCE conflict prevention with database constraints
  - ADD validation for client relationships
  - PRESERVE existing error handling patterns

Task 7:
CREATE app/api/restaurants/[restId]/clients/route.ts:
  - MIRROR pattern from existing API routes
  - ADD GET, POST, PUT, DELETE endpoints
  - USE existing authentication patterns
  - FOLLOW Next.js 15 async params pattern

Task 8:
ENHANCE app/api/restaurants/[restId]/availability/route.ts:
  - MODIFY response to include table counts
  - ADD concurrent request handling
  - PRESERVE existing API contract
  - IMPROVE error responses

Task 9:
ENHANCE app/api/restaurants/[restId]/reservations/route.ts:
  - ADD client_id parameter support
  - ENHANCE conflict prevention validation
  - IMPROVE error handling for constraint violations
  - MAINTAIN backward compatibility

Task 10:
CREATE comprehensive test suite:
  - ADD tests/availability.test.ts
  - ADD tests/reservations.test.ts
  - ADD tests/clients.test.ts
  - COVER concurrent request scenarios
```

### Per task pseudocode

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

// Task 3: Enhanced Repository Methods
async getAvailableTableCount(restaurantId: number, date: string, time: string): Promise<number> {
  // PATTERN: Use existing async client pattern
  const supabase = await this.getSupabase()
  
  // CRITICAL: Use proper transaction isolation
  const { data: tables } = await supabase
    .from('tables')
    .select('id')
    .eq('restaurant_id', restaurantId)
  
  // PATTERN: Check conflicts for each table
  const availableCount = await Promise.all(
    tables.map(async (table) => {
      const conflicts = await this.getConflictingReservations(table.id, startTime, endTime)
      return conflicts.length === 0
    })
  )
  
  return availableCount.filter(Boolean).length
}

// Task 5: Enhanced Availability Logic
export async function checkAvailability(
  restaurantId: number,
  date: string,
  time: string,
  guests: number
): Promise<{ availableSlots: string[], tablesAvailable: number }> {
  // PATTERN: Use existing validation
  const db = new RestaurantRepository()
  
  // ENHANCEMENT: Add table count for each slot
  const slotsWithCounts = await Promise.all(
    slots.map(async (slot) => {
      const count = await db.getAvailableTableCount(restaurantId, date, slot)
      return { slot, count }
    })
  )
  
  // PATTERN: Filter and return enhanced data
  const available = slotsWithCounts.filter(({ count }) => count > 0)
  return {
    availableSlots: available.map(({ slot }) => slot),
    tablesAvailable: Math.max(...available.map(({ count }) => count))
  }
}

// Task 6: Enhanced Reservation Creation
export async function createReservation(
  restaurantId: number,
  date: string,
  guests: number,
  clientId?: number
): Promise<{ reservation: Reservation, table: Table } | null> {
  // PATTERN: Use existing validation patterns
  const validation = await validateReservationRequest(restaurantId, date, guests)
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '))
  }
  
  // ENHANCEMENT: Use database transaction for conflict prevention
  const db = new RestaurantRepository()
  
  try {
    // CRITICAL: Use serializable isolation level
    const result = await db.createReservationWithLock({
      date,
      guests,
      restaurant_id: restaurantId,
      client_id: clientId,
      confirmed: true
    })
    
    return result
  } catch (error) {
    // PATTERN: Handle constraint violations gracefully
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('Table already reserved for this time slot')
    }
    throw error
  }
}
```

### Integration Points
```yaml
DATABASE:
  - migration: "Add clients table and foreign key constraints"
  - constraint: "Add unique constraint on table_id + date for conflict prevention"
  - index: "CREATE INDEX idx_reservations_client_id ON reservations(client_id)"
  
API:
  - enhance: "app/api/restaurants/[restId]/availability/route.ts"
  - enhance: "app/api/restaurants/[restId]/reservations/route.ts"
  - create: "app/api/restaurants/[restId]/clients/route.ts"
  
SERVICES:
  - enhance: "services/availability.ts to return table counts"
  - enhance: "services/reservations.ts for client support"
  - create: "services/clients.ts for client management"
```

## Validation Loop

### Level 1: Database Schema Validation
```bash
# Run these FIRST - ensure schema changes are correct
npm run db:migrate  # Apply new schema
npm run db:seed     # Test with sample data

# Expected: No constraint violations, foreign keys work
# If errors: Review constraint definitions and fix
```

### Level 2: TypeScript Compilation
```bash
# Run these SECOND - fix any type errors
npx tsc --noEmit       # Type checking only
npm run lint           # ESLint validation

# Expected: No type errors, all imports resolve
# If errors: Fix type definitions and imports
```

### Level 3: Unit Tests
```typescript
// CREATE test files with these patterns:
describe('Enhanced Availability Service', () => {
  test('returns accurate table counts', async () => {
    // Test that table counts match actual availability
    const result = await checkAvailability(1, '2024-01-01', '18:00', 4)
    expect(result.tablesAvailable).toBeGreaterThan(0)
  })
  
  test('prevents double booking under concurrent load', async () => {
    // Test concurrent reservation attempts
    const promises = Array(10).fill(null).map(() => 
      createReservation(1, '2024-01-01T18:00:00Z', 4)
    )
    
    const results = await Promise.allSettled(promises)
    const successful = results.filter(r => r.status === 'fulfilled')
    expect(successful.length).toBe(1) // Only one should succeed
  })
  
  test('client relationships work correctly', async () => {
    const client = await createClient({ name: 'Test', email: 'test@example.com' })
    const reservation = await createReservation(1, '2024-01-01T18:00:00Z', 4, client.id)
    expect(reservation.reservation.client_id).toBe(client.id)
  })
})
```

```bash
# Run and iterate until passing:
npm test -- --testPathPattern="availability|reservations|clients"
# If failing: Read error, fix root cause, never mock core business logic
```

### Level 4: API Integration Tests
```bash
# Test the enhanced endpoints
curl -X GET "http://localhost:3000/api/restaurants/1/availability?date=2024-01-01&guests=4" \
  -H "Authorization: Bearer test-api-key"

# Expected: {"success":true,"data":{"availableSlots":["18:00"],"tablesAvailable":3}}

curl -X POST "http://localhost:3000/api/restaurants/1/reservations" \
  -H "Authorization: Bearer test-api-key" \
  -H "Content-Type: application/json" \
  -d '{"date":"2024-01-01T18:00:00Z","guests":4,"client_id":1}'

# Expected: {"success":true,"data":{"reservation":{...},"table":{...}}}
```

## Final validation Checklist
- [ ] Database migration runs without errors
- [ ] All TypeScript compilation passes
- [ ] Unit tests achieve >95% coverage
- [ ] API endpoints return correct response formats
- [ ] Concurrent requests handled correctly
- [ ] Client relationships work as expected
- [ ] Existing functionality preserved
- [ ] No double booking possible under load testing

---

## Anti-Patterns to Avoid
- ❌ Don't rely on application-level locks for conflict prevention
- ❌ Don't skip database constraints thinking app validation is enough
- ❌ Don't break existing API contracts without versioning
- ❌ Don't use optimistic locking for critical reservation conflicts
- ❌ Don't forget to handle foreign key constraint violations gracefully
- ❌ Don't assume single-threaded execution in concurrent scenarios