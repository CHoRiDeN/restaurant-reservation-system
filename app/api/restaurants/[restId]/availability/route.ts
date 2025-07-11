import { checkAvailabilityUseCase } from '@/useCases/availabilityUseCases'
import { authenticateApiKey } from '../../../../../lib/auth/api-auth'
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
    const datetime = searchParams.get('datetime')
    const guests = parseInt(searchParams.get('guests') || '0')
    
    // VALIDATION: Check required parameters
    if (!datetime || !guests) {
      return BadRequestResponse('datetime and guests parameters are required')
    }
    
    // VALIDATION: Check date format
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    if (!datetimeRegex.test(datetime)) {
      return BadRequestResponse('datetime must be in YYYY-MM-DDTHH:MM:SSZ format')
    }
    
    // VALIDATION: Check guests
    if (guests < 1 || guests > 20) {
      return BadRequestResponse('guests must be between 1 and 20')
    }
    
    // PATTERN: Business logic - enhanced availability with table counts
    const availability = await checkAvailabilityUseCase(restaurant.id, datetime, guests)
    
    return createSuccessResponse({
      datetime,
      guests,
      availability: availability,
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