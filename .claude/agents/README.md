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

Each agent's project-specific section (brand colors, voice guidelines, site structure, etc.) has already been filled in for EcoPeps — update it if the brand, design system, or product catalog changes materially, so the agents stay accurate.

**One shared constraint across every content/copy agent**: EcoPeps sells research-use-only (RUO) peptides. No agent should produce copy implying human/animal use, dosing, or therapeutic claims, or referencing approved-drug brand names (e.g. Ozempic, Mounjaro) as stand-ins for the research compounds sold here. This is called out explicitly in each relevant agent's instructions, but keep it in mind if you extend or rewrite one.

## legal-researcher

`legal-researcher` is **read-only** (`Read, Grep, Glob, WebSearch, WebFetch`). It pulls current statute and CFR text from primary government sources, checks FDA/FTC enforcement, and returns a cited research memo, and it never edits files or gives legal advice. Its output is a starting point for counsel, not a substitute.

- **Network:** it needs to reach `ecfr.gov`, `govinfo.gov`, `federalregister.gov`, `uscode.house.gov`, `law.cornell.edu`, `fda.gov`, `api.fda.gov`, `ftc.gov`, and `regulations.gov`. On Claude Code on the web, add these to the environment's allowed domains; otherwise the agent falls back to search snippets and marks its citations unverified.
- **Research connectors:** if you connect Paxton or CoCounsel/Westlaw (paid), or CourtListener (free), add their tool names to the agent's `tools:` line so it can use them for case law and citators.

