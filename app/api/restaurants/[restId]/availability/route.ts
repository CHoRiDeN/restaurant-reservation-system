import { authenticateApiKey } from '../../../../../lib/auth/api-auth'
import { checkAvailability } from '../../../../../services/availability'
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
    const time = searchParams.get('time') || ''
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
    
    // VALIDATION: Check guests
    if (guests < 1 || guests > 20) {
      return BadRequestResponse('guests must be between 1 and 20')
    }
    
    // PATTERN: Business logic - enhanced availability with table counts
    const availability = await checkAvailability(restaurant.id, date, time, guests)
    
    return createSuccessResponse({
      date,
      guests,
      availableSlots: availability.availableSlots,
      tablesAvailable: availability.tablesAvailable,
      totalTables: availability.totalTables,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        reservationDuration: restaurant.reservation_duration,
        bufferTime: restaurant.buffer_time
      }
    })
  } catch (error) {
    console.error('Availability check error:', error)
    return InternalServerErrorResponse('Unable to check availability')
  }
}