"use client";

import React, { useState } from "react";
import { Clock, CheckCircle2, XCircle, AlertTriangle, Loader2, RotateCcw, Calendar, Check } from "lucide-react";
import { formatDateTime, formatDate, formatTime } from "@/lib/date";

type ReturnItem = {
  id: string;
  eventName: string;
  receivedDate: string;
  status: "Pending" | "Verified" | "Damaged" | "Missing";
  notes?: string;
};

const dummyReturns: ReturnItem[] = [
  {
    id: "RET-2001",
    eventName: "Experian Annual Global Summit 2026",
    receivedDate: "2026-06-05T14:30:00Z",
    status: "Pending",
  },
  {
    id: "RET-2002",
    eventName: "Corporate Sales Strategy Meetup",
    receivedDate: "2026-06-06T10:15:00Z",
    status: "Verified",
  },
];

export default function ReturnsAudits() {
  const [returns, setReturns] = useState<ReturnItem[]>(dummyReturns);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const updateStatus = async (id: string, status: ReturnItem["status"]) => {
    setLoadingId(id);

    try {
      await fetch("/api/returns/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      setReturns((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const getBadgeStyle = (status: ReturnItem["status"]) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Verified":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Damaged":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Missing":
        return "bg-orange-50 text-orange-700 border-orange-200";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 rounded-xl text-white shadow-xs">
              <RotateCcw className="h-5 w-5" />
            </div>
            Returns &amp; Audit Verification
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verify reverse logistics packages, check hardware condition, and log Restock / Damage allocations.
          </p>
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-4">
        {returns.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all"
          >

            {/* LEFT INFO */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
                  {item.id}
                </span>
                <p className="font-bold text-slate-900 text-sm">
                  {item.eventName}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Received: <strong className="text-slate-700">{formatDateTime(item.receivedDate)}</strong>
                </span>
              </div>

              <div className="pt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getBadgeStyle(item.status)}`}>
                  {item.status}
                </span>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-2 flex-wrap">
              {item.status === "Pending" && (
                <>
                  <button
                    onClick={() => updateStatus(item.id, "Verified")}
                    disabled={loadingId === item.id}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs disabled:opacity-50"
                  >
                    {loadingId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Verify &amp; Restock
                  </button>

                  <button
                    onClick={() => updateStatus(item.id, "Damaged")}
                    className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Flag Damaged
                  </button>

                  <button
                    onClick={() => updateStatus(item.id, "Missing")}
                    className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-xl text-xs font-bold transition"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Missing
                  </button>
                </>
              )}

              {item.status === "Verified" && (
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="h-4 w-4" />
                  Verified &amp; Restocked
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}