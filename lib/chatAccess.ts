/**
 * Pure mirror of the conversations/messages RLS policies (spec §16/§25:
 * "A passenger must never be able to... access another conversation").
 */
export function isConversationParticipant(
  conversation: { driver_id: string; passenger_id: string },
  userId: string
): boolean {
  return conversation.driver_id === userId || conversation.passenger_id === userId
}
