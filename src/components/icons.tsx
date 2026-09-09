export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#14B8A6" />
      <path
        d="M14 10v7.2c0 1.1-.4 2.16-1.13 2.96L10 23.6c-1.8 1.98-.4 5.15 2.27 5.15h15.46c2.67 0 4.07-3.17 2.27-5.15l-2.87-3.44A4.5 4.5 0 0126 17.2V10"
        stroke="#04211D"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12.5 10h15" stroke="#04211D" strokeWidth="2" strokeLinecap="round" />
      <path d="M13.5 22.5h13" stroke="#04211D" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="20" cy="26" r="1.4" fill="#04211D" />
      <circle cx="24" cy="25" r="1" fill="#04211D" />
      <circle cx="17" cy="25.5" r="0.8" fill="#04211D" />
    </svg>
  );
}

export function FlaskIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M9 2v6.2a2 2 0 01-.4 1.2L4.5 15.5A3 3 0 007 20.5h10a3 3 0 002.5-5L15.4 9.4A2 2 0 0115 8.2V2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 2h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7 14.5h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function DnaIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M6 3c0 6 12 6 12 9s-12 3-12 9M18 3c0 6-12 6-12 9s12 3 12 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M7.5 7h9M6.5 12h11M7.5 17h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function ShieldCheckIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 3l7 3v5.5c0 4.7-3 8.6-7 9.5-4-.9-7-4.8-7-9.5V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function VialIcon({ className = "h-16 w-16" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden="true">
      <rect x="24" y="6" width="16" height="10" rx="2" fill="#0F2A45" />
      <path
        d="M26 15h12v27a6 6 0 01-6 6v0a6 6 0 01-6-6V15z"
        fill="#F6F9FB"
        stroke="#0F2A45"
        strokeWidth="1.6"
      />
      <path d="M26 34h12v8a6 6 0 01-6 6v0a6 6 0 01-6-6v-8z" fill="#14B8A6" />
      <path d="M26 34h12" stroke="#0F2A45" strokeWidth="1.2" />
    </svg>
  );
}

export function CartIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M3 4h2l2.4 12.2a2 2 0 002 1.8h7.6a2 2 0 002-1.6L20 8H6.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="21" r="1.4" fill="currentColor" />
      <circle cx="17" cy="21" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function CoinIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v10M9.5 9.3c0-1.1 1.1-2 2.5-2s2.5.7 2.5 1.7-1 1.5-2.5 1.9-2.5 1-2.5 2 1.1 1.9 2.5 1.9 2.5-.8 2.5-1.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function BankIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 3l9 5H3l9-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CardIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect x="3" y="5.5" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 9.5h18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 14.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
