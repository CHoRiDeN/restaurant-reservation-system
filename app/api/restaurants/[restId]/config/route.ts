import { authenticateApiKey } from '../../../../../lib/auth/api-auth'
import { getRestaurantConfig } from '../../../../../services/restaurants'
import { createSuccessResponse, UnauthorizedResponse, ForbiddenResponse, NotFoundResponse, InternalServerErrorResponse } from '../../../../../lib/utils/responses'

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
    
    // PATTERN: Business logic
    const config = await getRestaurantConfig(restaurant.id)
    
    if (!config) {
      return NotFoundResponse('Restaurant configuration not found')
    }
    
    return createSuccessResponse(config)
  } catch (error) {
    console.error('Restaurant config error:', error)
    return InternalServerErrorResponse('Unable to retrieve restaurant configuration')
  }
}