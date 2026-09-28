import { redirect } from "next/navigation";

// The businesses list lives at /businesses (alongside /businesses/[id]) so
// the sidebar's "Businesses" link and the login redirect both point at a
// real, bookmarkable route instead of overloading the bare root.
export default function RootPage() {
  redirect("/businesses");
}
