// Enhanced Availability Service Tests
// These tests verify the enhanced availability functionality with table counts

import { checkAvailability, getAvailabilityForSlot, generateTimeSlots } from '../services/availability'

describe('Enhanced Availability Service', () => {
  describe('checkAvailability', () => {
    test('returns accurate table counts', async () => {
      // Test that table counts match actual availability
      const result = await checkAvailability(1, '2024-01-01', '18:00', 4)
      
      expect(result).toHaveProperty('availableSlots')
      expect(result).toHaveProperty('tablesAvailable')
      expect(result).toHaveProperty('totalTables')
      expect(result.tablesAvailable).toBeGreaterThanOrEqual(0)
      expect(result.totalTables).toBeGreaterThanOrEqual(0)
      expect(result.tablesAvailable).toBeLessThanOrEqual(result.totalTables)
    })

    test('handles restaurant not found', async () => {
      const result = await checkAvailability(999999, '2024-01-01', '18:00', 4)
      
      expect(result.availableSlots).toEqual([])
      expect(result.tablesAvailable).toBe(0)
      expect(result.totalTables).toBe(0)
    })

    test('handles no suitable tables for guest count', async () => {
      const result = await checkAvailability(1, '2024-01-01', '18:00', 100)
      
      expect(result.availableSlots).toEqual([])
      expect(result.tablesAvailable).toBe(0)
    })

    test('returns correct format for valid request', async () => {
      const result = await checkAvailability(1, '2024-01-01', '18:00', 2)
      
      expect(Array.isArray(result.availableSlots)).toBe(true)
      expect(typeof result.tablesAvailable).toBe('number')
      expect(typeof result.totalTables).toBe('number')
      expect(Array.isArray(result.tables)).toBe(true)
    })
  })

  describe('getAvailabilityForSlot', () => {
    test('returns slot availability information', async () => {
      const result = await getAvailabilityForSlot(1, '2024-01-01', '18:00', 4)
      
      expect(result).toHaveProperty('available')
      expect(result).toHaveProperty('tablesAvailable')
      expect(result).toHaveProperty('totalTables')
      expect(typeof result.available).toBe('boolean')
    })

    test('handles invalid restaurant', async () => {
      const result = await getAvailabilityForSlot(999999, '2024-01-01', '18:00', 4)
      
      expect(result.available).toBe(false)
      expect(result.tablesAvailable).toBe(0)
      expect(result.totalTables).toBe(0)
    })
  })

  describe('generateTimeSlots', () => {
    test('generates correct time slots', () => {
      const slots = generateTimeSlots('09:00', '17:00', 60)
      
      expect(slots).toContain('09:00')
      expect(slots).toContain('16:00')
      expect(slots).not.toContain('17:00') // Should not include closing time
      expect(slots.length).toBe(8) // 9, 10, 11, 12, 13, 14, 15, 16
    })

    test('handles 30-minute intervals', () => {
      const slots = generateTimeSlots('09:00', '11:00', 30)
      
      expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30'])
    })

    test('handles edge case of same opening and closing time', () => {
      const slots = generateTimeSlots('09:00', '09:00', 60)
      
      expect(slots).toEqual([])
    })
  })

  describe('Error Handling', () => {
    test('handles malformed date gracefully', async () => {
      const result = await checkAvailability(1, 'invalid-date', '18:00', 4)
      
      expect(result.availableSlots).toEqual([])
      expect(result.tablesAvailable).toBe(0)
    })

    test('handles malformed time gracefully', async () => {
      const result = await checkAvailability(1, '2024-01-01', 'invalid-time', 4)
      
      // Should still work as time is optional in checkAvailability
      expect(result).toHaveProperty('availableSlots')
    })
  })
})

// NOTE: These tests require a test database setup and mocking of Supabase client
// For full implementation, consider using Jest with @testing-library and Supabase test helpers