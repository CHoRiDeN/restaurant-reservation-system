import { authenticateApiKey } from '../../../../../../lib/auth/api-auth'
import { getClient, updateClient, deleteClient } from '../../../../../../services/clients'
import { createSuccessResponse, UnauthorizedResponse, ForbiddenResponse, BadRequestResponse, InternalServerErrorResponse, NotFoundResponse } from '../../../../../../lib/utils/responses'

// GET /api/restaurants/[restId]/clients/[clientId] - Get specific client
export async function GET(
  request: Request,
  context: { params: Promise<{ restId: string, clientId: string }> }
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
    
    // VALIDATION: Parse clientId
    const clientId = parseInt(params.clientId)
    if (isNaN(clientId)) {
      return BadRequestResponse('Invalid client ID')
    }
    
    // PATTERN: Business logic - get client
    const client = await getClient(clientId)
    
    if (!client) {
      return NotFoundResponse('Client not found')
    }
    
    return createSuccessResponse({ client })
    
  } catch (error) {
    console.error('Client retrieval error:', error)
    return InternalServerErrorResponse('Unable to fetch client')
  }
}

// PUT /api/restaurants/[restId]/clients/[clientId] - Update specific client
export async function PUT(
  request: Request,
  context: { params: Promise<{ restId: string, clientId: string }> }
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
    
    // VALIDATION: Parse clientId
    const clientId = parseInt(params.clientId)
    if (isNaN(clientId)) {
      return BadRequestResponse('Invalid client ID')
    }
    
    // PATTERN: Parse request body
    const body = await request.json()
    const { name, email, phone } = body
    
    // PATTERN: Business logic - update client
    const client = await updateClient(clientId, { name, email, phone })
    
    return createSuccessResponse({ client })
    
  } catch (error) {
    console.error('Client update error:', error)
    
    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NotFoundResponse('Client not found')
      }
      if (error.message.includes('already exists')) {
        return BadRequestResponse(error.message)
      }
      if (error.message.includes('Invalid')) {
        return BadRequestResponse(error.message)
      }
    }
    
    return InternalServerErrorResponse('Unable to update client')
  }
}

// DELETE /api/restaurants/[restId]/clients/[clientId] - Delete specific client
export async function DELETE(
  request: Request,
  context: { params: Promise<{ restId: string, clientId: string }> }
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
    
    // VALIDATION: Parse clientId
    const clientId = parseInt(params.clientId)
    if (isNaN(clientId)) {
      return BadRequestResponse('Invalid client ID')
    }
    
    // PATTERN: Business logic - delete client
    await deleteClient(clientId)
    
    return createSuccessResponse({ message: 'Client deleted successfully' })
    
  } catch (error) {
    console.error('Client deletion error:', error)
    
    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NotFoundResponse('Client not found')
      }
    }
    
    return InternalServerErrorResponse('Unable to delete client')
  }
}