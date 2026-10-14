-- Skjulte bedømmelseskommentarer (moderation) må ikke kunne læses direkte.
--
-- Før: ratings_select_all (using true) lod enhver, også uden login, læse ALLE
-- rækker i ratings direkte via API'et, inkl. kommentarer, en administrator
-- havde skjult. Visningen public_ratings skjulte dem kun, hvis man brugte den.
-- Nu kan andre end deltagerne og admin kun se rækker, hvor kommentaren ikke er
-- skjult. Offentlige sider læser via public_ratings (viser stjerner, men
-- kommentaren som tom, når den er skjult), så de påvirkes ikke.

drop policy if exists ratings_select_all on public.ratings;
drop policy if exists ratings_select_visible on public.ratings;

create policy ratings_select_visible on public.ratings
  for select using (
    not comment_hidden
    or rater_id = auth.uid()
    or ratee_id = auth.uid()
    or public.is_admin()
  );
