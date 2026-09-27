import Link from "next/link";
import { signOut } from "@/lib/auth-actions";

const NAV = [
  { href: "/", label: "Businesses" },
  { href: "/queue", label: "Review queue" },
  { href: "/settings", label: "Settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <span className="font-semibold tracking-tight text-neutral-900">Outreach</span>
            <nav className="flex gap-6 text-sm font-medium">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="text-neutral-600 hover:text-neutral-900">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <form action={signOut}>
            <button className="text-sm text-neutral-500 hover:text-neutral-800">Sign out</button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
