/**
 * Every code printed on a vial QR label (HTTPS://ECOPEPS.COM/C/<code>)
 * and the exact COA file it opens.
 *
 * ADD ONLY. Once a code is on shipped vials it must keep opening that same
 * batch's COA, so give each new batch a new entry and never edit or remove
 * an existing one, not even to "update" a COA to a newer batch. `next build`
 * fails if a code or batch repeats, a file is missing, or a file's contents
 * no longer match its sha256 (see check-vial-codes.ts). The only reason to
 * change a sha256 is the lab reissuing that same batch's COA.
 */
export interface VialCode {
  /** Lab batch number. Also opens this COA, for labels printed with it. */
  batch: string;
  /** COA file under public/, served to anyone scanning the code. */
  coa: string;
  /** sha256 of the COA file, so it can't be silently replaced. */
  sha256: string;
}

export const vialCodes: Record<string, VialCode> = {
  // EP-GLP3-R 15 mg
  R1: {
    batch: "PSRETA15-1",
    coa: "/coas/retatrutide/15mg/retatrutide-15mg-full-coa.pdf",
    sha256: "7bf01a6fda428ede161900d68c9014e51fe742999ef83c64fcd83e9215561227",
  },
};

/** The COA a vial QR code (or printed batch number) opens, any case. */
export function getVialCoa(code: string): string | undefined {
  const wanted = code.toLowerCase();
  const entry = Object.entries(vialCodes).find(
    ([qr, { batch }]) =>
      qr.toLowerCase() === wanted || batch.toLowerCase() === wanted
  );
  return entry?.[1].coa;
}
