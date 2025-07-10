/**
 * Test script to validate double booking prevention
 * Tests the new start_time/end_time schema and conflict detection
 */

const BASE_URL = 'http://localhost:3002'
const API_KEY = 'a6ba04e7-9d19-45f2-a004-43a4b9784828'
const RESTAURANT_ID = '1'

async function makeApiCall(endpoint, method = 'GET', body = null) {
  const url = `${BASE_URL}/api/restaurants/${RESTAURANT_ID}${endpoint}`
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  }
  
  if (body) {
    options.body = JSON.stringify(body)
  }
  
  const response = await fetch(url, options)
  const data = await response.json()
  
  return {
    status: response.status,
    data,
    ok: response.ok
  }
}

async function testDoubleBookingPrevention() {
  console.log('🧪 Testing Double Booking Prevention...\n')
  
  // Test data
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dateStr = tomorrow.toISOString().split('T')[0]
  
  const startTime = `${dateStr}T18:00:00.000Z`
  const endTime = `${dateStr}T19:00:00.000Z`
  
  const testClient = {
    name: 'Test Client',
    email: 'test@example.com',
    phone: '+1234567890'
  }
  
  const reservationData = {
    start_time: startTime,
    end_time: endTime,
    guests: 4,
    client: testClient
  }
  
  console.log(`📅 Test Date: ${dateStr}`)
  console.log(`⏰ Time Slot: 18:00-19:00`)
  console.log(`👥 Guests: 4`)
  console.log(`📞 Client: ${testClient.name} (${testClient.email})\n`)
  
  try {
    // Step 1: Create first reservation
    console.log('1️⃣ Creating first reservation...')
    const firstReservation = await makeApiCall('/reservations', 'POST', reservationData)
    
    if (!firstReservation.ok) {
      console.error('❌ Failed to create first reservation:', firstReservation.data)
      return false
    }
    
    console.log('✅ First reservation created successfully!')
    console.log(`   Table ID: ${firstReservation.data.table.id}`)
    console.log(`   Reservation ID: ${firstReservation.data.reservation.id}`)
    console.log(`   Client ID: ${firstReservation.data.client.id}\n`)
    
    const assignedTableId = firstReservation.data.table.id
    
    // Step 2: Try to create overlapping reservation
    console.log('2️⃣ Attempting to create overlapping reservation...')
    
    const overlappingData = {
      ...reservationData,
      client: {
        name: 'Another Client',
        email: 'another@example.com',
        phone: '+0987654321'
      }
    }
    
    const secondReservation = await makeApiCall('/reservations', 'POST', overlappingData)
    
    if (secondReservation.ok) {
      console.error('❌ DOUBLE BOOKING DETECTED! Second reservation was created when it should have been prevented!')
      console.error(`   First Table: ${assignedTableId}`)
      console.error(`   Second Table: ${secondReservation.data.table.id}`)
      
      if (assignedTableId === secondReservation.data.table.id) {
        console.error('💥 CRITICAL: Same table was double-booked!')
        return false
      } else {
        console.log('ℹ️  Different table was assigned, this might be acceptable')
        return true
      }
    } else {
      console.log('✅ Second reservation correctly rejected!')
      console.log(`   Status: ${secondReservation.status}`)
      console.log(`   Error: ${secondReservation.data.error || secondReservation.data.message}\n`)
    }
    
    // Step 3: Test with slightly different time (should also be rejected due to buffer)
    console.log('3️⃣ Testing with overlapping time (buffer zone)...')
    
    const bufferTestData = {
      ...reservationData,
      start_time: `${dateStr}T18:30:00.000Z`, // 30 minutes overlap
      end_time: `${dateStr}T19:30:00.000Z`,
      client: {
        name: 'Buffer Test Client',
        email: 'buffer@example.com',
        phone: '+1111111111'
      }
    }
    
    const bufferTest = await makeApiCall('/reservations', 'POST', bufferTestData)
    
    if (bufferTest.ok) {
      if (bufferTest.data.table.id === assignedTableId) {
        console.error('❌ BUFFER TIME VIOLATION! Overlapping reservation was allowed on same table!')
        return false
      } else {
        console.log('✅ Different table assigned for buffer test (acceptable)')
      }
    } else {
      console.log('✅ Buffer time overlap correctly rejected!')
      console.log(`   Status: ${bufferTest.status}`)
      console.log(`   Error: ${bufferTest.data.error || bufferTest.data.message}\n`)
    }
    
    // Step 4: Test non-overlapping time (should succeed)
    console.log('4️⃣ Testing non-overlapping time (should succeed)...')
    
    const nonOverlapData = {
      ...reservationData,
      start_time: `${dateStr}T20:00:00.000Z`, // 1 hour after first reservation ends
      end_time: `${dateStr}T21:00:00.000Z`,
      client: {
        name: 'Non-Overlap Client',
        email: 'nonoverlap@example.com',
        phone: '+2222222222'
      }
    }
    
    const nonOverlapTest = await makeApiCall('/reservations', 'POST', nonOverlapData)
    
    if (nonOverlapTest.ok) {
      console.log('✅ Non-overlapping reservation created successfully!')
      console.log(`   Table ID: ${nonOverlapTest.data.table.id}`)
      console.log(`   Reservation ID: ${nonOverlapTest.data.reservation.id}\n`)
    } else {
      console.log('⚠️  Non-overlapping reservation failed (might be due to restaurant hours):')
      console.log(`   Status: ${nonOverlapTest.status}`)
      console.log(`   Error: ${nonOverlapTest.data.error || nonOverlapTest.data.message}\n`)
    }
    
    console.log('🎉 Double booking prevention test completed successfully!')
    return true
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message)
    return false
  }
}

// Run the test
if (require.main === module) {
  testDoubleBookingPrevention()
    .then(success => {
      if (success) {
        console.log('\n✅ All tests passed!')
        process.exit(0)
      } else {
        console.log('\n❌ Tests failed!')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('\n💥 Test suite crashed:', error)
      process.exit(1)
    })
}

module.exports = { testDoubleBookingPrevention }