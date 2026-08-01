"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/api";

export default function ReceptionistBookAppointmentPage() {
  const { request } = useApi();
  const router = useRouter();
  const [patientId, setPatientId] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState("");

  const { data: patientResults } = useSWR(
    patientSearch ? `/patients?search=${patientSearch}&limit=10` : null,
    request,
  );
  const { data: doctors } = useSWR("/doctors", request);
  const { data: slotData, isLoading: slotsLoading } = useSWR(
    doctorId && date ? `/doctors/${doctorId}/availability?date=${date}` : null,
    request,
  );

  const handleConfirmBooking = async () => {
    if (!selectedTime || !patientId) return;
    setBooking(true);
    setMessage("");
    try {
      await request("/appointments", {
        method: "POST",
        body: JSON.stringify({
          patientId,
          doctorId,
          date,
          time: selectedTime,
          reason,
        }),
      });
      router.push("/receptionist/appointments");
    } catch (err: any) {
      setMessage(
        err.message || "Failed to book — that slot may have just been taken.",
      );
      setSelectedTime("");
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6 p-8">
      <h1 className="text-2xl font-bold">Book Appointment for a Patient</h1>
      {message && <p className="text-sm text-destructive">{message}</p>}

      <div>
        <label className="text-sm font-medium">Search Patient</label>
        <input
          value={patientSearch}
          onChange={(e) => {
            setPatientSearch(e.target.value);
            setPatientId("");
          }}
          placeholder="Type patient name..."
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
        {patientResults?.patients?.length > 0 && !patientId && (
          <div className="mt-1 rounded-md border">
            {patientResults.patients.map((p: any) => (
              <button
                key={p._id}
                type="button"
                onClick={() => {
                  setPatientId(p._id);
                  setPatientSearch(p.name);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
              >
                {p.name} — {p.email}
              </button>
            ))}
          </div>
        )}
        {patientId && (
          <p className="mt-1 text-xs text-muted-foreground">
            Selected: {patientSearch}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Doctor</label>
        <select
          value={doctorId}
          onChange={(e) => {
            setDoctorId(e.target.value);
            setSelectedTime("");
          }}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Select a doctor</option>
          {doctors?.map((d: any) => (
            <option key={d._id} value={d._id}>
              {d.name} — {d.specialization}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSelectedTime("");
          }}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Reason for visit</label>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>

      {doctorId && date && (
        <div>
          <h2 className="mb-2 text-sm font-medium">Available Times</h2>
          {slotsLoading ? (
            <p className="text-sm text-muted-foreground">Loading slots...</p>
          ) : slotData?.slots?.length ? (
            <div className="grid grid-cols-4 gap-2">
              {slotData.slots.map((time: string) => (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    selectedTime === time
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No open slots for this date.
            </p>
          )}
        </div>
      )}

      <button
        onClick={handleConfirmBooking}
        disabled={!selectedTime || !patientId || booking}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {booking
          ? "Booking..."
          : !patientId
            ? "Select a patient"
            : selectedTime
              ? `Confirm Booking — ${selectedTime}`
              : "Select a time slot"}
      </button>
    </div>
  );
}
