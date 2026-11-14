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

- [ ] Update the "Change email address" template in Supabase to point at `/auth/confirm` with `type=email_change`. Until then, customers can't finish changing their email. (you, added 2026-11-11)
- [ ] Place one real card order end to end on the live site. Stripe shows no live payments yet. (you, added 2026-11-11)
- [ ] Once the security fixes are live, apply the contact-form database change (`20261112200000_inquiries_server_only`), which stops anyone writing inquiries without passing the security check. Needs your OK. (claude, added 2026-11-12)
- [ ] Supabase sign-in settings: turn on leaked-password protection and set the minimum password length to 10 (Authentication, Attack Protection). While there, confirm the captcha, "Secure email change" and "Require recent login to change password" are on and anonymous sign-ins are off. (you, added 2026-11-12)
- [ ] Add request limits in Vercel's firewall so no one address can flood the site: page-view tracking 120 a minute, checkout 20 a minute, and the contact, account and sign-in forms 20 a minute. Needs your OK. (claude, added 2026-11-12)
- [ ] Make the staff list (`STAFF_EMAILS` in Vercel) apply to the live site only, not previews. (you, added 2026-11-12)
- [ ] Delete the two test sign-ins made on the live site for QA, or leave them as ordinary customer accounts. QA no longer needs them. Don't add either to the staff list. (you, added 2026-11-12)
- [ ] Confirm the live Stripe key is a restricted key (starts `rk_live_`) with only the access listed in `src/lib/payments/stripe.ts`. (you, added 2026-11-12)

## Needs a decision

- [ ] Delist EP-GLP3-R from the shop (pull request 61, a draft): merge or close? (added 2026-09-28)
- [ ] Net 30 invoices: any customer can make themselves eligible by entering a business type and nine digits. Nothing ships unpaid, but each request emails you and creates a Stripe draft. Add a staff "approved for Net 30" step? (added 2026-11-12)
- [ ] Crypto and ACH payments are switched off and refused by the server: bring either back, or remove the code? (added 2026-11-11)

## Later

- [ ] Add a Content-Security-Policy header (a browser-enforced list of what the pages may load), in report-only mode first. (claude, added 2026-11-12)
- [ ] Inquiries, restock requests and the account change log are kept forever, and the Privacy Policy doesn't list the EIN or say how long these are kept. Decide retention periods and have the policy wording reviewed. (you, added 2026-11-12)
- [ ] Resend: the click-tracking DNS record for `updates.ecopeps.com` failed. Sending works without it. Add the record or turn click tracking off. (you, added 2026-11-11)

## Done outside the code

Things finished that leave no trace in the repo (supplier, payment
processor, legal, DNS). One line each with the date done:
`- 2026-11-12: what was done.` The reports count these as shipped. Lines
older than two weeks can be deleted.

- 2026-11-12: Created the QA tester's customer and staff test sign-ins.
- 2026-11-12: Changed the passwords on both QA test sign-ins.
- 2026-11-12: Confirmed the account-details database change from pull request 81 is live.
- 2026-11-12: Checked where preview deployments point: the live database. QA now tests on a throwaway local copy.
- 2026-11-12: Set up two-step sign-in on the support@ecopeps.com staff account.
- 2026-11-12: First full security audit.
- 2026-11-13: Decided to keep `.claude/settings.json` as it is, so the progress reports send and save without a permission prompt.

## Notes
