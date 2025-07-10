import { authenticateApiKey } from '../../../../../lib/auth/api-auth'
import { createReservation, validateReservationRequest } from '../../../../../services/reservations'
import { createSuccessResponse, UnauthorizedResponse, ForbiddenResponse, BadRequestResponse, InternalServerErrorResponse } from '../../../../../lib/utils/responses'

export async function POST(
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
    
    // PATTERN: Parse request body
    const body = await request.json()
    const { date, guests } = body
    
    // VALIDATION: Check required fields
    if (!date || !guests) {
      return BadRequestResponse('date and guests are required')
    }
    
    // VALIDATION: Validate request
    const validation = await validateReservationRequest(restaurant.id, date, guests)
    if (!validation.valid) {
      return BadRequestResponse(validation.errors.join(', '))
    }
    
    // PATTERN: Business logic - create reservation
    const result = await createReservation(restaurant.id, date, guests)
    
    if (!result) {
      return BadRequestResponse('Unable to create reservation - no availability')
    }
    
    return createSuccessResponse({
      reservation: result.reservation,
      table: result.table
    }, 201)
    
  } catch (error) {
    console.error('Reservation creation error:', error)
    
    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message.includes('No availability') || error.message.includes('No suitable table')) {
        return BadRequestResponse(error.message)
      }
    }
    
    return InternalServerErrorResponse('Unable to create reservation')
  }
}