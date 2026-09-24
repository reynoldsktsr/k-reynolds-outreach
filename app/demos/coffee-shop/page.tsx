"use client";

import { useMemo, useState } from "react";

const MENU = [
  { id: "drip", name: "Drip coffee", price: 3.25 },
  { id: "latte", name: "Latte", price: 4.75 },
  { id: "cold-brew", name: "Cold brew", price: 4.5 },
  { id: "croissant", name: "Butter croissant", price: 3.95 },
  { id: "breakfast-sandwich", name: "Breakfast sandwich", price: 6.5 },
];

const TAX_RATE = 0.0775;

type CartLine = { id: string; qty: number };

export default function CoffeeShopDemo() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [step, setStep] = useState<"menu" | "checkout" | "confirmed">("menu");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const lines = cart
    .map((line) => ({ ...MENU.find((m) => m.id === line.id)!, qty: line.qty }))
    .filter(Boolean);

  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + l.price * l.qty, 0), [lines]);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  function addItem(id: string) {
    setCart((prev) => {
      const existing = prev.find((l) => l.id === id);
      if (existing) return prev.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { id, qty: 1 }];
    });
  }

  function setQty(id: string, qty: number) {
    setCart((prev) =>
      qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, qty } : l)),
    );
  }

  function placeOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOrderNumber(`#${Math.floor(1000 + Math.random() * 9000)}`);
    setStep("confirmed");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <DemoNote>
        Working online ordering example: real cart math (subtotal, tax, total), quantity
        controls, and a checkout flow. Menu and pricing are illustrative.
      </DemoNote>
      <h1 className="text-2xl font-semibold">Corner Coffee — Order online</h1>

      {step === "menu" && (
        <div className="grid gap-6 sm:grid-cols-[1fr_260px]">
          <ul className="flex flex-col divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {MENU.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-neutral-500">${item.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => addItem(item.id)}
                  className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white hover:bg-neutral-700"
                >
                  Add
                </button>
              </li>
            ))}
          </ul>

          <div className="h-fit rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="font-medium">Your order</h2>
            {lines.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500">Cart is empty.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2 text-sm">
                {lines.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2">
                    <span className="flex-1">{l.name}</span>
                    <input
                      type="number"
                      min={0}
                      value={l.qty}
                      onChange={(e) => setQty(l.id, Number(e.target.value))}
                      className="w-14 rounded-md border border-neutral-300 px-1.5 py-0.5"
                    />
                    <span className="w-14 text-right">${(l.price * l.qty).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 border-t border-neutral-200 pt-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="mt-1 flex justify-between font-medium">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <button
              disabled={lines.length === 0}
              onClick={() => setStep("checkout")}
              className="mt-4 w-full rounded-md bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Checkout
            </button>
          </div>
        </div>
      )}

      {step === "checkout" && (
        <form onSubmit={placeOrder} className="flex max-w-sm flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-5 text-sm">
          <h2 className="font-medium">Pickup details</h2>
          <input required placeholder="Name" className="rounded-md border border-neutral-300 px-2 py-1.5" />
          <input required type="email" placeholder="Email" className="rounded-md border border-neutral-300 px-2 py-1.5" />
          <div className="flex justify-between font-medium">
            <span>Total due at pickup</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button className="rounded-md bg-neutral-900 px-3 py-2 text-white hover:bg-neutral-700">
            Place order
          </button>
        </form>
      )}

      {step === "confirmed" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-sm text-green-800">
          <p className="font-medium">Order {orderNumber} confirmed.</p>
          <p className="mt-1">We&apos;ll have it ready in 10–15 minutes. Total: ${total.toFixed(2)}.</p>
        </div>
      )}
    </div>
  );
}

function DemoNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
      {children}
    </p>
  );
}
