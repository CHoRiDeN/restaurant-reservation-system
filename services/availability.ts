import { RestaurantRepository } from '../repositories/database'
import { Table } from '../lib/supabase/types'

export async function checkAvailability(
  restaurantId: number,
  date: string,
  time: string,
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
    const requestDate = new Date(date)
    const dayOfWeek = requestDate.getDay()

    // STEP 3: Get schedule for the day
    const { data: schedule, error: scheduleError } = await db.getSchedule(restaurantId, dayOfWeek)
    if (scheduleError || !schedule) {
      return { availableSlots: [], tables: [], tablesAvailable: 0, totalTables: 0 }
    }

    // STEP 4: Check for schedule exceptions
    const { data: exception } = await db.getScheduleException(restaurantId, date)

    // Use exception times if exists, otherwise use regular schedule
    const openingTime = exception?.opening_time || schedule.opening_time
    const closingTime = exception?.closing_time || schedule.closing_time

    if (!openingTime || !closingTime) {
      return { availableSlots: [], tables: [], tablesAvailable: 0, totalTables: 0 }
    }

    // STEP 5: Generate time slots
    const slots = generateTimeSlots(openingTime, closingTime, restaurant.reservation_duration)

    // STEP 6: Get suitable tables
    const { data: tables, error: tablesError } = await db.getTables(restaurantId, guests)
    if (tablesError || !tables || tables.length === 0) {
      return { availableSlots: [], tables: [], tablesAvailable: 0, totalTables: 0 }
    }

    // STEP 7: Get total table count for the guest capacity
    const totalTables = await db.getTotalTableCount(restaurantId, guests)

    // STEP 8: Filter available slots and calculate table counts
    const availableSlots: string[] = []
    const tableCountsPerSlot: number[] = []

    for (const slot of slots) {
      const slotDateTime = new Date(`${date}T${slot}:00Z`)
      const slotEnd = new Date(slotDateTime.getTime() + restaurant.reservation_duration * 60000)
      const bufferStart = new Date(slotDateTime.getTime() - restaurant.buffer_time * 60000)
      const bufferEnd = new Date(slotEnd.getTime() + restaurant.buffer_time * 60000)

      // Check availability for each table using the enhanced conflict detection
      const tableAvailability = await Promise.all(
        tables.map(async (table) => {
          const { data: conflictingReservations } = await db.getConflictingReservations(
            table.id,
            bufferStart.toISOString(),
            bufferEnd.toISOString()
          )

          return !conflictingReservations || conflictingReservations.length === 0
        })
      )

      const availableTablesCount = tableAvailability.filter(Boolean).length

      if (availableTablesCount > 0) {
        availableSlots.push(slot)
        tableCountsPerSlot.push(availableTablesCount)
      }
    }

    // STEP 9: Calculate overall table availability
    const maxTablesAvailable = tableCountsPerSlot.length > 0 ? Math.max(...tableCountsPerSlot) : 0

    return { 
      availableSlots, 
      tables, 
      tablesAvailable: maxTablesAvailable,
      totalTables 
    }
  } catch (error) {
    console.error('Availability check error:', error)
    return { availableSlots: [], tables: [], tablesAvailable: 0, totalTables: 0 }
  }
}

// HELPER: Generate time slots
export function generateTimeSlots(openingTime: string, closingTime: string, duration: number): string[] {
  const slots: string[] = []
  const [openHour, openMin] = openingTime.split(':').map(Number)
  const [closeHour, closeMin] = closingTime.split(':').map(Number)

  let currentHour = openHour
  let currentMin = openMin

  while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
    slots.push(`${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`)

    currentMin += duration
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60)
      currentMin = currentMin % 60
    }
  }

  return slots
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
        bufferEnd.toISOString()
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