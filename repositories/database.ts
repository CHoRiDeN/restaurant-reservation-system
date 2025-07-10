import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '../lib/supabase/client'
import { Restaurant, Table, Schedule, ScheduleException, Reservation } from '../lib/supabase/types'

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
    endTime: string
  ) {
    const supabase = await this.getSupabase()
    return await supabase
      .from('reservations')
      .select('*')
      .eq('table_id', tableId)
      .eq('confirmed', true)
      .or(`
        and(date.lte.${startTime}, date.gte.${endTime}),
        and(date.gte.${startTime}, date.lte.${endTime})
      `)
  }

  async createReservation(reservationData: {
    date: string
    guests: number
    table_id: number
    restaurant_id: number
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
    date?: string
    tableId?: number
  }) {
    const supabase = await this.getSupabase()
    let query = supabase
      .from('reservations')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('confirmed', true)

    if (filters?.date) {
      query = query.gte('date', filters.date)
    }

    if (filters?.tableId) {
      query = query.eq('table_id', filters.tableId)
    }

    return await query.order('date', { ascending: true })
  }
}