/** The result of a staff action, shown at the top of the page it returned to. */
export default function AdminNotice({ notice }: { notice: { tone: "good" | "bad"; text: string } | null }) {
  if (!notice) return null;
  return (
    <p
      role="status"
      className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
        notice.tone === "good"
          ? "border-brand-teal/30 bg-brand-teal/10 text-brand-teal-dark"
          : "border-red-200 bg-red-50 text-red-700"
      }`}
    >
      {notice.text}
    </p>
  );
}
