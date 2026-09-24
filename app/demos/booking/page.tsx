"use client";

import { useMemo, useState } from "react";

const SERVICES = [
  { id: "consult", name: "Initial consult", minutes: 30 },
  { id: "standard", name: "Standard appointment", minutes: 60 },
  { id: "deep", name: "Extended session", minutes: 90 },
];

const DAY_START_MIN = 9 * 60; // 9:00 AM
const DAY_END_MIN = 17 * 60; // 5:00 PM
const SLOT_STEP = 30;

// Seeded existing bookings as [startMinute, endMinute) ranges, so new slots
// are computed by checking real overlap against them, not just hidden by name.
const EXISTING_BOOKINGS: Array<[number, number]> = [
  [9 * 60, 9 * 60 + 60],
  [11 * 60, 11 * 60 + 30],
  [13 * 60, 13 * 60 + 90],
  [15 * 60 + 30, 16 * 60 + 30],
];

function toLabel(minutes: number) {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const suffix = h24 < 12 ? "AM" : "PM";
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

function overlaps(startA: number, endA: number, startB: number, endB: number) {
  return startA < endB && startB < endA;
}

export default function BookingDemo() {
  const [serviceId, setServiceId] = useState(SERVICES[1].id);
  const [selectedStart, setSelectedStart] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState<{ start: number; end: number; code: string } | null>(null);

  const service = SERVICES.find((s) => s.id === serviceId)!;

  const slots = useMemo(() => {
    const options: Array<{ start: number; end: number; available: boolean }> = [];
    for (let start = DAY_START_MIN; start + service.minutes <= DAY_END_MIN; start += SLOT_STEP) {
      const end = start + service.minutes;
      const available = !EXISTING_BOOKINGS.some(([bStart, bEnd]) => overlaps(start, end, bStart, bEnd));
      options.push({ start, end, available });
    }
    return options;
  }, [service.minutes]);

  function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedStart == null) return;
    setConfirmed({
      start: selectedStart,
      end: selectedStart + service.minutes,
      code: `APT-${Math.floor(1000 + Math.random() * 9000)}`,
    });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-10">
      <DemoNote>
        Working scheduler example: available slots are computed from real appointment length +
        overlap checks against existing bookings (a 90-minute service blocks different slots than
        a 30-minute one). Calendar data shown is illustrative seed data.
      </DemoNote>
      <h1 className="text-2xl font-semibold">Studio 12 — Book an appointment</h1>

      {confirmed ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-sm text-green-800">
          <p className="font-medium">Appointment {confirmed.code} confirmed.</p>
          <p className="mt-1">
            {service.name}, {toLabel(confirmed.start)}–{toLabel(confirmed.end)}.
          </p>
        </div>
      ) : (
        <form onSubmit={confirm} className="flex flex-col gap-5 rounded-lg border border-neutral-200 bg-white p-5 text-sm">
          <label className="flex flex-col gap-1">
            Service
            <select
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setSelectedStart(null);
              }}
              className="rounded-md border border-neutral-300 px-2 py-1.5"
            >
              {SERVICES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.minutes} min)
                </option>
              ))}
            </select>
          </label>

          <div>
            <p className="mb-2">Today&apos;s open slots for a {service.minutes}-minute {service.name.toLowerCase()}</p>
            <div className="grid grid-cols-4 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.start}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setSelectedStart(slot.start)}
                  className={`rounded-md border px-2 py-2 text-xs ${
                    !slot.available
                      ? "cursor-not-allowed border-neutral-200 text-neutral-300 line-through"
                      : selectedStart === slot.start
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-300 hover:border-neutral-500"
                  }`}
                >
                  {toLabel(slot.start)}
                </button>
              ))}
            </div>
          </div>

          <input required placeholder="Name" className="rounded-md border border-neutral-300 px-2 py-1.5" />
          <input required type="email" placeholder="Email" className="rounded-md border border-neutral-300 px-2 py-1.5" />

          <button
            disabled={selectedStart == null}
            className="self-start rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirm appointment
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
