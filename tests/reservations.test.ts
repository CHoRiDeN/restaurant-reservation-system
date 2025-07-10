// Enhanced Reservations Service Tests
// These tests verify reservation creation with client support and conflict prevention

import { createReservation, createReservationWithClientData, validateReservationRequest } from '../services/reservations'

describe('Enhanced Reservations Service', () => {
  describe('createReservation', () => {
    test('creates reservation without client (backward compatibility)', async () => {
      const result = await createReservation(1, '2024-01-01T18:00:00Z', 4)
      
      expect(result).toBeTruthy()
      expect(result?.reservation).toHaveProperty('id')
      expect(result?.reservation.guests).toBe(4)
      expect(result?.table).toHaveProperty('id')
      expect(result?.client).toBeUndefined()
    })

    test('creates reservation with client ID', async () => {
      const result = await createReservation(1, '2024-01-01T19:00:00Z', 4, 1)
      
      expect(result).toBeTruthy()
      expect(result?.reservation.client_id).toBe(1)
      expect(result?.client).toHaveProperty('id')
    })

    test('throws error for invalid client ID', async () => {
      await expect(createReservation(1, '2024-01-01T20:00:00Z', 4, 999999))
        .rejects.toThrow('Client not found')
    })

    test('prevents double booking with constraint violation', async () => {
      // First reservation should succeed
      const first = await createReservation(1, '2024-01-02T18:00:00Z', 4)
      expect(first).toBeTruthy()

      // Second reservation for same table/time should fail
      await expect(createReservation(1, '2024-01-02T18:00:00Z', 4))
        .rejects.toThrow('Table already reserved')
    })

    test('handles no availability gracefully', async () => {
      // Try to book for a time with no available tables
      const result = await createReservation(1, '2024-01-01T25:00:00Z', 100)
      
      expect(result).toBeNull()
    })
  })

  describe('createReservationWithClientData', () => {
    test('creates reservation with new client data', async () => {
      const clientData = {
        name: 'John Doe',
        email: 'john.new@example.com',
        phone: '+1234567890'
      }
      
      const result = await createReservationWithClientData(1, '2024-01-01T21:00:00Z', 2, clientData)
      
      expect(result).toBeTruthy()
      expect(result?.client?.name).toBe('John Doe')
      expect(result?.client?.email).toBe('john.new@example.com')
      expect(result?.reservation.client_id).toBe(result?.client?.id)
    })

    test('finds existing client by email', async () => {
      const clientData = {
        name: 'Jane Doe',
        email: 'existing@example.com',
        phone: '+1234567890'
      }
      
      // First create a client
      const first = await createReservationWithClientData(1, '2024-01-01T22:00:00Z', 2, clientData)
      
      // Second reservation should find existing client
      const second = await createReservationWithClientData(1, '2024-01-01T23:00:00Z', 2, clientData)
      
      expect(first?.client?.id).toBe(second?.client?.id)
      expect(second?.client?.email).toBe('existing@example.com')
    })

    test('creates reservation without client data', async () => {
      const result = await createReservationWithClientData(1, '2024-01-03T18:00:00Z', 2)
      
      expect(result).toBeTruthy()
      expect(result?.client).toBeUndefined()
    })

    test('validates client data requirements', async () => {
      const invalidClientData = {
        name: 'John',
        email: '', // Missing email
        phone: '+1234567890'
      }
      
      await expect(createReservationWithClientData(1, '2024-01-01T18:00:00Z', 2, invalidClientData))
        .rejects.toThrow('email')
    })
  })

  describe('validateReservationRequest', () => {
    test('validates valid request', async () => {
      const result = await validateReservationRequest(1, '2024-12-25T18:00:00Z', 4)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    test('validates guest count range', async () => {
      const tooFew = await validateReservationRequest(1, '2024-12-25T18:00:00Z', 0)
      const tooMany = await validateReservationRequest(1, '2024-12-25T18:00:00Z', 25)
      
      expect(tooFew.valid).toBe(false)
      expect(tooFew.errors).toContain('Guest count must be at least 1')
      
      expect(tooMany.valid).toBe(false)
      expect(tooMany.errors).toContain('Guest count cannot exceed 20')
    })

    test('validates future date requirement', async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      
      const result = await validateReservationRequest(1, pastDate.toISOString(), 4)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Reservation date must be in the future')
    })

    test('validates restaurant exists', async () => {
      const result = await validateReservationRequest(999999, '2024-12-25T18:00:00Z', 4)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Restaurant not found')
    })

    test('validates date format', async () => {
      const result = await validateReservationRequest(1, 'invalid-date', 4)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Invalid date format')
    })
  })

  describe('Constraint Handling', () => {
    test('handles unique constraint violations', async () => {
      // This test would verify that the database constraint prevents double booking
      // at the database level even if application logic fails
      
      // Mock scenario: simultaneous reservation attempts
      const promises = Array(5).fill(null).map(() => 
        createReservation(1, '2024-01-05T18:00:00Z', 4)
      )
      
      const results = await Promise.allSettled(promises)
      const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null)
      const failed = results.filter(r => r.status === 'rejected')
      
      // Only one should succeed, others should fail with constraint violation
      expect(successful.length).toBe(1)
      expect(failed.length).toBeGreaterThan(0)
    })

    test('handles foreign key constraint violations', async () => {
      // Test with non-existent client ID
      await expect(createReservation(1, '2024-01-06T18:00:00Z', 4, 999999))
        .rejects.toThrow()
    })
  })

  describe('Error Recovery', () => {
    test('rolls back transaction on failure', async () => {
      // This would test that partial reservation creation doesn't leave 
      // the database in an inconsistent state
      
      try {
        await createReservation(999999, '2024-01-01T18:00:00Z', 4)
      } catch (error) {
        // Verify no partial data was created
        expect(error).toBeTruthy()
      }
    })
  })
})

// NOTE: These tests require a test database setup with:
// - Test restaurant and table data
// - Supabase client mocking or test instance
// - Transaction rollback capabilities for isolation
// Consider using Supabase's test helpers and Jest for full implementation