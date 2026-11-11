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

Each agent's project-specific section (brand colors, voice guidelines, site structure, etc.) has already been filled in for EcoPeps — update it if the brand, design system, or product catalog changes materially, so the agents stay accurate.

**One shared constraint across every content/copy agent**: EcoPeps sells research-use-only (RUO) peptides. No agent should produce copy implying human/animal use, dosing, or therapeutic claims, or referencing approved-drug brand names (e.g. Ozempic, Mounjaro) as stand-ins for the research compounds sold here. This is called out explicitly in each relevant agent's instructions, but keep it in mind if you extend or rewrite one.

## legal-researcher

`legal-researcher` is **read-only** (`Read, Grep, Glob, WebSearch, WebFetch`, plus the CourtListener connector's read tools; its alert, docket-subscription, and pray-for-document tools are disallowed). It pulls current statute and CFR text from primary government sources, checks FDA/FTC enforcement, and returns a cited research memo, and it never edits files or gives legal advice. Its output is a starting point for counsel, not a substitute.

- **Network:** it needs to reach `ecfr.gov`, `govinfo.gov`, `federalregister.gov`, `uscode.house.gov`, `law.cornell.edu`, `fda.gov`, `api.fda.gov`, `ftc.gov`, and `regulations.gov`. On Claude Code on the web, either set the environment's Network access to **Full** or choose **Custom** and add these domains (with `*.` wildcards); otherwise the agent falls back to search snippets and marks its citations unverified.
- **Research connectors:** CourtListener (free case law and citation verification) is already wired in. It is listed as `mcp__CourtListener` for cloud sessions and as `mcp__claude_ai_CourtListener` for claude.ai connectors in the local CLI. If you connect Paxton or CoCounsel/Westlaw (paid), add the server name to the agent's `tools:` line the same way, and add any tools that write to the account to `disallowedTools:`.

## Technology department

The technology agents are the ones that read or change how the site works: **security-engineer**, **ui-designer**, **accessibility-consultant**, and **seo-expert**. The main Claude Code session acts as tech lead: it does general engineering itself, calls a specialist when a task needs one, and is the only one that ships. Agents don't talk to each other; each does one job and reports back to the main session.

Add a new specialist only when it would carry knowledge the main session has to rediscover every time, or when it needs different permissions from everyone else. Likely next additions are a payments engineer and a QA tester.

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
| Authentication, authorization, RLS policies, secrets, webhooks, security headers, data protection | security-engineer |
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
