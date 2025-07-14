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
    const { start_time, guests, client_name, client_phone, notes } = body

    // VALIDATION: Check required fields
    if (!start_time || !guests) {
      return BadRequestResponse('start_time and guests are required')
    }

    // VALIDATION: Check client data consistency and mandatory requirement
    if (!client_name || !client_phone) {
      return BadRequestResponse('Client name and phone are required')
    }



    // VALIDATION: Validate request
    const validation = await validateReservationRequest(restaurant.id, start_time, guests)
    if (!validation.valid) {
      return BadRequestResponse(validation.errors.join(', '))
    }

    let result

    result = await createReservationWithClientData(restaurant.id, start_time, guests, client_name, client_phone, notes)

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