/**
 * Renders a chemical formula like "C62H98N16O22" with proper <sub> digits
 * instead of plain numerals or unicode subscript glyphs (which render
 * inconsistently across fonts).
 */
export default function ChemFormula({ formula }: { formula: string }) {
  const parts = formula.match(/[A-Za-z()+:.\s-]+|\d+/g) ?? [formula];
  return (
    <>
      {parts.map((part, i) =>
        /^\d+$/.test(part) ? <sub key={i}>{part}</sub> : <span key={i}>{part}</span>
      )}
    </>
  );
}
