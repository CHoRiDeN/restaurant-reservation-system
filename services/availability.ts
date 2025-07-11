import { RestaurantRepository } from '../repositories/database'
import { Reservation, Schedule, Table } from '../lib/supabase/types'

export async function checkAvailability(
  restaurantId: number,
  datetime: string,
  guests: number
): Promise<{ availableSlots: string[], tables: Table[], tablesAvailable: number, totalTables: number }> {
  const db = new RestaurantRepository()

  try {
    // STEP 1: Get restaurant configuration
    const { data: restaurant, error: restaurantError } = await db.getRestaurant(restaurantId)
    if (restaurantError || !restaurant) {
      return { availableSlots: [], tables: [], tablesAvailable: 0, totalTables: 0 }
    }

    // STEP 2: Get day of week (0=Sunday, 6=Saturday)
    const requestDate = new Date(datetime)
    const dayOfWeek = requestDate.getDay()
    console.log('dayOfWeek', dayOfWeek)

    // STEP 3: Get schedule for the day
    const { data: schedules, error: scheduleError } = await db.getSchedule(restaurantId, dayOfWeek)
    if (scheduleError || !schedules) {
      return { availableSlots: [], tables: [], tablesAvailable: 0, totalTables: 0 }
    }

    
    const requestEnd = new Date(requestDate.getTime() + restaurant.reservation_duration * 60000)


    console.log('looking for available table', requestDate, requestEnd, guests)
    const availableTable = await db.findAvailableTable(
      restaurantId,
      requestDate.toISOString(),
      requestEnd.toISOString(),
      guests
    )

    console.log('availableTable', availableTable)
    const { data: tables, error: tablesError } = await db.getTables(restaurantId, guests)
    console.log('tables', tables)
    if (tablesError || !tables || tables.length === 0) {
      return { availableSlots: [], tables: [], tablesAvailable: 0, totalTables: 0 }
    }

  

    // STEP 7: Get total table count for the guest capacity
    const totalTables = await db.getTotalTableCount(restaurantId, guests)
    console.log('totalTables', totalTables)


    // STEP 9: Calculate overall table availability
    

    return {
      availableSlots: [],
      tables,
      tablesAvailable: tables.length,
      totalTables
    }
  } catch (error) {
    console.error('Availability check error:', error)
    return { availableSlots: [], tables: [], tablesAvailable: 0, totalTables: 0 }
  }
}

// HELPER: Generate time slots
export function generateTimeSlots(schedules: Schedule[], reservations: Reservation[]): string[] {
  //TODO: Implement this
  return []
}

// Get available tables for a specific time slot
export async function getAvailableTablesForSlot(
  restaurantId: number,
  date: string,
  time: string,
  guests: number
): Promise<Table[]> {
  const db = new RestaurantRepository()

  try {
    // Get restaurant configuration
    const { data: restaurant } = await db.getRestaurant(restaurantId)
    if (!restaurant) return []

    // Get suitable tables
    const { data: tables } = await db.getTables(restaurantId, guests)
    if (!tables) return []

    // Filter available tables for this specific time slot
    const slotDateTime = new Date(`${date}T${time}:00Z`)
    const slotEnd = new Date(slotDateTime.getTime() + restaurant.reservation_duration * 60000)
    const bufferEnd = new Date(slotEnd.getTime() + restaurant.buffer_time * 60000)

    const availableTables: Table[] = []

    for (const table of tables) {
      const bufferStart = new Date(slotDateTime.getTime() - restaurant.buffer_time * 60000)

      const { data: conflictingReservations } = await db.getConflictingReservations(
        table.id,
        bufferStart.toISOString(),
        bufferEnd.toISOString(),
        guests
      )

      if (!conflictingReservations || conflictingReservations.length === 0) {
        availableTables.push(table)
      }
    }

    return availableTables
  } catch (error) {
    console.error('Error getting available tables for slot:', error)
    return []
  }
}

// Enhanced availability check for a specific time slot with table counts
export async function getAvailabilityForSlot(
  restaurantId: number,
  date: string,
  time: string,
  guests: number
): Promise<{ available: boolean, tablesAvailable: number, totalTables: number }> {
  const db = new RestaurantRepository()

  try {
    // Get total table count
    const totalTables = await db.getTotalTableCount(restaurantId, guests)

    // Get available table count for this specific slot
    const slotDateTime = new Date(`${date}T${time}:00Z`)
    const restaurant = await db.getRestaurant(restaurantId)
    if (!restaurant.data) {
      throw new Error('Restaurant not found')
    }
    const slotEnd = new Date(slotDateTime.getTime() + restaurant.data.reservation_duration * 60000)
    const tablesAvailable = await db.getAvailableTableCount(
      restaurantId,
      slotDateTime.toISOString(),
      slotEnd.toISOString(),
      guests
    )

    return {
      available: tablesAvailable > 0,
      tablesAvailable,
      totalTables
    }
  } catch (error) {
    console.error('Error checking slot availability:', error)
    return {
      available: false,
      tablesAvailable: 0,
      totalTables: 0
    }
  }
}