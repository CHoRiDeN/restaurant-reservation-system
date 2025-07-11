import { RestaurantRepository } from '@/repositories/database'
import { Reservation, Table, Client } from '@/lib/supabase/types'

export async function createReservation(
  restaurantId: number,
  startTime: string,
  guests: number,
  clientId: number,
  notes?: string
): Promise<{ reservation: Reservation, table: Table, client?: Client } | null> {
  const db = new RestaurantRepository()

  try {
    // STEP 1: Basic validation (detailed availability check will be done in createReservationWithLock)
    const validation = await validateReservationRequest(restaurantId, startTime, guests)
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '))
    }

    // STEP 2: Validate client exists 
    const { data: clientData, error: clientError } = await db.getClient(clientId)
    if (clientError || !clientData) {
      throw new Error('Client not found')
    }
    const client = clientData

    const restaurant = await db.getRestaurant(restaurantId)
    const reservationDuration = restaurant?.reservation_duration
    const requestStart = new Date(startTime)
    const requestEnd =  new Date(requestStart.getTime() + reservationDuration * 60000)

    // STEP 3: Create reservation with automatic table assignment and enhanced conflict prevention
    try {
      const result = await db.createReservationWithLock({
        start_time: startTime,
        end_time: requestEnd.toISOString(),
        guests,
        restaurant_id: restaurantId,
        client_id: clientId,
        confirmed: true,
        notes: notes
      })

      return { 
        reservation: result.reservation, 
        table: result.table,
        client: result.client || client
      }
    } catch (error: any) {
      // Handle specific business logic errors
      if (error.message.includes('No available tables')) {
        return null // No availability
      }
      if (error.message.includes('no longer available')) {
        throw new Error('Table already reserved for this time slot')
      }
      
      // Handle constraint violations gracefully
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Table already reserved for this time slot')
      }
      if (error.code === '23503') { // Foreign key constraint violation
        throw new Error('Invalid client reference')
      }
      throw new Error(`Failed to create reservation: ${error.message || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('Reservation creation error:', error)
    throw error
  }
}

export async function validateReservationRequest(
  restaurantId: number,
  startTime: string,
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

  // Validate time format and future time
  try {
    
    const reservationStart = new Date(startTime)
    const now = new Date()
    
    if (isNaN(reservationStart.getTime())) {
      errors.push('Invalid start time format')
    } else if (reservationStart < now) {
      errors.push('Reservation start time must be in the future')
    }

    
   
  } catch (error) {
    errors.push('Invalid time format')
  }

  // Validate restaurant exists
  const db = new RestaurantRepository()
  const restaurant = await db.getRestaurant(restaurantId)


  return {
    valid: errors.length === 0,
    errors
  }
}

export async function createReservationWithClientData(
  restaurantId: number,
  startTime: string,
  guests: number,
  clientData: {
    name: string
    email?: string
    phone: string
  },
  notes?: string
): Promise<{ reservation: Reservation, table: Table, client?: Client } | null> {
  const db = new RestaurantRepository()

  try {
    // Try to find existing client by email first
    const { data: existingClient } = await db.getClientByPhone(clientData.phone)
    
    let clientId: number
    if (existingClient) {
      clientId = existingClient.id
    } else {
      // Create new client
      const { data: newClient, error: clientError } = await db.createClient(restaurantId, clientData.name, clientData.phone, clientData.email)
      if (clientError || !newClient) {
        throw new Error(`Failed to create client: ${clientError?.message || 'Unknown error'}`)
      }
      clientId = newClient.id
    }

    return await createReservation(restaurantId, startTime, guests, clientId, notes)
  } catch (error) {
    console.error('Reservation with client data creation error:', error)
    throw error
  }
}

export async function getReservationsForRestaurant(
  restaurantId: number,
  filters?: {
    startDate?: string
    tableId?: number
  }
) {
  const db = new RestaurantRepository()
  return await db.getReservations(restaurantId, filters)
}