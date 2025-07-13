import { authenticateApiKey } from '../../../../../lib/auth/api-auth'
import { createReservation, createReservationWithClientData, validateReservationRequest } from '../../../../../services/reservations'
import { createSuccessResponse, UnauthorizedResponse, ForbiddenResponse, BadRequestResponse } from '../../../../../lib/utils/responses'

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
    const { start_time, guests, client_id, client, notes } = body
    
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
    
    let result
    
    if (client) {
      const { name, email, phone } = client
      if (!name || !phone) {
        return BadRequestResponse('Client name and phone are required')
      }
      result = await createReservationWithClientData(restaurant.id, start_time, guests, { name, email, phone }, notes)
    } else if (client_id) {
      result = await createReservation(restaurant.id, start_time, guests, client_id, notes)
    } else {
      throw new Error('Client data is required')
    }
    
    if (!result) {
      throw new Error('Unable to create reservation - no availability')
    }
    
    const responseData: Record<string, unknown> = {
      reservation: result.reservation,
      table: result.table
    }
    
    if (result.client) {
      responseData.client = result.client
    }
    
    return createSuccessResponse(responseData, 201)
    
  } catch (error) {
    console.error('Reservation creation error:', error)
    
    
    return BadRequestResponse(error instanceof Error ? error.message : 'Unknown error')
  }
}