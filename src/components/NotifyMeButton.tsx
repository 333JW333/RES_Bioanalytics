"use client";

import { useActionState } from "react";
import { requestRestockNotice, type RestockState } from "@/lib/restock";

const initialState: RestockState = { status: "idle" };

export default function NotifyMeButton({ slug, name }: { slug: string; name: string }) {
  const [state, formAction, pending] = useActionState(requestRestockNotice, initialState);

  if (state.status === "subscribed") {
    return (
      <div className="rounded-xl border border-brand-teal/30 bg-brand-teal/5 p-4 text-sm leading-relaxed text-brand-slate">
        <p className="font-semibold text-brand-teal-dark">You&apos;re on the list.</p>
        <p className="mt-1">
          We&apos;ll email <strong className="text-brand-navy">{state.email}</strong> as
          soon as {name} passes its COA testing and is ready to ship.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="slug" value={slug} />
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Saving…" : "Notify Me When Available"}
      </button>
      {state.status === "error" && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {state.message}
        </p>
      )}
    </form>
  );
}
