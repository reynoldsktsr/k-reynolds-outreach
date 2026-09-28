"use client";

import { useRouter } from "next/navigation";
import { useServerAction } from "@/lib/use-action";

export function AiActionButton({
  businessId,
  action,
  idleLabel,
  pendingLabel,
  successMessage,
  variant = "primary",
}: {
  businessId: string;
  action: (businessId: string) => Promise<void>;
  idleLabel: string;
  pendingLabel: string;
  successMessage: string;
  variant?: "primary" | "secondary";
}) {
  const { isPending, run } = useServerAction();
  const router = useRouter();

  function handleClick() {
    run(
      async () => {
        await action(businessId);
        router.refresh();
      },
      { successMessage, errorPrefix: "Couldn't finish" },
    );
  }

  return (
    <button type="button" onClick={handleClick} disabled={isPending} className={variant === "primary" ? "btn-primary" : "btn-secondary"}>
      {isPending ? pendingLabel : idleLabel}
    </button>
  );
}
