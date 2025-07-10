import { RestaurantRepository } from '../repositories/database'
import { Table } from '../lib/supabase/types'

export async function checkAvailability(
  restaurantId: number,
  date: string,
  time: string,
  guests: number
): Promise<{ availableSlots: string[], tables: Table[] }> {
  const db = new RestaurantRepository()

  try {
    // STEP 1: Get restaurant configuration
    const { data: restaurant, error: restaurantError } = await db.getRestaurant(restaurantId)
    if (restaurantError || !restaurant) {
      return { availableSlots: [], tables: [] }
    }

    // STEP 2: Get day of week (0=Sunday, 6=Saturday)
    const requestDate = new Date(date)
    const dayOfWeek = requestDate.getDay()

    // STEP 3: Get schedule for the day
    const { data: schedule, error: scheduleError } = await db.getSchedule(restaurantId, dayOfWeek)
    if (scheduleError || !schedule) {
      return { availableSlots: [], tables: [] }
    }

    // STEP 4: Check for schedule exceptions
    const { data: exception } = await db.getScheduleException(restaurantId, date)

    // Use exception times if exists, otherwise use regular schedule
    const openingTime = exception?.opening_time || schedule.opening_time
    const closingTime = exception?.closing_time || schedule.closing_time

    if (!openingTime || !closingTime) {
      return { availableSlots: [], tables: [] }
    }

    // STEP 5: Generate time slots
    const slots = generateTimeSlots(openingTime, closingTime, restaurant.reservation_duration)

    // STEP 6: Get suitable tables
    const { data: tables, error: tablesError } = await db.getTables(restaurantId, guests)
    if (tablesError || !tables || tables.length === 0) {
      return { availableSlots: [], tables: [] }
    }

    // STEP 7: Filter available slots
    const availableSlots: string[] = []

    for (const slot of slots) {
      const slotDateTime = new Date(`${date}T${slot}:00Z`)
      const slotEnd = new Date(slotDateTime.getTime() + restaurant.reservation_duration * 60000)
      const bufferEnd = new Date(slotEnd.getTime() + restaurant.buffer_time * 60000)

      // Check if any table is available for this slot
      const hasAvailableTable = await Promise.all(
        tables.map(async (table) => {
          const { data: conflictingReservations } = await db.getConflictingReservations(
            table.id,
            new Date(slotDateTime.getTime() - restaurant.buffer_time * 60000).toISOString(),
            bufferEnd.toISOString()
          )

          return !conflictingReservations || conflictingReservations.length === 0
        })
      )

      if (hasAvailableTable.some(Boolean)) {
        availableSlots.push(slot)
      }
    }

    return { availableSlots, tables }
  } catch (error) {
    console.error('Availability check error:', error)
    return { availableSlots: [], tables: [] }
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
      const { data: conflictingReservations } = await db.getConflictingReservations(
        table.id,
        new Date(slotDateTime.getTime() - restaurant.buffer_time * 60000).toISOString(),
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