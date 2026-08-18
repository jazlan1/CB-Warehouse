"use client";

import { useEffect, useState } from "react";
import { Package, User, Shield, Inbox, Loader2, Calendar, Clock, Search, X, Filter, PackageCheck, PackageX } from "lucide-react";
import { formatDateTime, formatDate, formatTime } from "@/lib/date";

export default function InventoryList() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("ALL");
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
            item.inventoryId === itemId || item.id === itemId
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
            View, assign, and manage stock quantities and ownership for all Experience &amp; Team clients.
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
                <th className="px-6 py-3.5 text-right">Intake Timestamp</th>
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

                    {/* Created Date & Time */}
                    <td className="px-6 py-4 text-right">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-800">
                          {formatDate(item.createdAt)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {formatTime(item.createdAt)}
                        </p>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}