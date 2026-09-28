"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// Vendored build of reynoldsktsr/command-palette (not an npm package - see
// vendor/command-palette). Same pattern the k-reynolds portfolio site uses
// for its own demo widgets.
import { CommandPalette, type Command } from "../vendor/command-palette/command-palette";
import { getBusinessesForPalette } from "@/lib/actions";
import { useTheme } from "@/lib/theme";
import { signOut } from "@/lib/auth-actions";

export function CommandPaletteProvider({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { toggleTheme } = useTheme();
  const [businesses, setBusinesses] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!open || businesses.length > 0) return;
    getBusinessesForPalette()
      .then(setBusinesses)
      .catch(() => {
        // Quick-jump entries just won't show up - navigation commands
        // below still work fine without this.
      });
  }, [open, businesses.length]);

  const navCommands: Command[] = [
    { id: "nav-businesses", label: "Go to Businesses", group: "Navigate", action: () => router.push("/businesses") },
    { id: "nav-queue", label: "Go to Review queue", group: "Navigate", action: () => router.push("/queue") },
    { id: "nav-settings", label: "Go to Settings", group: "Navigate", action: () => router.push("/settings") },
    {
      id: "action-add-business",
      label: "Add a business",
      group: "Actions",
      action: () => router.push("/businesses?add=1"),
    },
    { id: "action-theme", label: "Toggle dark mode", group: "Actions", action: toggleTheme },
    { id: "action-sign-out", label: "Sign out", group: "Actions", action: () => signOut() },
  ];

  const businessCommands: Command[] = businesses.map((b) => ({
    id: `business-${b.id}`,
    label: b.name,
    group: "Businesses",
    action: () => router.push(`/businesses/${b.id}`),
  }));

  return (
    <CommandPalette
      open={open}
      onClose={onClose}
      commands={[...navCommands, ...businessCommands]}
      placeholder="Jump to a page or a business..."
    />
  );
}
