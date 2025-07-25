import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '../lib/supabase/client'
import { Restaurant, Table, Schedule, ScheduleException, Reservation, Client } from '../lib/supabase/types'
import moment from 'moment'

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

  async getRestaurants() {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')

    if (error) {
      throw new Error(`Error getting restaurants: ${error.message}`)
    }
    return data as Restaurant[]
  }

  async getRestaurant(id: number) {
    const supabase = await this.getSupabase()
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Error getting restaurant: ${error.message}`)
    }
    if (!data) {
      throw new Error(`Restaurant not found`)
    }
    return data
  }

  async getTables(restaurantId: number, minCapacity?: number) {
    const supabase = await this.getSupabase()
    let query = supabase
      .from('tables')
      .select('*, zone:zone_id (*)')
      .eq('restaurant_id', restaurantId)

    if (minCapacity) {
      query = query.gte('capacity', minCapacity)
    }

    const { data, error } = await query.order('capacity', { ascending: true })
    if (error) {
      throw new Error(`Error getting tables: ${error.message}`)
    }
    return data
  }

  async getSchedules(restaurantId: number, dayOfWeek: number) {
    const supabase = await this.getSupabase()
    const {data, error} = await supabase
      .from('schedules')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('day_of_week', dayOfWeek)

    if (error) {
      throw new Error(`Error getting schedules: ${error.message}`)
    }
    return data
  }

  async getReservationsForDay(restaurantId: number, date: string) {
    const supabase = await this.getSupabase()
    const startDate = moment(date).utc().startOf('day').toDate()
    const endDate = moment(date).utc().endOf('day').toDate()
    const { data, error } = await supabase
      .from('reservations')
      .select('*,client:client_id (*), table:table_id (*)')
      .eq('restaurant_id', restaurantId)
      .gte('start_time', startDate.toISOString())
      .lte('end_time', endDate.toISOString());

    if (error) {
      throw new Error(`Error getting reservations for day: ${error.message}`)
    }

    return data as Reservation[];
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

  async getTableReservations(restaurantId: number, tableId: number, date: Date) {
    const supabase = await this.getSupabase()
    const startOfDay = new Date(date.setUTCHours(0, 0, 0, 0))
    const endOfDay = new Date(date.setUTCHours(23, 59, 59, 999))
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('table_id', tableId)
      .gte('start_time', startOfDay.toISOString())
      .lte('end_time', endOfDay.toISOString())
      .order('start_time', { ascending: true })

    if (error) {
      throw new Error(`Error getting table reservations: ${error.message}`)
    }
    return data
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
  async createClient(restaurantId: number, name: string, phone: string, email?: string) {
    const supabase = await this.getSupabase()
    return await supabase
      .from('clients')
      .insert({
        name,
        phone,
        email,
        restaurant_id: restaurantId
      })
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

  async getClientByPhone(phone: string) {
    const supabase = await this.getSupabase()
    return await supabase
      .from('clients')
      .select('*')
      .eq('phone', phone)
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
    const restaurant = await this.getRestaurant(restaurantId)

    // Get suitable tables
    const tables = await this.getTables(restaurantId, guests)

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
    notes?: string
  }) {
    const supabase = await this.getSupabase()

    let tableId = reservationData.table_id

    // If no table specified, find an available one
    if (!tableId) {
      const availableTables = await this.findAvailableTables(
        reservationData.restaurant_id,
        reservationData.start_time,
        reservationData.end_time,
        reservationData.guests
      )

      if (!availableTables) {
        throw new Error('No available tables for the requested time and guest count')
      }

      tableId = availableTables[0].id
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
      table_id: tableId!,
    }

    const result = await supabase
      .from('reservations')
      .insert(finalReservationData)
      .select(`
        *,
        table:table_id (*),
        client:client_id (*)
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
      table: result.data.table,
      client: result.data.client
    }
  }

  // Find an available table for a reservation
  public async findAvailableTables(
    restaurantId: number,
    startTime: string,
    endTime: string,
    guests: number
  ) {
    // Get restaurant configuration
    const restaurant = await this.getRestaurant(restaurantId)

    // Get suitable tables (ordered by capacity ascending to prefer smaller tables)
    const tables = await this.getTables(restaurantId, guests)

    // Calculate time windows with buffer
    const requestStart = new Date(startTime)
    const requestEnd = new Date(endTime)


    let availableTables: Table[] = []
    // Check each table for availability
    for (const table of tables) {
      const { data: conflicts } = await this.getConflictingReservations(
        table.id,
        requestStart.toISOString(),
        requestEnd.toISOString(),
        restaurant.buffer_time
      )


      if (!conflicts || conflicts.length === 0) {
        availableTables.push(table)
      }
    }
    if (availableTables.length === 0) {
      return null
    }
    return availableTables
  }

  // Check if a specific table is available for a reservation
  public async isTableAvailableForReservation(
    tableId: number,
    startTime: string,
    endTime: string,
    restaurantId: number
  ): Promise<boolean> {
    // Get restaurant configuration for buffer time
    const restaurant = await this.getRestaurant(restaurantId)

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