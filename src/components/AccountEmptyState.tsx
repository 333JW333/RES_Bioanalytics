export default function AccountEmptyState({
  title,
  children,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="card px-6 py-10 text-center">
      <p className="font-semibold text-brand-navy">{title}</p>
      <div className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brand-slate-light">
        {children}
      </div>
      {actions && <div className="mt-6 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  );
}
