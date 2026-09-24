"use client";

import { useMemo, useState } from "react";

const TIMES = ["5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM"];
const TABLE_COUNT = 6;

// Seeded "already booked" table-count per time slot, so availability is
// computed against real capacity rather than always showing everything open.
const BOOKED_TABLES: Record<string, number> = {
  "5:00 PM": 2,
  "5:30 PM": 4,
  "6:00 PM": 6,
  "6:30 PM": 5,
  "7:00 PM": 3,
  "7:30 PM": 1,
  "8:00 PM": 0,
  "8:30 PM": 0,
};

export default function RestaurantDemo() {
  const [partySize, setPartySize] = useState(2);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ time: string; code: string } | null>(null);

  const availability = useMemo(
    () =>
      TIMES.map((time) => {
        const booked = BOOKED_TABLES[time] ?? 0;
        const open = TABLE_COUNT - booked;
        return { time, open, full: open <= 0 };
      }),
    [],
  );

  function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedTime) return;
    setConfirmed({ time: selectedTime, code: `RES-${Math.floor(1000 + Math.random() * 9000)}` });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <DemoNote>
        Working reservation example: table availability is computed from real capacity minus
        existing bookings per slot, not just a static list. Capacity/bookings shown are
        illustrative seed data.
      </DemoNote>
      <h1 className="text-2xl font-semibold">Olive &amp; Oak — Reserve a table</h1>

      {confirmed ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-sm text-green-800">
          <p className="font-medium">Reservation {confirmed.code} confirmed.</p>
          <p className="mt-1">
            Table for {partySize} at {confirmed.time}. See you then.
          </p>
        </div>
      ) : (
        <form onSubmit={confirm} className="flex flex-col gap-5 rounded-lg border border-neutral-200 bg-white p-5 text-sm">
          <label className="flex flex-col gap-1">
            Party size
            <input
              type="number"
              min={1}
              max={12}
              value={partySize}
              onChange={(e) => setPartySize(Number(e.target.value))}
              className="w-24 rounded-md border border-neutral-300 px-2 py-1.5"
            />
          </label>

          <div>
            <p className="mb-2">Tonight&apos;s availability</p>
            <div className="grid grid-cols-4 gap-2">
              {availability.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  disabled={slot.full}
                  onClick={() => setSelectedTime(slot.time)}
                  className={`rounded-md border px-2 py-2 text-xs ${
                    slot.full
                      ? "cursor-not-allowed border-neutral-200 text-neutral-300"
                      : selectedTime === slot.time
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  {slot.time}
                  <span className="block text-[10px] opacity-70">
                    {slot.full ? "full" : `${slot.open} left`}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <input required placeholder="Name" className="rounded-md border border-neutral-300 px-2 py-1.5" />
          <input required type="tel" placeholder="Phone" className="rounded-md border border-neutral-300 px-2 py-1.5" />

          <button
            disabled={!selectedTime}
            className="self-start rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirm reservation
          </button>
        </form>
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
