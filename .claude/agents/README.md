# EcoPeps Claude Code Subagents

Specialized Claude Code subagents for working on this site, each scoped to one domain so context stays focused and output stays useful. Claude Code detects and can invoke these automatically when a task matches an agent's description, or you can call one by name.

| Agent | When to use | Model |
|---|---|---|
| **creative-director** | Visual aesthetics, design coherence, brand alignment review | opus |
| **website-copywriter** | Landing pages, CTAs, product descriptions | sonnet |
| **brand-editor** | Voice consistency, style alignment, light edits | sonnet |
| **ui-designer** | Component styling, Tailwind implementation, visual consistency | sonnet |
| **seo-expert** | Metadata, headings, schema markup, search/GEO optimization | sonnet |
| **accessibility-consultant** | WCAG compliance, keyboard nav, screen readers | sonnet |
| **thought-leadership-copywriter** | Long-form articles, research, outlines | opus |
| **legal-researcher** | Research-only U.S. federal law / CFR questions (FDA, FTC, DEA), RUO enforcement tracking, intended-use audits of site copy | opus |
| **security-engineer** | Security audits, attack-testing in local and preview environments, fixing vulnerabilities, data-protection review | opus |
| **payments-engineer** | Checkout, Stripe, invoices, payment webhooks, order status, refunds and disputes, adding a processor | opus |
| **database-engineer** | Tables, migrations, row-level security policies and grants, indexes, slow queries | opus |
| **qa-tester** | Browser click-throughs of the real site before a release, bug reports, new automated tests | sonnet |

Each agent's project-specific section (brand colors, voice guidelines, site structure, etc.) has already been filled in for EcoPeps — update it if the brand, design system, or product catalog changes materially, so the agents stay accurate.

**One shared constraint across every content/copy agent**: EcoPeps sells research-use-only (RUO) peptides. No agent should produce copy implying human/animal use, dosing, or therapeutic claims, or referencing approved-drug brand names (e.g. Ozempic, Mounjaro) as stand-ins for the research compounds sold here. This is called out explicitly in each relevant agent's instructions, but keep it in mind if you extend or rewrite one.

## legal-researcher

`legal-researcher` is **read-only** (`Read, Grep, Glob, WebSearch, WebFetch`, plus the CourtListener connector's read tools; its alert, docket-subscription, and pray-for-document tools are disallowed). It pulls current statute and CFR text from primary government sources, checks FDA/FTC enforcement, and returns a cited research memo, and it never edits files or gives legal advice. Its output is a starting point for counsel, not a substitute.

- **Network:** it needs to reach `ecfr.gov`, `govinfo.gov`, `federalregister.gov`, `uscode.house.gov`, `law.cornell.edu`, `fda.gov`, `api.fda.gov`, `ftc.gov`, and `regulations.gov`. On Claude Code on the web, either set the environment's Network access to **Full** or choose **Custom** and add these domains (with `*.` wildcards); otherwise the agent falls back to search snippets and marks its citations unverified.
- **Research connectors:** CourtListener (free case law and citation verification) is already wired in. It is listed as `mcp__CourtListener` for cloud sessions and as `mcp__claude_ai_CourtListener` for claude.ai connectors in the local CLI. If you connect Paxton or CoCounsel/Westlaw (paid), add the server name to the agent's `tools:` line the same way, and add any tools that write to the account to `disallowedTools:`.

## Technology department

The technology agents are the ones that read or change how the site works: **security-engineer**, **payments-engineer**, **database-engineer**, **qa-tester**, **ui-designer**, **accessibility-consultant**, and **seo-expert**. The main Claude Code session acts as tech lead: it does general engineering itself, calls a specialist when a task needs one, and is the only one that ships. Agents don't talk to each other; each does one job and reports back to the main session.

Add a new specialist only when it would carry knowledge the main session has to rediscover every time, or when it needs different permissions from everyone else.

### How a typical change flows

1. The main session plans the change and writes the general code itself.
2. It calls **database-engineer** for any new table, column, or policy, and **payments-engineer** for anything that touches checkout, orders, or money.
3. **security-engineer** reviews the result when it touches sign-in, access, customer data, or payments.
4. **qa-tester** walks the affected flows on the local server or the preview deployment.
5. The main session opens the pull request. The owner approves the merge and any change to a live setting.

Small changes skip the steps they don't need. A copy edit needs none of them.

### Shared rules

Every technology agent follows these.

**Environments**

| Environment | What it is | Agents may |
|---|---|---|
| Local | `npm run dev` with `.env.local`, sandbox or demo payments | Read, edit, run, and test freely |
| Preview | Vercel preview deployments, with a Supabase branch or local stack | Read and test |
| Production | `ecopeps.com`, the live Supabase project, live payment accounts | Read only where the agent's tools allow it. Never test against it and never change it |

**Permissions**

- No agent writes to a production system (Supabase, Vercel, Stripe, Resend, or a payment processor). An agent that wants a live setting changed writes the exact change, the reason, and how to undo it. The owner approves, and the main session applies it.
- Agents never print, log, or commit the value of a secret, and never read or export real customer data.
- Agents may edit files in the working tree but don't commit, push, or open pull requests. The main session does.

**Change process**

- Every change ships through a pull request with CI passing (lint, tests, build).
- Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code (see `AGENTS.md`).
- Database changes are new files in `supabase/migrations/`. Never edit a migration that has already been applied.
- A bug fix comes with a test in `tests/` that fails without it.

**Ownership and handoffs**

| Area | Owner |
|---|---|
| Authentication, authorization, secrets, security headers, data protection; review of every RLS policy and webhook signature check | security-engineer |
| Checkout routes, payment processors, webhook handling, order status and lifecycle, pricing, refunds, disputes, invoices | payments-engineer |
| Schema, migrations, RLS policies and grants, indexes, query performance | database-engineer |
| Release testing, bug reports, the automated tests in `tests/` that cover gaps it finds | qa-tester |
| Component styling and layout | ui-designer |
| WCAG compliance, keyboard and screen-reader behavior | accessibility-consultant |
| Metadata, structured data, sitemap, robots | seo-expert |
| Everything else, and all shipping | main session |

An agent that finds a problem outside its area reports it with the file and line and names the owner. It doesn't fix it itself. One agent edits a given file per task.

**Reporting**

Findings from any technology agent use the same shape: severity (Critical, High, Medium, Low), `file:line`, what goes wrong and for whom, the fix, and whether the finding is **Confirmed** or **Suspected**. Every report says what was not examined.

## security-engineer

`security-engineer` audits, attack-tests, and fixes. It can edit the repo and run commands, and it has **read-only** tools for the live systems: Supabase (tables, migrations, security advisors) and Vercel (project, firewall configuration, deployments, runtime errors). It has no SQL access to the live database and no write tools for Supabase, Vercel, Stripe, or Resend.

- **What the tool list does and doesn't enforce:** the connector limits are enforced by the `tools:` line. The rules against testing production and against changing live systems from the command line are instructions in its prompt, because it needs `Bash` to run the dev server and tests. Keep production credentials out of the environments where it runs.
- **Connectors:** Supabase and Vercel tools are listed as `mcp__Supabase__…` / `mcp__Vercel__…` for cloud sessions and as `mcp__claude_ai_…` for claude.ai connectors in the local CLI. Without the connectors it still audits the repo and says which live settings it couldn't check.
- **Typical requests:** "audit the checkout routes", "check the RLS policies on orders", "try to read another customer's order on the dev server", "review this branch before we merge", "what personal data do we store and is it protected?"
- For a quick review of only the changes on the current branch, the built-in `/security-review` command is faster; use this agent for anything deeper.

## payments-engineer

`payments-engineer` builds and changes the code that handles money. It knows how this store's payments fit together (one `PaymentProcessor` interface, Stripe as the only registered processor, card and Net 30 invoice as the only enabled methods) and works through the failure cases before writing code: duplicate and out-of-order webhooks, abandoned checkouts, partial refunds, disputes.

- **Test mode only.** It has no Stripe tools beyond documentation search and is told never to use a live key. Keep live payment keys out of the environments where it runs.
- **Changes outside the repo** (webhook events, keys, dashboard settings, legal pages that name processors) come back as proposals for you to approve.
- **Typical requests:** "add partial refunds to the staff pages", "why did this order stay pending?", "get the ACH route ready to enable", "add a second processor".

## database-engineer

`database-engineer` designs tables and writes migration files, policies, and grants. It reads the live project's structure and advisors but has **no tool to run SQL or apply a migration**. Migrations are tested on a local stack or a preview branch and applied to the live database by the main session with your approval.

- Anything destructive (dropping a column, changing a type, deleting rows) is flagged for approval with a statement of what would be lost.
- When it needs a fact about live data, it writes a read-only query that returns counts, not rows, for the main session to run.
- **Typical requests:** "add a table for saved addresses", "is this policy right?", "the orders page is slow", "check the schema matches the code".

## qa-tester

`qa-tester` uses the site in a real browser on the local dev server or a preview deployment and reports what it saw, with steps to reproduce and screenshots. It may add tests in `tests/` but does not change application code; each bug is assigned to the agent that owns the area.

- **It needs test accounts.** Registration requires email confirmation and a captcha, so give it a test customer sign-in and, for `/admin`, a test staff sign-in. It never uses a real customer's account.
- **No real payments or emails.** It confirms the environment is in Stripe test or demo mode before checking out, and says so when it can't.
- **Browser:** Claude Code cloud sessions include one. Elsewhere it falls back to requests and the automated tests, and lists what it couldn't check.
- **Typical requests:** "test this branch before we merge", "run the full release check on the preview", "try to break the checkout form on a phone".
