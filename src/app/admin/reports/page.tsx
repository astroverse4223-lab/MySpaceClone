"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/time";

interface ReportRow {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { username: string };
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/admin/reports?status=PENDING");
    const json = await res.json();
    setReports(json.reports ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function resolve(id: string, status: "RESOLVED" | "DISMISSED") {
    await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Reports</h1>
      <div className="mt-6 space-y-2">
        {loading ? (
          <p className="text-sm text-white/40">Loading...</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-white/40">No pending reports.</p>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm">
                <span className="font-medium">{report.targetType}</span>{" "}
                <span className="text-white/40">#{report.targetId.slice(0, 8)}</span>
              </p>
              <p className="mt-1 text-sm text-white/70">{report.reason}</p>
              <p className="mt-2 text-xs text-white/40">
                Reported by {report.reporter.username} · {timeAgo(report.createdAt)}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => resolve(report.id, "RESOLVED")}
                  className="rounded-lg border border-emerald-500/30 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10"
                >
                  Mark resolved
                </button>
                <button
                  onClick={() => resolve(report.id, "DISMISSED")}
                  className="rounded-lg border border-white/15 px-3 py-1 text-xs hover:bg-white/5"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
