// Client Management Service Tests
// These tests verify client CRUD operations and validation

import { createClient, getClient, getClientByEmail, updateClient, deleteClient, getClients, validateClientData, findOrCreateClient } from '../services/clients'

describe('Client Management Service', () => {
  describe('createClient', () => {
    test('creates client with valid data', async () => {
      const clientData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      }
      
      const client = await createClient(clientData)
      
      expect(client).toHaveProperty('id')
      expect(client.name).toBe('John Doe')
      expect(client.email).toBe('john@example.com')
      expect(client.phone).toBe('+1234567890')
      expect(client).toHaveProperty('created_at')
      expect(client).toHaveProperty('updated_at')
    })

    test('creates client without phone', async () => {
      const clientData = {
        name: 'Jane Doe',
        email: 'jane@example.com'
      }
      
      const client = await createClient(clientData)
      
      expect(client.name).toBe('Jane Doe')
      expect(client.phone).toBeUndefined()
    })

    test('throws error for duplicate email', async () => {
      const clientData = {
        name: 'John Duplicate',
        email: 'duplicate@example.com',
        phone: '+1234567890'
      }
      
      // First creation should succeed
      await createClient(clientData)
      
      // Second creation should fail
      await expect(createClient(clientData))
        .rejects.toThrow('Client with this email already exists')
    })

    test('validates required fields', async () => {
      const invalidData = {
        name: '',
        email: 'test@example.com'
      }
      
      await expect(createClient(invalidData))
        .rejects.toThrow('Name must be at least 2 characters')
    })
  })

  describe('getClient', () => {
    test('retrieves existing client', async () => {
      const client = await getClient(1)
      
      expect(client).toHaveProperty('id')
      expect(client?.id).toBe(1)
    })

    test('returns null for non-existent client', async () => {
      const client = await getClient(999999)
      
      expect(client).toBeNull()
    })
  })

  describe('getClientByEmail', () => {
    test('retrieves client by email', async () => {
      const client = await getClientByEmail('john@example.com')
      
      expect(client).toHaveProperty('email')
      expect(client?.email).toBe('john@example.com')
    })

    test('returns null for non-existent email', async () => {
      const client = await getClientByEmail('nonexistent@example.com')
      
      expect(client).toBeNull()
    })
  })

  describe('updateClient', () => {
    test('updates client data', async () => {
      // First create a client
      const original = await createClient({
        name: 'Original Name',
        email: 'original@example.com'
      })
      
      const updated = await updateClient(original.id, {
        name: 'Updated Name',
        phone: '+1111111111'
      })
      
      expect(updated.name).toBe('Updated Name')
      expect(updated.email).toBe('original@example.com') // Unchanged
      expect(updated.phone).toBe('+1111111111')
      expect(updated.updated_at).not.toBe(original.updated_at)
    })

    test('updates email with uniqueness check', async () => {
      const client1 = await createClient({
        name: 'Client 1',
        email: 'client1@example.com'
      })
      
      const client2 = await createClient({
        name: 'Client 2',
        email: 'client2@example.com'
      })
      
      // Try to update client2 to use client1's email
      await expect(updateClient(client2.id, { email: 'client1@example.com' }))
        .rejects.toThrow('Client with this email already exists')
    })

    test('throws error for non-existent client', async () => {
      await expect(updateClient(999999, { name: 'Updated' }))
        .rejects.toThrow('Client not found')
    })
  })

  describe('deleteClient', () => {
    test('deletes existing client', async () => {
      const client = await createClient({
        name: 'To Delete',
        email: 'delete@example.com'
      })
      
      await deleteClient(client.id)
      
      const deletedClient = await getClient(client.id)
      expect(deletedClient).toBeNull()
    })

    test('throws error for non-existent client', async () => {
      await expect(deleteClient(999999))
        .rejects.toThrow('Client not found')
    })
  })

  describe('getClients', () => {
    test('returns all clients without filters', async () => {
      const result = await getClients()
      
      expect(result).toHaveProperty('clients')
      expect(result).toHaveProperty('total')
      expect(Array.isArray(result.clients)).toBe(true)
      expect(typeof result.total).toBe('number')
    })

    test('supports search filtering', async () => {
      const result = await getClients({ search: 'john' })
      
      expect(result.clients.every(client => 
        client.name.toLowerCase().includes('john') || 
        client.email.toLowerCase().includes('john')
      )).toBe(true)
    })

    test('supports pagination', async () => {
      const firstPage = await getClients({ limit: 2, offset: 0 })
      const secondPage = await getClients({ limit: 2, offset: 2 })
      
      expect(firstPage.clients.length).toBeLessThanOrEqual(2)
      expect(secondPage.clients.length).toBeLessThanOrEqual(2)
      
      // Should be different clients (if enough exist)
      if (firstPage.clients.length > 0 && secondPage.clients.length > 0) {
        expect(firstPage.clients[0].id).not.toBe(secondPage.clients[0].id)
      }
    })
  })

  describe('validateClientData', () => {
    test('validates correct data', async () => {
      const result = await validateClientData({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      })
      
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    test('validates name requirements', async () => {
      const shortName = await validateClientData({
        name: 'J',
        email: 'j@example.com'
      })
      
      const longName = await validateClientData({
        name: 'A'.repeat(101),
        email: 'long@example.com'
      })
      
      expect(shortName.valid).toBe(false)
      expect(shortName.errors).toContain('Name must be at least 2 characters long')
      
      expect(longName.valid).toBe(false)
      expect(longName.errors).toContain('Name cannot exceed 100 characters')
    })

    test('validates email format', async () => {
      const invalidEmail = await validateClientData({
        name: 'John Doe',
        email: 'invalid-email'
      })
      
      expect(invalidEmail.valid).toBe(false)
      expect(invalidEmail.errors).toContain('Invalid email format')
    })

    test('validates phone format', async () => {
      const invalidPhone = await validateClientData({
        name: 'John Doe',
        email: 'john@example.com',
        phone: 'invalid-phone'
      })
      
      expect(invalidPhone.valid).toBe(false)
      expect(invalidPhone.errors).toContain('Invalid phone format')
    })

    test('validates update mode (partial data)', async () => {
      const result = await validateClientData({
        name: 'Updated Name'
        // email not required for updates
      }, true)
      
      expect(result.valid).toBe(true)
    })
  })

  describe('findOrCreateClient', () => {
    test('finds existing client', async () => {
      const existingClient = await createClient({
        name: 'Existing Client',
        email: 'existing@example.com'
      })
      
      const foundClient = await findOrCreateClient({
        name: 'Different Name', // Should be ignored
        email: 'existing@example.com'
      })
      
      expect(foundClient.id).toBe(existingClient.id)
      expect(foundClient.name).toBe('Existing Client') // Original name preserved
    })

    test('creates new client when not found', async () => {
      const newClient = await findOrCreateClient({
        name: 'New Client',
        email: 'new@example.com',
        phone: '+9876543210'
      })
      
      expect(newClient.name).toBe('New Client')
      expect(newClient.email).toBe('new@example.com')
      expect(newClient.phone).toBe('+9876543210')
    })
  })

  describe('Data Integrity', () => {
    test('enforces email uniqueness at database level', async () => {
      // This test would verify database constraint enforcement
      const clientData = {
        name: 'Constraint Test',
        email: 'constraint@example.com'
      }
      
      await createClient(clientData)
      
      // Direct database insertion should fail
      // (This would require database-level testing)
      await expect(createClient(clientData))
        .rejects.toThrow('already exists')
    })

    test('handles concurrent client creation', async () => {
      const clientData = {
        name: 'Concurrent Test',
        email: 'concurrent@example.com'
      }
      
      const promises = Array(3).fill(null).map(() => 
        findOrCreateClient(clientData)
      )
      
      const results = await Promise.all(promises)
      
      // All should return the same client ID
      expect(results[0].id).toBe(results[1].id)
      expect(results[1].id).toBe(results[2].id)
    })
  })
})

// NOTE: These tests require:
// - Test database setup with proper isolation
// - Supabase client mocking or test instance  
// - Transaction rollback for test cleanup
// - Mock data for realistic testing scenarios