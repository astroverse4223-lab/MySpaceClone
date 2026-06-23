"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/time";

interface LogRow {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
  actor: { username: string };
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit-logs")
      .then((res) => res.json())
      .then((json) => {
        setLogs(json.logs ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Audit log</h1>
      <div className="mt-6 space-y-1">
        {loading ? (
          <p className="text-sm text-white/40">Loading...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-white/40">No actions logged yet.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-white/5">
              <p>
                <span className="font-medium">{log.actor.username}</span>{" "}
                <span className="text-white/60">{log.action}</span>
                {log.targetType && <span className="text-white/40"> · {log.targetType} #{log.targetId?.slice(0, 8)}</span>}
              </p>
              <span className="text-xs text-white/30">{timeAgo(log.createdAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
