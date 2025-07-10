import { authenticateApiKey } from '../../../../../lib/auth/api-auth'
import { createClient, getClients, updateClient, deleteClient } from '../../../../../services/clients'
import { createSuccessResponse, UnauthorizedResponse, ForbiddenResponse, BadRequestResponse, InternalServerErrorResponse, NotFoundResponse } from '../../../../../lib/utils/responses'

// GET /api/restaurants/[restId]/clients - Get all clients for restaurant
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
    
    // PATTERN: Parse query parameters
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || undefined
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined
    const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined
    
    // PATTERN: Business logic - get clients
    const result = await getClients({ search, limit, offset })
    
    return createSuccessResponse({
      clients: result.clients,
      total: result.total,
      search: search || null,
      pagination: {
        limit: limit || 10,
        offset: offset || 0
      }
    })
    
  } catch (error) {
    console.error('Client listing error:', error)
    return InternalServerErrorResponse('Unable to fetch clients')
  }
}

// POST /api/restaurants/[restId]/clients - Create new client
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
    const { name, email, phone } = body
    
    // VALIDATION: Check required fields
    if (!name || !email) {
      return BadRequestResponse('name and email are required')
    }
    
    // PATTERN: Business logic - create client
    const client = await createClient({ name, email, phone })
    
    return createSuccessResponse({ client }, 201)
    
  } catch (error) {
    console.error('Client creation error:', error)
    
    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return BadRequestResponse(error.message)
      }
      if (error.message.includes('Invalid')) {
        return BadRequestResponse(error.message)
      }
    }
    
    return InternalServerErrorResponse('Unable to create client')
  }
}

// PUT /api/restaurants/[restId]/clients/[clientId] - Update client
export async function PUT(
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
    const { clientId, name, email, phone } = body
    
    // VALIDATION: Check required fields
    if (!clientId) {
      return BadRequestResponse('clientId is required')
    }
    
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

// DELETE /api/restaurants/[restId]/clients/[clientId] - Delete client
export async function DELETE(
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
    const { clientId } = body
    
    // VALIDATION: Check required fields
    if (!clientId) {
      return BadRequestResponse('clientId is required')
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