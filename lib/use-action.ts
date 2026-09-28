"use client";

import { useTransition } from "react";
import { useToast } from "@/components/toast";

/**
 * Shared client-side wrapper for invoking a server action directly (not via
 * <form action>): tracks pending state and turns a thrown error into a toast
 * instead of an unhandled rejection / Next.js error boundary.
 */
export function useServerAction() {
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function run<T>(
    fn: () => Promise<T>,
    opts?: { successMessage?: string | ((result: T) => string); errorPrefix?: string },
  ) {
    startTransition(async () => {
      try {
        const result = await fn();
        if (opts?.successMessage) {
          const message = typeof opts.successMessage === "function" ? opts.successMessage(result) : opts.successMessage;
          showToast(message, "success");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong.";
        showToast(opts?.errorPrefix ? `${opts.errorPrefix}: ${message}` : message, "error");
      }
    });
  }

  return { isPending, run };
}
