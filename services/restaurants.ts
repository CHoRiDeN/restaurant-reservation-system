import { RestaurantRepository } from '../repositories/database'
import { Restaurant } from '../lib/supabase/types'

export async function getRestaurantConfig(restaurantId: number) {
  const db = new RestaurantRepository()
  
  try {
    // Get restaurant with related schedules and tables
    const { data: restaurant, error } = await db.getRestaurantWithSchedules(restaurantId)
    
    if (error || !restaurant) {
      return null
    }

    // Format the response to match API expectations
    return {
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        reservationDuration: restaurant.reservation_duration,
        bufferTime: restaurant.buffer_time
      },
      schedules: restaurant.schedules || [],
      tables: restaurant.tables || [],
      totalTables: restaurant.tables?.length || 0,
      maxCapacity: restaurant.tables?.reduce((max: number, table: any) => Math.max(max, table.capacity), 0) || 0
    }
  } catch (error) {
    console.error('Error getting restaurant config:', error)
    return null
  }
}

export async function getRestaurantById(restaurantId: number): Promise<Restaurant | null> {
  const db = new RestaurantRepository()
  
  try {
    const restaurant = await db.getRestaurant(restaurantId)
    
 
    
    return restaurant as Restaurant
  } catch (error) {
    console.error('Error getting restaurant:', error)
    return null
  }
}

export async function getRestaurantTables(restaurantId: number, minCapacity?: number) {
  const db = new RestaurantRepository()
  
  try {
    const { data: tables, error } = await db.getTables(restaurantId, minCapacity)
    
    if (error) {
      return []
    }
    
    return tables || []
  } catch (error) {
    console.error('Error getting restaurant tables:', error)
    return []
  }
}

export async function getRestaurantSchedules(restaurantId: number) {
  const db = new RestaurantRepository()
  
  try {
    const { data: restaurant, error } = await db.getRestaurantWithSchedules(restaurantId)
    
    if (error || !restaurant) {
      return []
    }
    
    return restaurant.schedules || []
  } catch (error) {
    console.error('Error getting restaurant schedules:', error)
    return []
  }
}