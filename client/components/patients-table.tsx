"use client";
import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useApi } from "@/lib/api";

export function PatientsTable({ basePath }: { basePath: String }) {
  const { request } = useApi();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useSWR(
    `/patients?page=${page}&limit=10&search=${search}`,
    request,
  );
  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Patients</h1>
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="rounded-md border px-3 py-2 text-sm"
        />
      </div>
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          <div className="rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Blood Group</th>
                </tr>
              </thead>
              <tbody>
                {data?.patients?.map((p: any) => (
                  <tr
                    key={p._id}
                    className="border-b last:border-0 hover:bg-accent"
                  >
                    <td className="p-3">
                      <Link
                        href={`${basePath}/${p._id}`}
                        className="font-medium hover:underline"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="p-3 text-muted-foreground">{p.email}</td>
                    <td className="p-3 text-muted-foreground">
                      {p.phone || "—"}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {p.bloodGroup || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {data?.page} of {data?.pages || 1} ({data?.total} total)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= (data?.pages || 1)}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
