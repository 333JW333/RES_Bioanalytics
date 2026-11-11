alter policy "Customers can request a restock notice for themselves"
  on public.restock_requests
  with check (
    user_id = (select auth.uid())
    and email = ((select auth.jwt()) ->> 'email')
  );

