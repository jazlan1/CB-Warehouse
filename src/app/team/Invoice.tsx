"use client";

import React, { useState } from "react";
import { 
  FileText, Plus, DollarSign, Download, Calendar, User, 
  CheckCircle2, Clock, AlertTriangle, Trash2, Edit3, X, 
  Check, Filter, Search, Loader2, Sparkles, Receipt
} from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/date";

type InvoiceItem = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  eventName: string;
  amount: number;
  dueDate: string;
  status: "Paid" | "Pending" | "Overdue";
  notes?: string;
};

const initialInvoices: InvoiceItem[] = [
  {
    id: "INV-8801",
    invoiceNumber: "INV-2026-001",
    clientName: "Experian Global Events",
    eventName: "Experian Annual Global Summit 2026",
    amount: 3450.00,
    dueDate: "2026-07-15",
    status: "Paid",
    notes: "Round-trip logistics & staging freight buffer",
  },
  {
    id: "INV-8802",
    invoiceNumber: "INV-2026-002",
    clientName: "North America Corporate",
    eventName: "Corporate Sales Strategy Meetup",
    amount: 1820.50,
    dueDate: "2026-07-28",
    status: "Pending",
    notes: "Audio/Visual equipment dispatch & return buffer",
  },
  {
    id: "INV-8803",
    invoiceNumber: "INV-2026-003",
    clientName: "Executive Leadership",
    eventName: "Executive Innovation Workshop",
    amount: 980.00,
    dueDate: "2026-06-30",
    status: "Overdue",
    notes: "Expedited courier transit",
  },
];

export default function Invoice() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>(initialInvoices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<InvoiceItem | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<InvoiceItem | null>(null);

  const [formData, setFormData] = useState({
    invoiceNumber: "",
    clientName: "",
    eventName: "",
    amount: 0,
    dueDate: "",
    status: "Pending" as "Paid" | "Pending" | "Overdue",
    notes: "",
  });

  const handleOpenCreate = () => {
    setFormData({
      invoiceNumber: `INV-2026-${String(invoices.length + 1).padStart(3, "0")}`,
      clientName: "",
      eventName: "",
      amount: 0,
      dueDate: new Date().toISOString().split("T")[0],
      status: "Pending",
      notes: "",
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newInvoice: InvoiceItem = {
      id: `INV-${Date.now().toString().slice(-4)}`,
      invoiceNumber: formData.invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
      clientName: formData.clientName,
      eventName: formData.eventName,
      amount: Number(formData.amount),
      dueDate: formData.dueDate,
      status: formData.status,
      notes: formData.notes,
    };

    setInvoices([newInvoice, ...invoices]);
    setShowCreateModal(false);
  };

  const handleOpenEdit = (inv: InvoiceItem) => {
    setEditingInvoice(inv);
    setFormData({
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.clientName,
      eventName: inv.eventName,
      amount: inv.amount,
      dueDate: inv.dueDate,
      status: inv.status,
      notes: inv.notes || "",
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    setInvoices((prev) =>
      prev.map((item) =>
        item.id === editingInvoice.id
          ? {
              ...item,
              invoiceNumber: formData.invoiceNumber,
              clientName: formData.clientName,
              eventName: formData.eventName,
              amount: Number(formData.amount),
              dueDate: formData.dueDate,
              status: formData.status,
              notes: formData.notes,
            }
          : item
      )
    );
    setEditingInvoice(null);
  };

  const handleDelete = () => {
    if (!deletingInvoice) return;
    setInvoices((prev) => prev.filter((item) => item.id !== deletingInvoice.id));
    setDeletingInvoice(null);
  };

  const filteredInvoices = invoices.filter((item) => {
    const q = search.toLowerCase();
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    const matchesQuery =
      item.invoiceNumber.toLowerCase().includes(q) ||
      item.clientName.toLowerCase().includes(q) ||
      item.eventName.toLowerCase().includes(q);

    return matchesStatus && matchesQuery;
  });

  const totalInvoiced = invoices.reduce((acc, curr) => acc + curr.amount, 0);
  const totalPaid = invoices.filter(i => i.status === "Paid").reduce((acc, curr) => acc + curr.amount, 0);
  const totalPending = invoices.filter(i => i.status !== "Paid").reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* ─── Header Section ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-xs">
              <Receipt className="h-5 w-5" />
            </div>
            Billing &amp; Logistics Reports
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate, manage, edit, and track event freight invoices and warehouse handling fees.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition px-4 py-2.5 rounded-xl shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Create Invoice / Report
        </button>
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">${totalInvoiced.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-slate-500 mt-1">{invoices.length} total generated statements</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Settled &amp; Paid</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-emerald-700/80 mt-1">{invoices.filter(i => i.status === "Paid").length} completed payments</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding Balance</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">${totalPending.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-amber-700/80 mt-1">{invoices.filter(i => i.status !== "Paid").length} pending / overdue statements</p>
        </div>
      </div>

      {/* ─── Filter & Search Bar ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          {["ALL", "Paid", "Pending", "Overdue"].map((status) => (
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
            placeholder="Search invoice #, client, event..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800"
          />
        </div>
      </div>

      {/* ─── Table View ─── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="px-6 py-3.5 text-left">Statement #</th>
                <th className="px-6 py-3.5 text-left">Client &amp; Event</th>
                <th className="px-6 py-3.5 text-left">Due Date</th>
                <th className="px-6 py-3.5 text-left">Amount</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                      {inv.invoiceNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{inv.eventName}</p>
                    <p className="text-[11px] text-slate-500">{inv.clientName}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">
                    {formatDate(inv.dueDate)}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-900 text-sm">
                    ${inv.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        inv.status === "Paid"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : inv.status === "Pending"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(inv)}
                        title="Edit Invoice"
                        className="p-1.5 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg border border-slate-200 hover:border-blue-200 transition cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingInvoice(inv)}
                        title="Delete Invoice"
                        className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400">
                    No billing statements matched your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── CREATE / EDIT MODAL ─── */}
      {(showCreateModal || editingInvoice) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                {editingInvoice ? "Edit Billing Statement" : "Generate Billing Statement"}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingInvoice(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={editingInvoice ? handleSaveEdit : handleCreateSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Invoice / Statement #</label>
                  <input
                    type="text"
                    required
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Client / Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="e.g. Experian Live"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Associated Event</label>
                <input
                  type="text"
                  required
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  placeholder="e.g. Annual Global Summit 2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 cursor-pointer"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Description</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Courier charges, equipment handling buffer..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingInvoice(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  {editingInvoice ? "Save Changes" : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {deletingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-2xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Delete Billing Record</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to delete invoice <strong className="text-slate-900 font-bold">{deletingInvoice.invoiceNumber}</strong> (${deletingInvoice.amount.toFixed(2)})? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingInvoice(null)}
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
                Yes, Delete Invoice
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}