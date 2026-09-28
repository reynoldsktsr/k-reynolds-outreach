"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  idleLabel,
  pendingLabel,
  variant = "primary",
  disabled = false,
}: {
  idleLabel: string;
  pendingLabel: string;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  const classes =
    variant === "primary"
      ? "rounded-md bg-neutral-900 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
      : "rounded-md border border-neutral-300 px-3.5 py-1.5 text-sm font-medium hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <button disabled={pending || disabled} className={classes}>
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
