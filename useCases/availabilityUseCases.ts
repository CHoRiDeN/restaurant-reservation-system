import { RestaurantRepository } from "@/repositories/database"
import { Table } from "@/lib/supabase/types"
import { getAvailableSlotsForDayAndTable } from "@/services/tableService"

export async function checkAvailabilityUseCase(
  restaurantId: number,
  datetime: string,
  guests: number
): Promise<{ isAvailable: boolean, availableTables: Table[], alternativeSlots: { start_time: Date, end_time: Date }[] }> {
  const db = new RestaurantRepository()

  try {
    const restaurant = await db.getRestaurant(restaurantId)


    // STEP 2: Get day of week (0=Sunday, 6=Saturday)
    const requestDate = new Date(datetime)
    const dayOfWeek = requestDate.getDay()
    console.log('dayOfWeek', dayOfWeek)


    const requestEnd = new Date(requestDate.getTime() + restaurant.reservation_duration * 60000)


    console.log('looking for available table', requestDate, requestEnd, guests)
    const availableTables = await db.findAvailableTables(
      restaurantId,
      requestDate.toISOString(),
      requestEnd.toISOString(),
      guests
    )

    if (availableTables) {
      return {
        isAvailable: true,
        availableTables: availableTables,
        alternativeSlots: []
      }
    }else{

    }

    const tables = await db.getTables(restaurantId, guests)
    console.log('tables', tables)
    if(tables.length === 0) {
      return {
        isAvailable: false,
        availableTables: [],
        alternativeSlots: []
      }
    }
    const slots = await getAvailableSlotsForDayAndTable(restaurantId, requestDate, tables[0].id)
    console.log('slots for table 1', slots)
    //TODO: de cada mesa obtener suggestedReservation anterior y posterior
    //TODO: mergearlos todos y ordenarlos


    return {
      isAvailable: false,
      availableTables: [],
      alternativeSlots: slots
    }
  } catch (error) {
    console.error('Availability check error:', error)
    return {
      isAvailable: false,
      availableTables: [],
      alternativeSlots: []
    }
  }
}