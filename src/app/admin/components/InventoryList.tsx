"use client";

import { useEffect, useState } from "react";
import { Package, User, Shield, Inbox, Loader2, Calendar, Clock, Search, X } from "lucide-react";
import { formatDateTime, formatDate, formatTime } from "@/lib/date";

export default function InventoryList() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/users/dashboard/inventory")
      .then((res) => res.json())
      .then((data) => {
        setInventory(data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredInventory = inventory.filter((item) => {
    const q = search.toLowerCase().trim();
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
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header Section */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h2 className="font-bold text-slate-900 text-lg tracking-tight">
            Master Inventory Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock levels, SKU mappings, bin locations, and intake logs.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter inventory..."
              className="pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 w-48 text-slate-800"
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
                <th className="px-6 py-3.5 text-center">Stock Qty</th>
                <th className="px-6 py-3.5">Client Profile</th>
                <th className="px-6 py-3.5">Intake Agent</th>
                <th className="px-6 py-3.5 text-right">Intake Timestamp</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInventory.map((item: any) => {
                const isOutOfStock = item.quantity <= 0;
                const isLowStock = item.quantity > 0 && item.quantity <= 5;

                return (
                  <tr
                    key={item.inventoryId}
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
                        <span className="truncate max-w-[200px]">{item.productName}</span>
                      </div>
                    </td>

                    {/* Quantity with Badges */}
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${
                          isOutOfStock
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : isLowStock
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {item.quantity} units
                      </span>
                    </td>

                    {/* Client Details */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <div className="truncate max-w-[170px]">
                          <p className="font-semibold text-slate-800 text-xs truncate">
                            {item.clientName || "Unassigned"}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.clientEmail}
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