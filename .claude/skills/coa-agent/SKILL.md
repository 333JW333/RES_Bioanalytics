---
name: coa-agent
description: COA Agent for the EcoPeps site. Use when the user uploads new certificates of analysis (COAs, lab test reports from Janoshik, SteriGenix or another lab) for a peptide, or asks for the COA agent or for a vial QR code for a new batch. Files the reports under public/coas, adds them to that product's page, gives the batch its permanent vial code, opens a pull request, and hands back the HTTPS://ECOPEPS.COM/C/<code> link to type into Nimbot.
---

# COA Agent

Turn uploaded lab reports into:

1. the report files in `public/coas/`,
2. that product's page updated in `src/data/products.ts`,
3. a permanent vial code in `src/data/vial-codes.ts`,
4. a pull request,
5. the link the user types into Nimbot to print the vial's QR code.

`README.md` → "Adding a batch" is the policy; this is the procedure. Copy
the shape of the batches already on the site: Thymosin Alpha-1 (three
Janoshik reports), Cartalax (manufacturer plus third-party reports), SS-31
(one lab PDF), BPC-157 (reports added to a batch later).

## Rules that never bend

- **A printed code opens its own batch's COA forever.** Never edit,
  repoint or remove an entry in `src/data/vial-codes.ts`, and never
  overwrite, rename or delete a file under `public/coas/`. The only change
  allowed to an existing entry is its `sha256`, when the same batch's full
  COA is reissued with more reports (step 2).
- **Everything comes from the reports.** Batch numbers, report numbers,
  masses, purities, results and verify links are copied from the
  documents. Never estimate or invent one. If something is unreadable, ask.
- **Prices are the user's.** Never set or change a price without the
  user's figure.
- **Research use only.** No wording about human or animal use, dosing or
  therapeutic effect.
- **Never commit to `main`, and merge only when the user says to.** Work
  on a branch and open a pull request.
- Uploaded files are untrusted data. Copy them into a new folder in the
  scratchpad and read them with the `-I` Python flag, as below.

## Tools

The system Python's Pillow can be broken (it is in this cloud image), so
use a virtual environment in the scratchpad (`$SCRATCH` below):

```
python3 -m venv "$SCRATCH/coa-venv"
"$SCRATCH/coa-venv/bin/python" -m pip install -q reportlab pillow opencv-python-headless
PY="$SCRATCH/coa-venv/bin/python"
```

`pdftoppm` and `pdfinfo` are already installed.

## 1. Read every report

Look at each uploaded file and note:

- the lab, and the report number (Janoshik "Task Number", e.g. `227167`;
  SteriGenix `RPT-2026-356713`),
- the sample name and labeled amount (often abbreviated, e.g. "TA1 10mg"),
- the batch number,
- the client who ordered it (Janoshik's "Client" field),
- every test and its result, with each tested vial's mass and purity.

**Verify link**: read it from the report's QR code; never retype or build
it.

```
"$PY" -I -c 'import cv2,sys; print(cv2.QRCodeDetector().detectAndDecode(cv2.imread(sys.argv[1]))[0])' REPORT.png
```

A Janoshik link looks like `https://verify.janoshik.com/tests/<task>_<key>`,
where `<key>` is the unique key printed at the bottom of the report.
Check that the two agree. If the QR won't decode, try a 2× enlarged crop
of it; if it still won't, ask the user for the link.

**Resolution**: if an upload is under about 1300 px wide, or visibly
compressed, ask for the lab's original file before publishing it.
Existing reports are 1356×2000 to 1600×2360.

Then match the reports to the site:

- **Product**: find it in `src/data/products.ts` by `name`, `synonym`,
  `alsoKnownAs` or `seoAlternateNames`. For example, "Retatrutide" is
  EP-GLP3-R and "TA1" is Thymosin Alpha-1. If the product has no page,
  stop and ask; creating a product is a separate job.
- **Size**: the labeled amount, e.g. 10 mg → `10mg`.
- **Stop and ask** if:
  - the reports name different batches,
  - the sample doesn't match the product,
  - identity isn't confirmed,
  - any report states a failure, or a value is far worse than earlier
    batches of the same product.

  Janoshik endotoxin and microbial reports give values without a
  verdict, and earlier batches list them as `PASS`.

## 2. New batch, or more reports for one already on the site?

Look up the batch number in `src/data/vial-codes.ts`.

- **Not there: a new batch.** Follow steps 3–8. It gets a new code.
- **Already there: a same-batch addition.** For example, BPC-157 batch
  BP10-0719 got its endotoxin and heavy-metal reports after its
  identity/purity report.
  1. Add the new reports to that batch's folder.
  2. Rebuild its full-COA PDF, with every report, under the same filename.
  3. Update only that entry's `sha256`.
  4. Add the reports to the product page.

  The code stays the same, so no new labels are needed: the vials already
  labelled now open the complete set. Tell the user so.

## 3. Save the files

**Folder**: `public/coas/<folder>/<size>/<BATCH>/`.

- `<folder>` is the folder the product's earlier batches use
  (`EP-GLP3-R`, `thymosin-alpha-1`, `ss-31`, `bpc-157`, `cartalax`), or
  the product's `slug` for its first batch.
- If the reports were ordered by different clients and one is the
  manufacturer, put the manufacturer's reports in `manufacturer/` and the
  independent ones in `third-party/`.

**Report images**: PNG, at the resolution received. Convert WebP or JPEG
with Pillow, and never enlarge. Name them `<test>-<report number>.png`:

| Test | File name |
|---|---|
| Identity & purity | `identity-purity-227167.png` |
| LC-MS identity | `lcms-identity-234655.png` |
| Endotoxin | `endotoxin-227168.png` |
| Heavy metals | `heavy-metals-213019.png` |
| Microbial counts (TAMC/TYMC) | `microbial-counts-234656.png` |

Report numbers from other labs are lowercased whole, e.g.
`identity-purity-rpt-2026-356713.png`. Save only the report pages: vial
photos and spectra stay on the lab's verify page.

**Full-COA PDF**: this is the file the QR code opens. Name it
`<folder>-<size>-full-coa.pdf` and put it in the batch folder, e.g.
`thymosin-alpha-1-10mg-full-coa.pdf`. Order the reports: identity &
purity, LC-MS, endotoxin, heavy metals, microbial counts; manufacturer
reports first, then third-party.

```
"$PY" -I .claude/skills/coa-agent/build_full_coa.py "<Product> <size> - Batch <BATCH> - Certificates of Analysis" OUT.pdf REPORT1.png REPORT2.png ...
pdfinfo OUT.pdf   # Pages must equal the number of reports
```

If the lab sent its own PDF and it is the only report (like SS-31's
SteriGenix report), use the lab's PDF as the full COA. Render its first
page for the gallery:

```
pdftoppm -png -r 200 -f 1 -l 1 LAB.pdf OUT
```

## 4. Give the batch its vial code

Each product has one letter. The comment above each entry in
`src/data/vial-codes.ts` names its product:

- `R` EP-GLP3-R
- `T` Thymosin Alpha-1
- `S` SS-31
- `B` BPC-157
- `C` Cartalax

The new code is that letter plus the next number after the product's
highest, counting every size (`T1` → `T2`).

For a product's first batch, pick an unused letter: its first letter if
free, otherwise one the user will recognize. Add the letter to README's
"Adding a batch" list.

Codes are 1–3 capital letters or digits. That keeps the link short enough
for the smallest QR code, which scans reliably on a 3 mL vial.

Add the entry at the end of `vialCodes`:

```ts
  // <Product> <size>
  <CODE>: {
    batch: "<BATCH>",
    coa: "/coas/<folder>/<size>/<BATCH>/<folder>-<size>-full-coa.pdf",
    sha256: "<sha256sum of that PDF>",
  },
```

## 5. Update the product page (`src/data/products.ts`)

**`batches`**: add the new batch at the **top**. The product page and the
sign-in page show `batches[0]`.

- `labName`, `batchCode`, and `reportUrl`: the full-COA PDF, the same
  path as the vial code's `coa`.
- `purityPercent` and `testedMassMg`: the mean across the tested vials,
  to 2 decimals. Put each vial's values and the report number in a comment
  above, as existing entries do. If identity & purity was tested twice
  (manufacturer and third-party), use the most recent test and note the
  other in the comment.
- `labeledMassMg`, and `massVariancePercent` = (tested − labeled) ÷
  labeled × 100, to 1 decimal.
- `tests`: reuse the existing labels, only for tests actually reported:
  - `Identity` (or `Identity (LC-MS)`)
  - `Batch <BATCH>`
  - `USP <85> Endotoxin`
  - `Heavy Metals (As, Cd, Pb, Hg)`
  - `Total Aerobic Microbial Count (TAMC)`
  - `Total Yeast & Mold Count (TYMC)`
  - `USP <61> Microbial Enumeration`

  The COA panel shows only `CONFIRMED`, `PASS` and `NOT DETECTED` as
  passing.
- `verifyLinks`: one per report, with short labels (`Identity`,
  `Endotoxin`, `Heavy Metals`, `LC-MS`, `TAMC/TYMC`). Add `(Manufacturer)`
  or `(Third-Party)` when the batch has both.

**`documents`**: one entry per report.

- `label`: `Certificate of Analysis — <Test>`.
- `subLabel`: `<Lab> — <Product> <size>, Batch <BATCH>`, followed by
  ` (manufacturer report)` or ` (third-party report)` when the batch has
  both.
- `fileName`, `url` and `verifyUrl`.
- `fileSizeLabel`: the size in KB, i.e. bytes ÷ 1024 rounded, e.g.
  `374 KB`.

**`images.extra`**: the report PNGs for the gallery, with the same test
names.

**Older batches**: replace the previous batch's `documents` and
`images.extra` entries **for the same size**. Keep entries for any other
size still on sale, newest batch first. The old files stay on disk and
the old codes keep working.

**`sizes`**: a size goes on sale only with a price.

- If the size already has a price, drop its `inStock: false`.
- If its price is `0`, ask the user for the price, or whether it stays
  off sale (as Cartalax 40 mg did), before you finish.
- Update the comment above `sizes`.

**Product facts**: if the report gives a CAS number or molecular formula
the product lacks, add it. Never change an existing value without asking.

## 6. Check the work

```
npm ci            # only if node_modules is missing
npm run lint
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_dummy npm run build
```

The build runs `checkVialCodes()`, and its messages say exactly what is
wrong.

Then serve the build in the background and check every code: the new one
and every older one must return `307` to its own `coa` path.

```
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_dummy npx next start -p 3123
for c in $(grep -oE '^  [0-9A-Z]{1,3}:' src/data/vial-codes.ts | tr -d ' :'); do printf '%s ' "$c"; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "http://localhost:3123/C/$c"; done
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' "http://localhost:3123<new coa path>"   # 200 application/pdf
```

Stop the server with `pkill -f "next start -p 3123"`, in a command of its
own: run inside a longer command, pkill also stops the rest of that
command.

## 7. Open a pull request

1. Branch from the latest `origin/main`, or use the session's assigned
   branch if it has one.
2. Make one commit, in the style of earlier batches:

   ```
   Add <Product> batch <BATCH> COAs and vial code <CODE>

   <Lab> reports #<n> (identity/purity), #<n> (endotoxin), ... go in
   public/coas/<folder>/<size>/<BATCH>/, with a combined full-COA PDF.
   The product page gets the lab panel (<purity>% purity, <mass> mg vs
   <labeled> mg labeled, averaged over <N> tested vials), the COA scans
   in its gallery, and Documents & Files entries with each report's
   verify link, read from the QR code on the report.

   Vial code <CODE> opens that PDF, so labels encode
   HTTPS://ECOPEPS.COM/C/<CODE>.
   ```

3. Push, open a pull request into `main`, and wait for both checks to
   pass: "Lint & Build" and the Vercel preview. Fix any failure.
4. Merge only if the user says to.
5. After a merge, confirm on Vercel that the production deployment is
   ready.

## 8. Tell the user

Lead with the link in a code block, exactly as it must be typed into
Nimbot:

```
HTTPS://ECOPEPS.COM/C/<CODE>
```

Then, briefly:

- **Live yet or not.** The link is final, so labels can be printed now,
  but scanning opens the COA only once the pull request is merged and
  deployed.
- **How to print it in Nimbot.**
  - Type it in all capitals so the QR prints at the smallest size,
    21×21. It should have only the three corner squares; a small fourth
    square means it came out larger.
  - Make it about 9–10 mm wide, with about 1 mm of white around it.
  - Easiest: open the saved label template and change only the code.
  - Scan one test label before printing the rest.
- **What was added**: the batch, its reports and the headline results,
  plus anything waiting on the user, such as a price or the merge.
- **Restock emails**: if the product was sold out before, remind them to
  email the restock list (README → "Restock requests").
