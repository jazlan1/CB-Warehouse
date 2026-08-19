"use client";

import React, { useEffect, useState } from "react";
import { 
  Truck, Package, User, Calendar, RefreshCcw, Layers, Loader2, ArrowUpRight, 
  Search, X, Clock, MapPin, CheckCircle2, AlertCircle, Check, Filter, UserCheck, 
  ShieldCheck, Trash2, AlertTriangle
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

  // Delete modal state
  const [deletingOrder, setDeletingOrder] = useState<Shipment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteOrder = async () => {
    if (!deletingOrder) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/orders?id=${deletingOrder.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setShipments((prev) => prev.filter((o) => o.id !== deletingOrder.id));
        setDeletingOrder(null);
      } else {
        alert(data.message || "Failed to delete order.");
      }
    } catch (err) {
      console.error("Delete order error:", err);
      alert("Error deleting order.");
    } finally {
      setIsDeleting(false);
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
            Track, update status, dispatch packages, or manage orders across all client accounts.
          </p>
        </div>

        <button
          onClick={fetchShipmentsAndClients}
          className="flex items-center justify-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition px-4 py-2.5 rounded-xl cursor-pointer"
        >
          <RefreshCcw className="h-4 w-4" /> Refresh Ledger
        </button>
      </div>

      {/* Control Filters & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {statuses.map((status) => {
            const count = status === "ALL" 
              ? shipments.length 
              : shipments.filter(s => s.status === status).length;

            return (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  selectedStatus === status
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{status}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  selectedStatus === status ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Client Selector & Search */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Client Filter Dropdown */}
          <select
            value={selectedClientFilter}
            onChange={(e) => setSelectedClientFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer w-full sm:w-48"
          >
            <option value="ALL">👤 All Client Accounts</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.email}
              </option>
            ))}
          </select>

          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, event, SKU..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Shipment Records */}
      <div className="space-y-4">
        {filteredShipments.map((order) => {
          const isProcessing = updatingId === order.id;

          return (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition"
            >
              {/* ORDER HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                      #{order.orderNumber || order.id.slice(0, 8)}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base">
                      {order.eventName}
                    </h4>
                  </div>

                  {/* Client Badge */}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">{order.client?.name || "Client"}</span>
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
                  <button
                    onClick={() => setDeletingOrder(order)}
                    title="Delete Order Record"
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
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
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
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

      {/* ─── DELETE ORDER CONFIRMATION MODAL ─── */}
      {deletingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-2xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Delete Order Manifest</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to delete Order <strong className="text-slate-900 font-bold">#{deletingOrder.orderNumber || deletingOrder.id.slice(0, 8)}</strong> ({deletingOrder.eventName})? This will permanently remove the manifest record and its line item links.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingOrder(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteOrder}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Yes, Delete Order
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}