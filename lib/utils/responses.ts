// Standardized API response utilities

export function createErrorResponse(
  error: string,
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
): Response {
  return new Response(JSON.stringify({
    error,
    message,
    ...(details && { details })
  }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

export function createSuccessResponse(data: Record<string, unknown>, status: number = 200): Response {
  return new Response(JSON.stringify({
    success: true,
    data
  }), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

// Common error responses
export const UnauthorizedResponse = () => createErrorResponse(
  'Unauthorized',
  'Valid API key required',
  401
)

export const ForbiddenResponse = () => createErrorResponse(
  'Forbidden',
  'Restaurant ID does not match API key',
  403
)

export const BadRequestResponse = (message: string) => createErrorResponse(
  'Bad Request',
  message,
  400
)

export const InternalServerErrorResponse = (message: string = 'Internal server error') => createErrorResponse(
  'Internal Server Error',
  message,
  500
)

export const NotFoundResponse = (message: string = 'Resource not found') => createErrorResponse(
  'Not Found',
  message,
  404
)