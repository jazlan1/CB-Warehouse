"use client";

import React, { useState } from "react";
import { 
  Clock, CheckCircle2, XCircle, AlertTriangle, Loader2, RotateCcw, 
  Calendar, Check, Plus, Search, Trash2, Edit3, X, Filter, Sparkles
} from "lucide-react";
import { formatDateTime, formatDate, formatTime } from "@/lib/date";

type ReturnItem = {
  id: string;
  eventName: string;
  clientName: string;
  receivedDate: string;
  status: "Pending" | "Verified" | "Damaged" | "Missing";
  notes?: string;
};

const initialReturns: ReturnItem[] = [
  {
    id: "RET-2001",
    eventName: "Experian Annual Global Summit 2026",
    clientName: "Experian Global Events",
    receivedDate: "2026-06-05T14:30:00Z",
    status: "Pending",
    notes: "Main event stage package returned; checking banner hardware and cabling.",
  },
  {
    id: "RET-2002",
    eventName: "Corporate Sales Strategy Meetup",
    clientName: "North America Sales Corp",
    receivedDate: "2026-06-06T10:15:00Z",
    status: "Verified",
    notes: "All 12 display units verified in good working condition and returned to Bin A1.",
  },
  {
    id: "RET-2003",
    eventName: "Regional Partner Expo",
    clientName: "Tech Connect LLC",
    receivedDate: "2026-06-08T16:45:00Z",
    status: "Damaged",
    notes: "Tripod mounting plate cracked during de-rigging.",
  },
];

export default function ReturnsAudits() {
  const [returns, setReturns] = useState<ReturnItem[]>(initialReturns);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReturn, setEditingReturn] = useState<ReturnItem | null>(null);
  const [deletingReturn, setDeletingReturn] = useState<ReturnItem | null>(null);

  const [formData, setFormData] = useState({
    id: "",
    eventName: "",
    clientName: "",
    receivedDate: "",
    status: "Pending" as ReturnItem["status"],
    notes: "",
  });

  const handleOpenCreate = () => {
    setFormData({
      id: `RET-${Date.now().toString().slice(-4)}`,
      eventName: "",
      clientName: "",
      receivedDate: new Date().toISOString().slice(0, 16),
      status: "Pending",
      notes: "",
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: ReturnItem = {
      id: formData.id || `RET-${Date.now().toString().slice(-4)}`,
      eventName: formData.eventName,
      clientName: formData.clientName,
      receivedDate: new Date(formData.receivedDate).toISOString(),
      status: formData.status,
      notes: formData.notes,
    };
    setReturns([newRecord, ...returns]);
    setShowCreateModal(false);
  };

  const handleOpenEdit = (item: ReturnItem) => {
    setEditingReturn(item);
    setFormData({
      id: item.id,
      eventName: item.eventName,
      clientName: item.clientName || "",
      receivedDate: item.receivedDate.slice(0, 16),
      status: item.status,
      notes: item.notes || "",
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReturn) return;

    setReturns((prev) =>
      prev.map((item) =>
        item.id === editingReturn.id
          ? {
              ...item,
              eventName: formData.eventName,
              clientName: formData.clientName,
              receivedDate: new Date(formData.receivedDate).toISOString(),
              status: formData.status,
              notes: formData.notes,
            }
          : item
      )
    );
    setEditingReturn(null);
  };

  const handleDelete = () => {
    if (!deletingReturn) return;
    setReturns((prev) => prev.filter((item) => item.id !== deletingReturn.id));
    setDeletingReturn(null);
  };

  const updateStatus = async (id: string, status: ReturnItem["status"]) => {
    setLoadingId(id);
    try {
      await fetch("/api/returns/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      }).catch(() => {});

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

  const filteredReturns = returns.filter((item) => {
    const q = search.toLowerCase();
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const matchesQuery =
      item.id.toLowerCase().includes(q) ||
      item.eventName.toLowerCase().includes(q) ||
      item.clientName?.toLowerCase().includes(q) ||
      item.notes?.toLowerCase().includes(q);

    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ─── HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-amber-500 rounded-xl text-white shadow-xs">
              <RotateCcw className="h-5 w-5" />
            </div>
            Returns &amp; Audit Verification Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verify reverse logistics packages, check hardware condition, restock inventory, or record damage.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition px-4 py-2.5 rounded-xl shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Log Return Entry
        </button>
      </div>

      {/* ─── FILTER & SEARCH BAR ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {["ALL", "Pending", "Verified", "Damaged", "Missing"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === status
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search return #, event, client..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800"
          />
        </div>
      </div>

      {/* ─── LIST OF RETURNS ─── */}
      <div className="space-y-4">
        {filteredReturns.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-all"
          >

            {/* LEFT INFO */}
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                  {item.id}
                </span>
                <p className="font-bold text-slate-900 text-sm">
                  {item.eventName}
                </p>
                {item.clientName && (
                  <span className="text-xs text-slate-500 font-medium">
                    • {item.clientName}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Received: <strong className="text-slate-700">{formatDateTime(item.receivedDate)}</strong>
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${getBadgeStyle(item.status)}`}>
                  {item.status}
                </span>
              </div>

              {item.notes && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                  📝 {item.notes}
                </p>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-2 flex-wrap">
              {item.status === "Pending" && (
                <>
                  <button
                    onClick={() => updateStatus(item.id, "Verified")}
                    disabled={loadingId === item.id}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs disabled:opacity-50 cursor-pointer"
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
                    className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Damaged
                  </button>

                  <button
                    onClick={() => updateStatus(item.id, "Missing")}
                    className="flex items-center gap-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Missing
                  </button>
                </>
              )}

              {item.status !== "Pending" && (
                <button
                  onClick={() => updateStatus(item.id, "Pending")}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Re-audit
                </button>
              )}

              <button
                onClick={() => handleOpenEdit(item)}
                title="Edit Audit"
                className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg border border-slate-200 hover:border-blue-200 transition cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => setDeletingReturn(item)}
                title="Delete Audit"
                className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg border border-slate-200 hover:border-rose-200 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filteredReturns.length === 0 && (
          <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl text-slate-400">
            No return manifests matched your search.
          </div>
        )}
      </div>

      {/* ─── CREATE / EDIT MODAL ─── */}
      {(showCreateModal || editingReturn) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-amber-600" />
                {editingReturn ? "Edit Return Manifest" : "Log Reverse Logistics Return"}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingReturn(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={editingReturn ? handleSaveEdit : handleCreateSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Return Record ID</label>
                  <input
                    type="text"
                    required
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Received Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.receivedDate}
                    onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Event Name</label>
                <input
                  type="text"
                  required
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  placeholder="e.g. Annual Global Summit 2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Client / Owner</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="e.g. Experian Global Events"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hardware Condition &amp; Audit Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 cursor-pointer"
                >
                  <option value="Pending">Pending Audit</option>
                  <option value="Verified">Verified &amp; Restocked</option>
                  <option value="Damaged">Damaged / Requires Repair</option>
                  <option value="Missing">Missing Components</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Audit Notes &amp; Observations</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes about box contents, condition, bin allocation..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingReturn(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  {editingReturn ? "Save Changes" : "Log Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {deletingReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-2xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Delete Return Manifest</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to delete return record <strong className="text-slate-900 font-bold">{deletingReturn.id}</strong> ({deletingReturn.eventName})? This will remove the audit log.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingReturn(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}