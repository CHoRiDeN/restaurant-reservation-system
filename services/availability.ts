import { RestaurantRepository } from '../repositories/database'
import { Reservation, Schedule, Table } from '../lib/supabase/types'



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
    const restaurant = await db.getRestaurant(restaurantId)

    // Get suitable tables
    const tables = await db.getTables(restaurantId, guests)

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
    const slotEnd = new Date(slotDateTime.getTime() + restaurant.reservation_duration * 60000)
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