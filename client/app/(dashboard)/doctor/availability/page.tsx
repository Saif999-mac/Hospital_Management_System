"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useApi } from "@/lib/api";

const DAYS = [
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
  { value: "sun", label: "Sunday" },
];

export default function DoctorAvailabilityPage() {
  const { request } = useApi();
  const { data: doctor } = useSWR("/doctors/me", request);
  const [schedule, setSchedule] = useState<
    Record<
      string,
      {
        enabled: boolean;
        startTime: string;
        endTime: string;
        slotDurationMins: number;
      }
    >
  >(
    Object.fromEntries(
      DAYS.map((d) => [
        d.value,
        {
          enabled: false,
          startTime: "09:00",
          endTime: "17:00",
          slotDurationMins: 20,
        },
      ]),
    ),
  );
  const [leaveDate, setLeaveDate] = useState("");
  const [leaveDates, setLeaveDates] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const toggleDay = (day: string) =>
    setSchedule((s) => ({
      ...s,
      [day]: { ...s[day], enabled: !s[day].enabled },
    }));

  const updateDay = (day: string, field: string, value: string | number) =>
    setSchedule((s) => ({ ...s, [day]: { ...s[day], [field]: value } }));

  const addLeaveDate = () => {
    if (leaveDate && !leaveDates.includes(leaveDate)) {
      setLeaveDates([...leaveDates, leaveDate]);
      setLeaveDate("");
    }
  };
  const handleSave = async () => {
    if (!doctor) return;
    setStatus("saving");
    setMessage("");
    const weeklySchedule = Object.entries(schedule)
      .filter(([, v]) => v.enabled)
      .map(([day, v]) => ({
        day,
        startTime: v.startTime,
        endTime: v.endTime,
        slotDurationMins: v.slotDurationMins,
      }));
    try {
      await request(`/doctors/${doctor._id}/availability`, {
        method: "POST",
        body: JSON.stringify({ weeklySchedule, leaveDates }),
      });
      setStatus("saved");
      setMessage("Availability saved.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Failed to save.");
    }
  };
  if (!doctor)
    return <div className="p-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-2xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">My Availability</h1>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <div className="space-y-3">
        <h2 className="font-semibold">Weekly Schedule</h2>
        {DAYS.map((d) => (
          <div
            key={d.value}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <label className="flex w-32 items-center gap-2">
              <input
                type="checkbox"
                checked={schedule[d.value].enabled}
                onChange={() => toggleDay(d.value)}
              />
              {d.label}
            </label>
            {schedule[d.value].enabled && (
              <>
                <input
                  type="time"
                  value={schedule[d.value].startTime}
                  onChange={(e) =>
                    updateDay(d.value, "startTime", e.target.value)
                  }
                  className="rounded-md border px-2 py-1 text-sm"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <input
                  type="time"
                  value={schedule[d.value].endTime}
                  onChange={(e) =>
                    updateDay(d.value, "endTime", e.target.value)
                  }
                  className="rounded-md border px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  value={schedule[d.value].slotDurationMins}
                  onChange={(e) =>
                    updateDay(
                      d.value,
                      "slotDurationMins",
                      Number(e.target.value),
                    )
                  }
                  className="w-20 rounded-md border px-2 py-1 text-sm"
                />
                <span className="text-sm text-muted-foreground">min slots</span>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <h2 className="font-semibold">Leave Dates</h2>
        <div className="flex gap-2">
          <input
            type="date"
            value={leaveDate}
            onChange={(e) => setLeaveDate(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <button
            onClick={addLeaveDate}
            className="rounded-md border px-3 py-2 text-sm"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {leaveDates.map((d) => (
            <span
              key={d}
              className="flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-sm"
            >
              {d}
              <button
                onClick={() => setLeaveDates(leaveDates.filter((x) => x !== d))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={status === "saving"}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {status === "saving" ? "Saving..." : "Save Availability"}
      </button>
    </div>
  );
}
