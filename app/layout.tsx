import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { signOut } from "@/lib/auth-actions";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Outreach",
  description: "Local business outreach tracker",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4 text-sm">
            <span className="font-semibold">Outreach</span>
            <Link href="/" className="text-neutral-600 hover:text-neutral-900">
              Businesses
            </Link>
            <Link href="/queue" className="text-neutral-600 hover:text-neutral-900">
              Review queue
            </Link>
            <Link href="/settings" className="text-neutral-600 hover:text-neutral-900">
              Settings
            </Link>
            <span className="ml-auto text-neutral-400">
              Demo sites:{" "}
              <a
                href="https://k-reynolds-demo-coffee.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neutral-700"
              >
                coffee
              </a>{" "}
              ·{" "}
              <a
                href="https://k-reynolds-demo-restaurant.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neutral-700"
              >
                restaurant
              </a>{" "}
              ·{" "}
              <a
                href="https://k-reynolds-demo-booking.netlify.app"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neutral-700"
              >
                booking
              </a>
            </span>
            <form action={signOut}>
              <button className="text-neutral-400 hover:text-neutral-700">Sign out</button>
            </form>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
