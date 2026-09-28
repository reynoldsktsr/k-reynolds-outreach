"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const PAGE_TITLES: { match: (path: string) => boolean; title: string }[] = [
  { match: (p) => p === "/businesses", title: "Businesses" },
  { match: (p) => p.startsWith("/businesses/"), title: "Business detail" },
  { match: (p) => p.startsWith("/queue"), title: "Review queue" },
  { match: (p) => p.startsWith("/settings"), title: "Settings" },
];

function titleForPath(pathname: string): string {
  return PAGE_TITLES.find((p) => p.match(pathname))?.title ?? "Outreach";
}

export function AppShell({ userEmail, children }: { userEmail: string | null; children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const title = titleForPath(pathname);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 lg:block">
        <Sidebar userEmail={userEmail} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-neutral-900/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <Sidebar userEmail={userEmail} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <Topbar title={title} onMenuClick={() => setDrawerOpen(true)} />
        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
