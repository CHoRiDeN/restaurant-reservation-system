import { authenticateApiKey } from '../../../../../lib/auth/api-auth'
import { getAvailableTablesForSlot } from '../../../../../services/availability'
import { createSuccessResponse, UnauthorizedResponse, ForbiddenResponse, BadRequestResponse, InternalServerErrorResponse } from '../../../../../lib/utils/responses'

export async function GET(
  request: Request,
  context: { params: Promise<{ restId: string }> }
) {
  try {
    const params = await context.params
    
    // PATTERN: Authenticate first
    const restaurant = await authenticateApiKey(request)
    if (!restaurant) {
      return UnauthorizedResponse()
    }
    
    // PATTERN: Validate restaurant ID matches
    if (restaurant.id.toString() !== params.restId) {
      return ForbiddenResponse()
    }
    
    // PATTERN: Extract and validate query parameters
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const time = searchParams.get('time') || '12:00'
    const guests = parseInt(searchParams.get('guests') || '0')
    
    // VALIDATION: Check required parameters
    if (!date || !guests) {
      return BadRequestResponse('date and guests parameters are required')
    }
    
    // VALIDATION: Check date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return BadRequestResponse('date must be in YYYY-MM-DD format')
    }
    
    // VALIDATION: Check time format
    const timeRegex = /^\d{2}:\d{2}$/
    if (!timeRegex.test(time)) {
      return BadRequestResponse('time must be in HH:MM format')
    }
    
    // VALIDATION: Check guests
    if (guests < 1 || guests > 20) {
      return BadRequestResponse('guests must be between 1 and 20')
    }
    
    // PATTERN: Business logic
    const availableTables = await getAvailableTablesForSlot(restaurant.id, date, time, guests)
    
    return createSuccessResponse({
      date,
      time,
      guests,
      availableTables: availableTables.map(table => ({
        id: table.id,
        capacity: table.capacity,
        zoneId: table.zone_id
      })),
      totalAvailable: availableTables.length,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        reservationDuration: restaurant.reservation_duration,
        bufferTime: restaurant.buffer_time
      }
    })
  } catch (error) {
    console.error('Available tables check error:', error)
    return InternalServerErrorResponse('Unable to check available tables')
  }
}