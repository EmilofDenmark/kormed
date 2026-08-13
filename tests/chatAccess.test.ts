import { describe, it, expect } from 'vitest'
import { isConversationParticipant } from '@/lib/chatAccess'

// Spec §36 rule 6: users cannot access unrelated chats.
describe('conversation access', () => {
  const conversation = { driver_id: 'driver-1', passenger_id: 'passenger-1' }

  it('allows the driver and the passenger', () => {
    expect(isConversationParticipant(conversation, 'driver-1')).toBe(true)
    expect(isConversationParticipant(conversation, 'passenger-1')).toBe(true)
  })

  it('denies an unrelated third user', () => {
    expect(isConversationParticipant(conversation, 'someone-else')).toBe(false)
  })
})
