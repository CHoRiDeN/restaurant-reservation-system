import { RestaurantRepository } from "@/repositories/database"
import { Table } from "@/lib/supabase/types"

export async function checkAvailabilityUseCase(
    restaurantId: number,
    datetime: string,
    guests: number
  ): Promise<{ availableSlots: string[], tables: Table[], tablesAvailable: number, totalTables: number }> {
    const db = new RestaurantRepository()
  
    try {
      // STEP 1: Get restaurant configuration
      const restaurant = await db.getRestaurant(restaurantId)
   
  
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