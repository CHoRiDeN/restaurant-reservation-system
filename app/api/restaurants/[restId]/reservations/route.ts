import { authenticateApiKey } from '../../../../../lib/auth/api-auth'
import { createReservation, createReservationWithClientData, validateReservationRequest } from '../../../../../services/reservations'
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
    const { start_time, guests, client_id, client } = body
    
    // VALIDATION: Check required fields
    if (!start_time  || !guests) {
      return BadRequestResponse('start_time and guests are required')
    }
    
    // VALIDATION: Check client data consistency and mandatory requirement
    if (client_id && client) {
      return BadRequestResponse('Cannot specify both client_id and client data')
    }
    
    // VALIDATION: Client data is now mandatory
    if (!client_id && !client) {
      return BadRequestResponse('Client data is required - provide either client_id or client information')
    }
    
    // VALIDATION: Validate request
    const validation = await validateReservationRequest(restaurant.id, start_time, guests)
    if (!validation.valid) {
      return BadRequestResponse(validation.errors.join(', '))
    }
    
    // PATTERN: Business logic - create reservation with mandatory client support
    let result
    
    if (client) {
      // Create reservation with client data (will find or create client)
      const { name, email, phone } = client
      if (!name || !email) {
        return BadRequestResponse('Client name and email are required')
      }
      result = await createReservationWithClientData(restaurant.id, start_time, guests, { name, email, phone })
    } else if (client_id) {
      // Create reservation with existing client ID
      result = await createReservation(restaurant.id, start_time, guests, client_id)
    } else {
      // This should never happen due to validation above
      return BadRequestResponse('Client data is required')
    }
    
    if (!result) {
      return BadRequestResponse('Unable to create reservation - no availability')
    }
    
    const responseData: Record<string, unknown> = {
      reservation: result.reservation,
      table: result.table
    }
    
    // Include client information if available
    if (result.client) {
      responseData.client = result.client
    }
    
    return createSuccessResponse(responseData, 201)
    
  } catch (error) {
    console.error('Reservation creation error:', error)
    
    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message.includes('No availability') || error.message.includes('No suitable table')) {
        return BadRequestResponse(error.message)
      }
      if (error.message.includes('Table already reserved')) {
        return BadRequestResponse(error.message)
      }
      if (error.message.includes('Client not found')) {
        return BadRequestResponse(error.message)
      }
      if (error.message.includes('Client name and email are required')) {
        return BadRequestResponse(error.message)
      }
      if (error.message.includes('already exists')) {
        return BadRequestResponse(error.message)
      }
    }
    
    return InternalServerErrorResponse('Unable to create reservation')
  }
}