"use client";

import React, { useEffect, useState } from "react";
import { 
  Truck, Package, User, Calendar, RefreshCcw, Layers, Loader2, ArrowUpRight, Search, X, Clock, MapPin, CheckCircle2, AlertCircle, Check, Filter, UserCheck, ShieldCheck
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
      return "bg-purple-50 text-purple-700 border-purple-200/80 shadow-xs";
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
  const [clients, setClients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedClientFilter, setSelectedClientFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchShipmentsAndClients = async () => {
    try {
      setLoading(true);
      const [shipmentsRes, clientsRes] = await Promise.all([
        fetch("/api/users/dashboard/shipments", { credentials: "include" }),
        fetch("/api/users/dashboard/clients", { credentials: "include" })
      ]);

      const shipmentsData = await shipmentsRes.json();
      const clientsData = await clientsRes.json();

      if (shipmentsData.success) {
        setShipments(shipmentsData.data || []);
      }
      if (clientsData.success) {
        setClients(clientsData.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch shipments/clients:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipmentsAndClients();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch("/api/orders/shipping/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setShipments((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
              : order
          )
        );
      } else {
        alert(data.message || "Failed to update status.");
      }
    } catch (err) {
      console.error("Status update error:", err);
      alert("Network communication error.");
    } finally {
      setUpdatingId(null);
    }
  };

  const statuses = ["ALL", "PENDING", "APPROVED", "DISPATCHED", "DELIVERED", "CANCELLED"];

  const filteredShipments = shipments.filter((order) => {
    const query = searchQuery.toLowerCase().trim();
    
    const matchesStatus = selectedStatus === "ALL" || order.status === selectedStatus;
    const matchesClient = selectedClientFilter === "ALL" || order.clientId === selectedClientFilter || order.client?.id === selectedClientFilter;

    if (!matchesStatus || !matchesClient) return false;
    if (!query) return true;

    const matchesOrderMeta = 
      order.orderNumber?.toString().toLowerCase().includes(query) ||
      order.eventName?.toLowerCase().includes(query) ||
      order.client?.name?.toLowerCase().includes(query) ||
      order.client?.email?.toLowerCase().includes(query) ||
      order.client?.companyName?.toLowerCase().includes(query);

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
            Admin Shipment Management &amp; Dispatch Center
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Full management access: review orders across all clients, advance shipping workflows, and track recorded timestamps.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2 flex items-center gap-2.5 shadow-xs">
            <Layers className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-700">
              <strong className="text-blue-600">{shipments.length}</strong> Total Orders
            </span>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
        
        {/* Search and Client Filter */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full lg:w-auto flex-1">
          <div className="flex items-center bg-white border border-slate-200/80 rounded-xl px-3.5 py-2.5 w-full sm:w-80 shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
            <Search className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SKU, Order #, or Client..."
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

          {/* Client Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedClientFilter}
              onChange={(e) => setSelectedClientFilter(e.target.value)}
              className="w-full sm:w-auto bg-white border border-slate-200/80 text-slate-700 text-xs font-medium rounded-xl px-3.5 py-2.5 shadow-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">👤 All Clients &amp; Teams</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.email} ({c.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Pill Filters */}
        <div className="flex gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
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
        {filteredShipments.map((order) => {
          const isProcessing = updatingId === order.id;

          return (
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

                  {/* Client Subtitle with Role Pill */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1 font-medium text-slate-800">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      {order.client?.name || "Client"}
                    </span>
                    {order.client?.role && (
                      <span className={`px-2 py-0.2 rounded-md text-[10px] font-bold uppercase tracking-wider ${order.client.role === "CB" ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
                        {order.client.role}
                      </span>
                    )}
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

                {/* Status Badge & Actions */}
                <div className="flex items-center gap-2 flex-wrap">
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

              {/* DESTINATIONS & NOTES */}
              {(order.shipToAddress || order.returnAddress) && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {order.shipToAddress && (
                    <div className="space-y-0.5">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-blue-600" /> Destination Ship-To
                      </span>
                      <p className="text-slate-700 font-medium whitespace-pre-line">{order.shipToAddress}</p>
                    </div>
                  )}
                  {order.returnAddress && (
                    <div className="space-y-0.5">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" /> Return Anchor
                      </span>
                      <p className="text-slate-700 font-medium whitespace-pre-line">{order.returnAddress}</p>
                    </div>
                  )}
                </div>
              )}

              {/* DATE & TIME + ADMIN STATUS ADVANCEMENT ACTIONS */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs bg-slate-50/50 p-3 rounded-xl">
                
                {/* Delivery Target & Timestamp */}
                <div className="space-y-1">
                  <div className="flex items-center gap-4 flex-wrap text-[11px] text-slate-600">
                    <div className="flex items-center gap-1 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                      <span>Target Event Date:</span>
                      <strong className="text-slate-900">{formatDate(order.eventDate)}</strong>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500 font-medium">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Placed:</span>
                      <strong className="text-slate-700">{formatDateTime(order.createdAt)}</strong>
                    </div>
                  </div>

                  {order.updatedAt && order.updatedAt !== order.createdAt && (
                    <p className="text-[10px] text-slate-400">
                      Last status updated: {formatDateTime(order.updatedAt)} ({formatRelativeTime(order.updatedAt)})
                    </p>
                  )}
                </div>

                {/* Direct Admin Status Advancement Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {order.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(order.id, "APPROVED")}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Approve Order
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                        disabled={isProcessing}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {order.status === "APPROVED" && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, "DISPATCHED")}
                      disabled={isProcessing}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
                      Mark Dispatched
                    </button>
                  )}

                  {order.status === "DISPATCHED" && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, "DELIVERED")}
                      disabled={isProcessing}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Confirm Delivery
                    </button>
                  )}

                  {order.status === "DELIVERED" && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Fulfilled
                    </div>
                  )}

                  {order.status === "CANCELLED" && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, "PENDING")}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                    >
                      Re-open
                    </button>
                  )}
                </div>

              </div>

            </div>
          );
        })}

        {filteredShipments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200/80 text-center p-6 shadow-xs">
            <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
              <Search className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No shipments found</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              No orders matched your active client filter or search query.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}