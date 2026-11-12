# EcoPeps backlog

The to-do list for www.ecopeps.com. The daily (9 p.m. MT) and weekly
(Saturday 7 a.m. MT) progress reports emailed to support@ecopeps.com read
this file for their task and decision sections. How the reports are built:
[PROGRESS_REPORTS.md](PROGRESS_REPORTS.md).

How to use it:

- One line per task: `- [ ] What to do. (you|claude, added YYYY-MM-DD)`.
  `you` is the owner of the business; `claude` is work Claude can do alone.
  Put the most important first: the report shows them in this order.
- The date is what lets the report mark a task that has sat for three days
  or more, so keep it when you reword a line.
- When something is done, delete the line (the pull request is the record).
  For work with no pull request, move the line to **Done outside the code**
  with the date it was done, so the next report counts it.
- **Needs a decision** is for anything waiting on the owner.

## Up next

- [ ] Set up two-step sign-in on the support@ecopeps.com staff account. Staff pages show only the setup screen until this is done. (you, added 2026-11-11)
- [ ] Update the "Change email address" template in Supabase to point at `/auth/confirm` with `type=email_change`. Until then, customers can't finish changing their email. (you, added 2026-11-11)
- [ ] Place one real card order end to end on the live site. Stripe shows no live payments yet. (you, added 2026-11-11)

## Needs a decision

- [ ] Delist EP-GLP3-R from the shop (pull request 61, a draft): merge or close? (added 2026-09-28)
- [ ] Crypto and ACH payments are switched off and refused by the server: bring either back, or remove the code? (added 2026-11-11)

## Later

- [ ] Resend: the click-tracking DNS record for `updates.ecopeps.com` failed. Sending works without it. Add the record or turn click tracking off. (you, added 2026-11-11)

## Done outside the code

Things finished that leave no trace in the repo (supplier, payment
processor, legal, DNS). One line each with the date done:
`- 2026-11-12: what was done.` The reports count these as shipped. Lines
older than two weeks can be deleted.

## Notes
