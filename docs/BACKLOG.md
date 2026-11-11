# EcoPeps backlog

The to-do list for www.ecopeps.com. The daily (9 p.m. MT) and weekly
(Saturday 7 a.m. MT) progress reports emailed to support@ecopeps.com read
this file for their "Tomorrow" and "Next week" sections, and read the day's
merged pull requests for what shipped.

How to use it:

- Add a line under the right heading. Put the most important items first.
- When something is done, delete the line (the pull request is the record).
  For work with no pull request, move the line to **Done outside the code**
  with the date so the next report picks it up.
- **Needs a decision** is for anything waiting on the owner.

## Up next

- [ ] Confirm two-step sign-in is set up on the support@ecopeps.com staff account (from pull request 81).
- [ ] Point Supabase's "Change email address" template at `/auth/confirm` with `type=email_change`, so customers can change their email (from pull request 81).
- [ ] Confirm the account-details migration from pull request 81 is applied to production.
- [ ] Place one real card order end to end on the live site: Stripe shows no live payments yet.
- [ ] Finish setting up the daily and weekly progress reports (format agreed, test email sent, schedules on).

## Needs a decision

- [ ] Pull request 61 (delist EP-GLP3-R from the shop) has been open as a draft since September 28: merge it or close it?
- [ ] Crypto and ACH are hidden at checkout and refused by the server. Bring either back, or remove the code?

## Later

- [ ] Resend: the click-tracking DNS record for `updates.ecopeps.com` failed. Sending works without it. Add the record or turn click tracking off.

## Done outside the code

Things finished that leave no trace in the repo (supplier, payment
processor, legal, DNS). Add the date; the weekly report clears this list.

## Notes
