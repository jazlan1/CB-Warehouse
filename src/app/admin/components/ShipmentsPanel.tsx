"use client";

import React, { useEffect, useState } from "react";
import { 
  Truck, Package, User, Calendar, RefreshCcw, Layers, Loader2, ArrowUpRight, Search, X, Clock, MapPin, CheckCircle2, AlertCircle
} from "lucide-react";
import { formatDateTime, formatDate, formatTime, formatRelativeTime } from "@/lib/date";

type Shipment = any;

const getStatusBadge = (status: string) => {
  const s = status?.toUpperCase() || "";
  switch (s) {
    case "DELIVERED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-xs";
    case "DISPATCHED":
    case "IN TRANSIT":
      return "bg-indigo-50 text-indigo-700 border-indigo-200/80 shadow-xs";
    case "APPROVED":
      return "bg-blue-50 text-blue-700 border-blue-200/80 shadow-xs";
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200/80 shadow-xs";
    case "CANCELLED":
      return "bg-rose-50 text-rose-700 border-rose-200/80 shadow-xs";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

export default function ShipmentsPanel() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const res = await fetch("/api/users/dashboard/shipments", {
          credentials: "include",
        });

        const data = await res.json();

        if (data.success) {
          setShipments(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch shipments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();
  }, []);

  const statuses = ["ALL", "PENDING", "APPROVED", "DISPATCHED", "DELIVERED", "CANCELLED"];

  const filteredShipments = shipments.filter((order) => {
    const query = searchQuery.toLowerCase().trim();
    
    const matchesStatus = selectedStatus === "ALL" || order.status === selectedStatus;

    if (!matchesStatus) return false;
    if (!query) return true;

    const matchesOrderMeta = 
      order.orderNumber?.toString().toLowerCase().includes(query) ||
      order.eventName?.toLowerCase().includes(query) ||
      order.client?.name?.toLowerCase().includes(query) ||
      order.client?.email?.toLowerCase().includes(query);

    const matchesProducts = order.items?.some((item: any) => 
      item.inventory?.name?.toLowerCase().includes(query) ||
      item.inventory?.sku?.toLowerCase().includes(query)
    );

    return matchesOrderMeta || matchesProducts;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading shipment manifests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-xs">
              <Truck className="h-5 w-5" />
            </div>
            Shipment Manifests &amp; Tracking
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tracking of outbound orders, timestamps, client destinations, and return logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2 flex items-center gap-2.5 shadow-xs">
            <Layers className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">
              <strong className="text-blue-600">{shipments.length}</strong> Total Shipments
            </span>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center bg-white border border-slate-200/80 rounded-xl px-3.5 py-2.5 w-full md:w-96 shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
          <Search className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SKU, Product, Order #, or Client..."
            className="text-xs bg-transparent outline-none w-full text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Pill Filters */}
        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedStatus === status
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Shipments List */}
      <div className="space-y-4">
        {filteredShipments.map((order) => (
          <div 
            key={order.id} 
            className="group relative bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200"
          >
            {/* ORDER HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-lg tracking-wide">
                    #{order.orderNumber || order.id.slice(0, 8)}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition flex items-center gap-1.5">
                    {order.eventName}
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-blue-500 transition-all" />
                  </h4>
                </div>

                {/* Client Subtitle */}
                <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    {order.client?.name || "Client"}
                  </span>
                  {order.client?.companyName && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600 font-medium">{order.client.companyName}</span>
                    </>
                  )}
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-400">{order.client?.email}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="self-start sm:self-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadge(order.status)}`}>
                  {order.status || "PENDING"}
                </span>
              </div>
            </div>

            {/* LINE ITEMS */}
            <div className="mt-4 space-y-2">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block pl-0.5">
                Manifest Components ({order.items?.length || 0})
              </span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {order.items?.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/60 p-3 rounded-xl transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 bg-white border border-slate-200/70 text-slate-600 rounded-lg shrink-0 shadow-2xs">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-xs truncate">
                          {item.inventory?.name || "Inventory Item"}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                          <span>SKU: <strong className="text-slate-600">{item.inventory?.sku || "N/A"}</strong></span>
                          <span>•</span>
                          <span>Bin: <strong className="text-slate-600">{item.inventory?.bin || "N/A"}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 font-bold text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-900 shadow-2xs">
                      Qty: {item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PRECISE DATE & TIME METADATA FOOTER */}
            <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs bg-slate-50/50 p-3 rounded-xl">
              
              {/* Delivery Target & Returns */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  <span>Target Event Date:</span>
                  <strong className="text-slate-900">{formatDate(order.eventDate)}</strong>
                </div>

                {order.returns?.length > 0 && (
                  <div className="inline-flex items-center gap-1 font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70 text-[11px]">
                    <RefreshCcw className="h-3 w-3" />
                    <span>{order.returns.length} Return Log(s)</span>
                  </div>
                )}
              </div>

              {/* Exact Recorded Date and Time */}
              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium flex-wrap">
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Placed:</span>
                  <strong className="text-slate-700">{formatDateTime(order.createdAt)}</strong>
                </div>

                {order.updatedAt && order.updatedAt !== order.createdAt && (
                  <div className="flex items-center gap-1 text-slate-400">
                    <span>(Updated {formatRelativeTime(order.updatedAt)})</span>
                  </div>
                )}
              </div>

            </div>

          </div>
        ))}

        {filteredShipments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200/80 text-center p-6 shadow-xs">
            <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
              <Search className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No shipments found</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              No orders matched your active search query or filter selection. Try adjusting your parameters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}