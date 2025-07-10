import { RestaurantRepository } from '../repositories/database'
import { Client } from '../lib/supabase/types'

export async function createClient(
  clientData: {
    name: string
    email: string
    phone?: string
  }
): Promise<Client> {
  const db = new RestaurantRepository()

  try {
    // STEP 1: Validate client data
    const validation = await validateClientData(clientData)
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '))
    }

    // STEP 2: Check if client already exists
    const { data: existingClient } = await db.getClientByEmail(clientData.email)
    if (existingClient) {
      throw new Error('Client with this email already exists')
    }

    // STEP 3: Create client
    const { data: client, error } = await db.createClient(clientData)

    if (error || !client) {
      throw new Error(`Failed to create client: ${error?.message || 'Unknown error'}`)
    }

    return client
  } catch (error) {
    console.error('Client creation error:', error)
    throw error
  }
}

export async function getClient(id: number): Promise<Client | null> {
  const db = new RestaurantRepository()

  try {
    const { data: client, error } = await db.getClient(id)
    
    if (error) {
      console.error('Error fetching client:', error)
      return null
    }

    return client
  } catch (error) {
    console.error('Client retrieval error:', error)
    return null
  }
}

export async function getClientByEmail(email: string): Promise<Client | null> {
  const db = new RestaurantRepository()

  try {
    const { data: client, error } = await db.getClientByEmail(email)
    
    if (error) {
      console.error('Error fetching client by email:', error)
      return null
    }

    return client
  } catch (error) {
    console.error('Client retrieval by email error:', error)
    return null
  }
}

export async function updateClient(
  id: number,
  updates: {
    name?: string
    email?: string
    phone?: string
  }
): Promise<Client> {
  const db = new RestaurantRepository()

  try {
    // STEP 1: Validate updates
    const validation = await validateClientData(updates, true)
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '))
    }

    // STEP 2: Check if client exists
    const existingClient = await getClient(id)
    if (!existingClient) {
      throw new Error('Client not found')
    }

    // STEP 3: Check email uniqueness if updating email
    if (updates.email && updates.email !== existingClient.email) {
      const { data: emailCheck } = await db.getClientByEmail(updates.email)
      if (emailCheck) {
        throw new Error('Client with this email already exists')
      }
    }

    // STEP 4: Update client
    const { data: client, error } = await db.updateClient(id, updates)

    if (error || !client) {
      throw new Error(`Failed to update client: ${error?.message || 'Unknown error'}`)
    }

    return client
  } catch (error) {
    console.error('Client update error:', error)
    throw error
  }
}

export async function deleteClient(id: number): Promise<void> {
  const db = new RestaurantRepository()

  try {
    // STEP 1: Check if client exists
    const existingClient = await getClient(id)
    if (!existingClient) {
      throw new Error('Client not found')
    }

    // STEP 2: Delete client
    const { error } = await db.deleteClient(id)

    if (error) {
      throw new Error(`Failed to delete client: ${error.message}`)
    }
  } catch (error) {
    console.error('Client deletion error:', error)
    throw error
  }
}

export async function getClients(filters?: {
  search?: string
  limit?: number
  offset?: number
}): Promise<{ clients: Client[], total: number }> {
  const db = new RestaurantRepository()

  try {
    const { data: clients, error, count } = await db.getClients(filters)

    if (error) {
      throw new Error(`Failed to fetch clients: ${error.message}`)
    }

    return {
      clients: clients || [],
      total: count || 0
    }
  } catch (error) {
    console.error('Client listing error:', error)
    throw error
  }
}

export async function validateClientData(
  clientData: {
    name?: string
    email?: string
    phone?: string
  },
  isUpdate = false
): Promise<{ valid: boolean, errors: string[] }> {
  const errors: string[] = []

  // Validate name
  if (!isUpdate && !clientData.name) {
    errors.push('Name is required')
  }
  if (clientData.name && clientData.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long')
  }
  if (clientData.name && clientData.name.trim().length > 100) {
    errors.push('Name cannot exceed 100 characters')
  }

  // Validate email
  if (!isUpdate && !clientData.email) {
    errors.push('Email is required')
  }
  if (clientData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(clientData.email)) {
      errors.push('Invalid email format')
    }
    if (clientData.email.length > 255) {
      errors.push('Email cannot exceed 255 characters')
    }
  }

  // Validate phone (optional)
  if (clientData.phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    if (!phoneRegex.test(clientData.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.push('Invalid phone format')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export async function findOrCreateClient(
  clientData: {
    name: string
    email: string
    phone?: string
  }
): Promise<Client> {
  try {
    // Try to find existing client first
    const existingClient = await getClientByEmail(clientData.email)
    if (existingClient) {
      return existingClient
    }

    // Create new client if not found
    return await createClient(clientData)
  } catch (error) {
    console.error('Find or create client error:', error)
    throw error
  }
}