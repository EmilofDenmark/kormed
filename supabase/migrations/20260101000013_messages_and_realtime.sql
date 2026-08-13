-- Lets a participant mark the other person's messages as read (spec §16
-- "read state"). Missing from the initial RLS pass — messages only had
-- SELECT/INSERT policies.
create policy messages_update_participant on public.messages
  for update using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.driver_id = auth.uid() or c.passenger_id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.driver_id = auth.uid() or c.passenger_id = auth.uid())
    )
  );

-- Supabase only streams postgres_changes for tables explicitly added to the
-- supabase_realtime publication. Chat (spec §16) and the notification badge
-- (spec §27) both rely on this.
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
