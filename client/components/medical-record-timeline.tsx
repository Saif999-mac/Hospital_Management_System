"use client";

import useSWR from "swr";
import { formatDistanceToNow, format } from "date-fns";
import { useApi } from "@/lib/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export function MedicalRecordTimeline({ patientId }: { patientId: string }) {
  const { request } = useApi();
  const {
    data: records,
    isLoading,
    error,
  } = useSWR(
    patientId ? `/medical-records/patient/${patientId}` : null,
    request,
  );

  if (isLoading)
    return <p className="text-muted-foreground">Loading records...</p>;
  if (error)
    return (
      <p className="text-sm text-destructive">
        {error.message || "Failed to load records."}
      </p>
    );
  if (!records?.length)
    return <p className="text-muted-foreground">No medical records yet.</p>;

  return (
    <Accordion type="single" collapsible className="space-y-2">
      {records.map((record: any) => (
        <AccordionItem
          key={record._id}
          value={record._id}
          className="rounded-lg border px-4"
        >
          <AccordionTrigger className="hover:no-underline">
            <div className="flex flex-1 items-center justify-between pr-4 text-left">
              <div>
                <p className="font-medium">{record.diagnosis}</p>
                <p className="text-xs text-muted-foreground">
                  Dr. {record.doctor?.name} —{" "}
                  {format(new Date(record.visitDate), "MMM d, yyyy")} (
                  {formatDistanceToNow(new Date(record.visitDate), {
                    addSuffix: true,
                  })}
                  )
                </p>
              </div>
              {record.symptoms?.length > 0 && (
                <Badge variant="secondary">
                  {record.symptoms.length} symptom
                  {record.symptoms.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="space-y-3 pb-4">
            {record.symptoms?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Symptoms
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {record.symptoms.map((s: string) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {record.vitals && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Vitals
                </p>
                <div className="mt-1 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  {record.vitals.bloodPressure && (
                    <span>BP: {record.vitals.bloodPressure}</span>
                  )}
                  {record.vitals.temperature && (
                    <span>Temp: {record.vitals.temperature}°F</span>
                  )}
                  {record.vitals.pulse && (
                    <span>Pulse: {record.vitals.pulse} bpm</span>
                  )}
                  {record.vitals.weight && (
                    <span>Weight: {record.vitals.weight} kg</span>
                  )}
                </div>
              </div>
            )}

            {record.notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Notes
                </p>
                <p className="text-sm">{record.notes}</p>
              </div>
            )}

            {record.attachments?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Attachments
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {record.attachments.map((a: any) => (
                    <a
                      key={a.publicId}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border px-3 py-1 text-xs hover:bg-accent"
                    >
                      {a.label || "View file"}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
