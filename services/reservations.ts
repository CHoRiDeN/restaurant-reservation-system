import { RestaurantRepository } from '../repositories/database'
import { checkAvailability, getAvailableTablesForSlot } from './availability'
import { Reservation, Table } from '../lib/supabase/types'

export async function createReservation(
  restaurantId: number,
  date: string,
  guests: number
): Promise<{ reservation: Reservation, table: Table } | null> {
  const db = new RestaurantRepository()

  try {
    // STEP 1: Validate availability first
    const dateOnly = date.split('T')[0] // Extract date part
    const timeOnly = date.split('T')[1]?.split(':').slice(0, 2).join(':') || '12:00' // Extract time part
    
    const availability = await checkAvailability(restaurantId, dateOnly, timeOnly, guests)
    if (availability.availableSlots.length === 0) {
      throw new Error('No availability for requested time')
    }

    // STEP 2: Get available tables for the specific time slot
    const availableTables = await getAvailableTablesForSlot(restaurantId, dateOnly, timeOnly, guests)
    if (availableTables.length === 0) {
      throw new Error('No suitable table available')
    }

    // STEP 3: Find optimal table (smallest capacity that fits)
    const suitableTable = availableTables
      .filter(table => table.capacity >= guests)
      .sort((a, b) => a.capacity - b.capacity)[0]

    if (!suitableTable) {
      throw new Error('No suitable table available')
    }

    // STEP 4: Create reservation
    const { data: reservation, error } = await db.createReservation({
      date: new Date(date).toISOString(),
      guests,
      table_id: suitableTable.id,
      restaurant_id: restaurantId,
      confirmed: true
    })

    if (error || !reservation) {
      throw new Error(`Failed to create reservation: ${error?.message || 'Unknown error'}`)
    }

    return { reservation, table: suitableTable }
  } catch (error) {
    console.error('Reservation creation error:', error)
    throw error
  }
}

export async function validateReservationRequest(
  restaurantId: number,
  date: string,
  guests: number
): Promise<{ valid: boolean, errors: string[] }> {
  const errors: string[] = []

  // Validate guest count
  if (guests < 1) {
    errors.push('Guest count must be at least 1')
  }
  if (guests > 20) {
    errors.push('Guest count cannot exceed 20')
  }

  // Validate date format and future date
  try {
    const reservationDate = new Date(date)
    const now = new Date()
    
    if (isNaN(reservationDate.getTime())) {
      errors.push('Invalid date format')
    } else if (reservationDate < now) {
      errors.push('Reservation date must be in the future')
    }
  } catch (error) {
    errors.push('Invalid date format')
  }

  // Validate restaurant exists
  const db = new RestaurantRepository()
  const { data: restaurant } = await db.getRestaurant(restaurantId)
  if (!restaurant) {
    errors.push('Restaurant not found')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export async function getReservationsForRestaurant(
  restaurantId: number,
  filters?: {
    date?: string
    tableId?: number
  }
) {
  const db = new RestaurantRepository()
  return await db.getReservations(restaurantId, filters)
}