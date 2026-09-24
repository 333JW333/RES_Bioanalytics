import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { products } from "./products";
import { vialCodes } from "./vial-codes";

/**
 * Run by next.config.ts on `next build`. Fails the build rather than let a
 * vial's QR code open another batch's COA.
 */
export function checkVialCodes() {
  const problems: string[] = [];
  const codeFor = new Map<string, string>();
  const coaOwner = new Map<string, string>();

  for (const [code, { batch, coa, sha256 }] of Object.entries(vialCodes)) {
    if (!/^[0-9A-Z]{1,3}$/.test(code)) {
      problems.push(
        `${code}: use 1-3 capital letters or digits so the QR fits a 3 mL vial.`
      );
    }
    for (const name of [code, batch]) {
      const other = codeFor.get(name.toLowerCase());
      if (other) {
        problems.push(`${code}: "${name}" is already used by ${other}. Each batch needs its own code.`);
      }
      codeFor.set(name.toLowerCase(), code);
    }
    const other = coaOwner.get(coa);
    if (other) {
      problems.push(`${code}: ${coa} already belongs to ${other}. Put each batch's COA in its own folder.`);
    }
    coaOwner.set(coa, code);

    const file = path.join(process.cwd(), "public", coa);
    if (!existsSync(file)) {
      problems.push(`${code}: ${coa} is missing, and vials of batch ${batch} open it.`);
      continue;
    }
    const actual = createHash("sha256").update(readFileSync(file)).digest("hex");
    if (!sha256) {
      problems.push(`${code}: set sha256 to "${actual}".`);
    } else if (actual !== sha256) {
      problems.push(
        `${code}: ${coa} has changed since batch ${batch} was labelled, so its vials would open a different COA. ` +
          `Restore the original file, and give a new batch its own folder and code.`
      );
    }
  }

  for (const product of products) {
    for (const { batchCode, reportUrl } of product.batches ?? []) {
      if (!batchCode) continue;
      const entry = Object.entries(vialCodes).find(([, v]) => v.batch === batchCode);
      if (!entry) {
        problems.push(`${product.name} batch ${batchCode} has no vial code.`);
      } else if (entry[1].coa !== reportUrl) {
        problems.push(
          `${product.name} batch ${batchCode}: reportUrl ${reportUrl} is not the COA its vials open (${entry[0]}: ${entry[1].coa}).`
        );
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(`Vial QR codes (src/data/vial-codes.ts):\n- ${problems.join("\n- ")}`);
  }
}
