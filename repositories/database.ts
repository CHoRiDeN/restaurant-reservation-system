import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '../lib/supabase/client'
import { Restaurant, Table, Schedule, ScheduleException, Reservation, Client } from '../lib/supabase/types'

export class RestaurantRepository {
  private async getSupabase() {
    return await createClient()
  }

  async getRestaurantWithSchedules(id: number) {
    const supabase = await this.getSupabase()
    return await supabase
      .from('restaurants')
      .select(`
        *,
        schedules (*),
        tables (*)
      `)
      .eq('id', id)
      .single()
  }

  async getRestaurant(id: number) {
    const supabase = await this.getSupabase()
    return await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single()
  }

  async getTables(restaurantId: number, minCapacity?: number) {
    const supabase = await this.getSupabase()
    let query = supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurantId)

    if (minCapacity) {
      query = query.gte('capacity', minCapacity)
    }

    return await query.order('capacity', { ascending: true })
  }

  async getSchedule(restaurantId: number, dayOfWeek: number) {
    const supabase = await this.getSupabase()
    return await supabase
      .from('schedules')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('day_of_week', dayOfWeek)
      .single()
  }

  async getScheduleException(restaurantId: number, date: string) {
    const supabase = await this.getSupabase()
    return await supabase
      .from('schedule_exceptions')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('date', date)
      .single()
  }

  async getConflictingReservations(
    tableId: number,
    startTime: string,
    endTime: string,
    bufferTime: number
  ) {
    const supabase = await this.getSupabase()
    
    // Get all reservations for this table that might conflict
    // With the new schema, we use start_time and end_time directly
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('table_id', tableId)
      .eq('confirmed', true)
      .gte('end_time', new Date().toISOString()) // Only check future/current reservations
    
    if (error || !data) {
      return { data: [], error }
    }
    
   
    // Filter reservations that actually conflict with the time window
    const conflicts = data.filter(reservation => {
      const reservationStart = new Date(reservation.start_time)
      const reservationEnd = new Date(reservation.end_time)
      const requestStart = new Date(startTime)
      const requestEnd = new Date(endTime)
      const bufferEnd = new Date(reservationEnd.getTime() + bufferTime * 60000)
      return reservationStart < requestEnd && requestStart < bufferEnd
    })
    
    return { data: conflicts, error: null }
  }

  async createReservation(reservationData: {
    start_time: string
    end_time: string
    guests: number
    table_id: number
    restaurant_id: number
    client_id: number
    confirmed: boolean
  }) {
    const supabase = await this.getSupabase()
    return await supabase
      .from('reservations')
      .insert(reservationData)
      .select()
      .single()
  }

  async getReservations(restaurantId: number, filters?: {
    startDate?: string
    tableId?: number
  }) {
    const supabase = await this.getSupabase()
    let query = supabase
      .from('reservations')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('confirmed', true)

    if (filters?.startDate) {
      query = query.gte('start_time', filters.startDate)
    }

    if (filters?.tableId) {
      query = query.eq('table_id', filters.tableId)
    }

    return await query.order('start_time', { ascending: true })
  }

  // Client CRUD operations
  async createClient(clientData: {
    name: string
    email: string
    phone?: string
  }) {
    const supabase = await this.getSupabase()
    return await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single()
  }

  async getClient(id: number) {
    const supabase = await this.getSupabase()
    return await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
  }

  async getClientByEmail(email: string) {
    const supabase = await this.getSupabase()
    return await supabase
      .from('clients')
      .select('*')
      .eq('email', email)
      .single()
  }

  async updateClient(id: number, updates: {
    name?: string
    email?: string
    phone?: string
  }) {
    const supabase = await this.getSupabase()
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    return await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
  }

  async deleteClient(id: number) {
    const supabase = await this.getSupabase()
    return await supabase
      .from('clients')
      .delete()
      .eq('id', id)
  }

  async getClients(filters?: {
    search?: string
    limit?: number
    offset?: number
  }) {
    const supabase = await this.getSupabase()
    let query = supabase
      .from('clients')
      .select('*')

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    return await query.order('created_at', { ascending: false })
  }

  // Enhanced availability methods
  async getAvailableTableCount(
    restaurantId: number,
    startTime: string,
    endTime: string,
    guests: number
  ): Promise<number> {
    const supabase = await this.getSupabase()
    
    // Get restaurant configuration
    const { data: restaurant } = await this.getRestaurant(restaurantId)
    if (!restaurant) return 0

    // Get suitable tables
    const { data: tables } = await this.getTables(restaurantId, guests)
    if (!tables || tables.length === 0) return 0

    // Calculate time windows with proper buffer handling
    const requestStart = new Date(startTime)
    const requestEnd = new Date(endTime)

    // Check availability for each table using the enhanced conflict detection
    let availableCount = 0
    
    for (const table of tables) {
      const { data: conflicts } = await this.getConflictingReservations(
        table.id,
        requestStart.toISOString(),
        requestEnd.toISOString(),
        restaurant.buffer_time
      )
      
      if (!conflicts || conflicts.length === 0) {
        availableCount++
      }
    }

    return availableCount
  }


  async getTotalTableCount(restaurantId: number, minCapacity?: number): Promise<number> {
    const supabase = await this.getSupabase()
    let query = supabase
      .from('tables')
      .select('id', { count: 'exact' })
      .eq('restaurant_id', restaurantId)

    if (minCapacity) {
      query = query.gte('capacity', minCapacity)
    }

    const { count } = await query
    return count || 0
  }

  // Enhanced reservation creation with conflict prevention and automatic table assignment
  async createReservationWithLock(reservationData: {
    start_time: string
    end_time: string
    guests: number
    table_id?: number // Make optional for automatic assignment
    restaurant_id: number
    client_id: number // Now required
    confirmed: boolean
  }) {
    const supabase = await this.getSupabase()
    
    let tableId = reservationData.table_id
    
    // If no table specified, find an available one
    if (!tableId) {
      const availableTable = await this.findAvailableTable(
        reservationData.restaurant_id,
        reservationData.start_time,
        reservationData.end_time,
        reservationData.guests
      )
      
      if (!availableTable) {
        throw new Error('No available tables for the requested time and guest count')
      }
      
      tableId = availableTable.id
    }
    
    // Double-check the specific table is available (prevent race conditions)
    const isTableAvailable = await this.isTableAvailableForReservation(
      tableId!,
      reservationData.start_time,
      reservationData.end_time,
      reservationData.restaurant_id
    )
    
    if (!isTableAvailable) {
      throw new Error('Selected table is no longer available')
    }
    
    // Create reservation with the assigned table
    const finalReservationData = {
      ...reservationData,
      table_id: tableId!
    }
    
    const result = await supabase
      .from('reservations')
      .insert(finalReservationData)
      .select(`
        *,
        tables:table_id (*),
        clients:client_id (*)
      `)
      .single()

    if (result.error) {
      // Handle constraint violations
      if (result.error.code === '23P01') {
        throw new Error('Table already reserved for this time slot - overlapping reservation detected')
      }
      if (result.error.code === '23505') {
        throw new Error('Table already reserved for this time slot')
      }
      throw result.error
    }

    return {
      reservation: result.data,
      table: result.data.tables,
      client: result.data.clients
    }
  }
  
  // Find an available table for a reservation
  private async findAvailableTable(
    restaurantId: number,
    startTime: string,
    endTime: string,
    guests: number
  ) {
    // Get restaurant configuration
    const { data: restaurant } = await this.getRestaurant(restaurantId)
    if (!restaurant) return null

    // Get suitable tables (ordered by capacity ascending to prefer smaller tables)
    const { data: tables } = await this.getTables(restaurantId, guests)
    if (!tables || tables.length === 0) return null
    console.log(tables)

    // Calculate time windows with buffer
    const requestStart = new Date(startTime)
    const requestEnd = new Date(endTime)


    // Check each table for availability
    for (const table of tables) {
      const { data: conflicts } = await this.getConflictingReservations(
        table.id,
        requestStart.toISOString(),
        requestEnd.toISOString(),
        restaurant.buffer_time
      )
     
      
      if (!conflicts || conflicts.length === 0) {
        console.log('table', table.id, 'has no conflicts')
        return table // Return first available table
      }
    }
    
    return null // No available tables
  }
  
  // Check if a specific table is available for a reservation
  private async isTableAvailableForReservation(
    tableId: number,
    startTime: string,
    endTime: string,
    restaurantId: number
  ): Promise<boolean> {
    // Get restaurant configuration for buffer time
    const { data: restaurant } = await this.getRestaurant(restaurantId)
    if (!restaurant) return false

    const requestStart = new Date(startTime)
    const requestEnd = new Date(endTime)

    const { data: conflicts } = await this.getConflictingReservations(
      tableId,
      requestStart.toISOString(),
      requestEnd.toISOString(),
      restaurant.buffer_time
    )
    
    return !conflicts || conflicts.length === 0
  }
}