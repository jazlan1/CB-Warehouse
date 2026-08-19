"use client";

import { useEffect, useState } from "react";
import { 
  Package, User, Shield, Inbox, Loader2, Calendar, Clock, 
  Search, X, Filter, PackageCheck, PackageX, Edit3, Trash2, 
  AlertTriangle, Check, Layers, Tag, MapPin, Sparkles
} from "lucide-react";
import { formatDateTime, formatDate, formatTime } from "@/lib/date";

export default function InventoryList() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("ALL");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Modal states
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [deletingItem, setDeletingItem] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    sku: "",
    bin: "",
    quantity: 0,
    condition: "Good",
    description: "",
    clientId: "unassigned",
  });

  const fetchInventoryAndClients = async () => {
    try {
      setLoading(true);
      const [invRes, clientsRes] = await Promise.all([
        fetch("/api/users/dashboard/inventory"),
        fetch("/api/users/dashboard/clients", { credentials: "include" })
      ]);

      const invData = await invRes.json();
      const clientsData = await clientsRes.json();

      setInventory(invData.data || []);
      if (clientsData.success) {
        setClients(clientsData.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryAndClients();
  }, []);

  const handleToggleStock = async (itemId: string) => {
    setTogglingId(itemId);
    try {
      const res = await fetch(`/api/inventory/intake?id=${itemId}`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (data.success) {
        setInventory((prev) =>
          prev.map((item) =>
            (item.inventoryId === itemId || item.id === itemId)
              ? { ...item, stockStatus: data.data.stockStatus, quantity: data.data.quantity }
              : item
          )
        );
      }
    } catch (err) {
      console.error("Toggle stock error:", err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setEditFormData({
      name: item.productName || item.name || "",
      sku: item.sku || "",
      bin: item.bin || "",
      quantity: item.quantity || 0,
      condition: item.condition || "Good",
      description: item.description || "",
      clientId: item.clientId || "unassigned",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", editFormData.name);
      formData.append("sku", editFormData.sku);
      formData.append("bin", editFormData.bin);
      formData.append("quantity", String(editFormData.quantity));
      formData.append("condition", editFormData.condition);
      formData.append("description", editFormData.description);
      formData.append("clientId", editFormData.clientId);

      const itemId = editingItem.inventoryId || editingItem.id;
      const res = await fetch(`/api/inventory/intake?id=${itemId}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setEditingItem(null);
        fetchInventoryAndClients();
      } else {
        alert(data.message || "Failed to update item.");
      }
    } catch (err) {
      console.error("Failed to save edit:", err);
      alert("Error saving item updates.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;

    setIsSubmitting(true);
    try {
      const itemId = deletingItem.inventoryId || deletingItem.id;
      const res = await fetch(`/api/inventory/intake?id=${itemId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        setDeletingItem(null);
        setInventory((prev) => prev.filter((item) => (item.inventoryId !== itemId && item.id !== itemId)));
      } else {
        alert(data.message || "Failed to delete item.");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const q = search.toLowerCase().trim();
    
    const matchesClient = 
      clientFilter === "ALL" || 
      item.clientId === clientFilter || 
      item.clientEmail === clientFilter ||
      (clientFilter === "UNASSIGNED" && !item.clientId && !item.clientName);

    if (!matchesClient) return false;
    if (!q) return true;

    return (
      item.sku?.toLowerCase().includes(q) ||
      item.productName?.toLowerCase().includes(q) ||
      item.clientName?.toLowerCase().includes(q) ||
      item.clientEmail?.toLowerCase().includes(q) ||
      item.cbEmail?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading inventory ledger...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden max-w-6xl mx-auto">
      
      {/* Header Section */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="font-bold text-slate-900 text-lg tracking-tight">
            Master Inventory Ledger &amp; Allocations
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View, edit, assign, or delete stock records across all client accounts.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Client Filter Dropdown */}
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="bg-white border border-slate-200/80 text-slate-700 text-xs font-medium rounded-xl px-3 py-1.5 shadow-2xs focus:outline-none focus:border-blue-500 cursor-pointer w-full sm:w-auto"
          >
            <option value="ALL">👤 All Client Accounts</option>
            <option value="UNASSIGNED">📦 Unassigned Stock</option>
            {clients.map((c) => (
              <option key={c.id} value={c.email || c.id}>
                {c.name || c.email} ({c.role})
              </option>
            ))}
          </select>

          {/* Search Bar */}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter inventory..."
              className="pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 w-full sm:w-44 text-slate-800"
            />
          </div>

          <div className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-100 shrink-0">
            {inventory.length} Total SKUs
          </div>
        </div>
      </div>

      {/* Table & Empty State Handling */}
      <div className="overflow-x-auto">
        {filteredInventory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3 border border-slate-200">
              <Inbox className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No inventory matched</h3>
            <p className="text-xs text-slate-500 max-w-xs mt-1">
              No inventory records found for your active filter.
            </p>
          </div>
        ) : (
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="px-6 py-3.5">SKU</th>
                <th className="px-6 py-3.5">Product Name</th>
                <th className="px-6 py-3.5 text-center">Stock Status</th>
                <th className="px-6 py-3.5">Client Assignment</th>
                <th className="px-6 py-3.5">Intake Agent</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInventory.map((item: any) => {
                const isOutOfStock = item.quantity <= 0 || item.stockStatus === "OUT_OF_STOCK";
                const isLowStock = item.quantity > 0 && item.quantity <= 5;
                const itemId = item.inventoryId || item.id;

                return (
                  <tr
                    key={itemId}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* SKU */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                        {item.sku}
                      </span>
                    </td>

                    {/* Product Name */}
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100/50">
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="truncate max-w-[200px] block">{item.productName}</span>
                          {item.bin && (
                            <span className="text-[10px] text-slate-400 font-normal">Bin: {item.bin}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Quantity & Stock Toggle */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                            isOutOfStock
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : isLowStock
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {item.quantity} units
                        </span>
                        
                        <button
                          onClick={() => handleToggleStock(itemId)}
                          disabled={togglingId === itemId}
                          className="text-[10px] text-slate-400 hover:text-blue-600 underline font-medium cursor-pointer"
                        >
                          {isOutOfStock ? "Set In-Stock" : "Set Out-of-Stock"}
                        </button>
                      </div>
                    </td>

                    {/* Client Details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <div className="truncate max-w-[170px]">
                          <p className="font-semibold text-slate-800 text-xs truncate">
                            {item.clientName || "Unassigned Master Stock"}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.clientEmail || "Available to all events"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* CB Team */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="text-slate-600 font-medium truncate max-w-[150px]">
                          {item.cbEmail || "CB Team"}
                        </span>
                      </div>
                    </td>

                    {/* Actions: Edit & Delete */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          title="Edit Inventory Item"
                          className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg border border-slate-200 hover:border-blue-200 transition cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingItem(item)}
                          title="Delete Inventory Item"
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── EDIT MODAL ─── */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Edit3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Inventory Item</h3>
                  <p className="text-xs text-slate-400">SKU: {editingItem.sku}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={editFormData.sku}
                    onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bin Location</label>
                  <input
                    type="text"
                    value={editFormData.bin}
                    onChange={(e) => setEditFormData({ ...editFormData, bin: e.target.value })}
                    placeholder="e.g. BIN-A1"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editFormData.quantity}
                    onChange={(e) => setEditFormData({ ...editFormData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Condition</label>
                  <select
                    value={editFormData.condition}
                    onChange={(e) => setEditFormData({ ...editFormData, condition: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 cursor-pointer"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Client Allocation</label>
                <select
                  value={editFormData.clientId}
                  onChange={(e) => setEditFormData({ ...editFormData, clientId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 cursor-pointer"
                >
                  <option value="unassigned">📦 Unassigned Master Stock</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.email} ({c.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Optional item notes..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-2xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Delete Inventory Record</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to delete <strong className="text-slate-900 font-bold">{deletingItem.productName || deletingItem.sku}</strong>? This action will archive the inventory item and remove it from active ledgers.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}