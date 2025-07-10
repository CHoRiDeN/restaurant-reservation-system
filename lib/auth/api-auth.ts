import { createClient } from '../supabase/client'
import { Restaurant } from '../supabase/types'

export async function authenticateApiKey(request: Request): Promise<Restaurant | null> {
  try {
    // PATTERN: Extract from Authorization header or query parameter
    const authHeader = request.headers.get('Authorization')
    const apiKey = authHeader?.replace('Bearer ', '') || new URL(request.url).searchParams.get('api_key')
    
    if (!apiKey) {
      return null
    }
    
    // CRITICAL: Query database for restaurant by API key
    const supabase = await createClient()
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('api_key', apiKey)
      .single()
    
    if (error || !restaurant) {
      return null
    }
    
    return restaurant as Restaurant
  } catch (error) {
    console.error('API authentication error:', error)
    return null
  }
}