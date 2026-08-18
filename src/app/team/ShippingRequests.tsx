"use client";

import React, { useState, useEffect } from "react";
import { 
  Truck, CheckCircle2, XCircle, Package, Loader2, AlertCircle, MapPin, FileText, Hash, Calendar, Clock, User, ArrowRight, Check 
} from "lucide-react";
import { formatDateTime, formatDate, formatTime, formatRelativeTime } from "@/lib/date";

type RequestType = {
  id: string;
  orderNumber: number | string;
  eventName: string;
  status: "PENDING" | "APPROVED" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
  eventDate: string;
  shipToAddress: string;
  returnAddress: string;
  specialInstructions?: string | null;
  createdAt: string;
  updatedAt?: string;
  client?: {
    name?: string;
    email: string;
    companyName?: string;
  };
  items: {
    id: string;
    quantity: number;
    inventory: {
      id: string;
      name: string;
      sku: string;
      bin: string;
      condition: string;
      images: string[];
      client?: {
        name?: string;
        email: string;
        companyName?: string;
      } | null;
    };
  }[];
};

export default function ShippingRequests({ mode = "cb-approve" }: { mode?: string }) {
  const [requests, setRequests] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const res = await fetch("/api/orders"); 
        const json = await res.json();

        if (json.success) {
          setRequests(json.data || []);
        } else {
          throw new Error(json.message || "Failed to load orders.");
        }
      } catch (err: any) {
        console.error("Fetch orders error:", err);
        setError(err.message || "Something went wrong while loading data.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const updateStatus = async (id: string, databaseStatus: RequestType["status"]) => {
    setLoadingId(id);
    try {
      const response = await fetch("/api/orders/shipping/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: databaseStatus }),
      });

      const resJson = await response.json();

      if (resJson.success) {
        const nowIso = new Date().toISOString();
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: databaseStatus, updatedAt: nowIso } : r))
        );
      } else {
        alert(resJson.message || "Failed to update status.");
      }
    } catch (err) {
      console.error(err);
      alert("Network communication error.");
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusBadgeStyles = (status: RequestType["status"]) => {
    switch (status) {
      case "PENDING": return "bg-amber-50 text-amber-700 border-amber-200/80";
      case "APPROVED": return "bg-blue-50 text-blue-700 border-blue-200/80";
      case "DISPATCHED": return "bg-purple-50 text-purple-700 border-purple-200/80";
      case "DELIVERED": return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "CANCELLED": return "bg-rose-50 text-rose-700 border-rose-200/80";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const filteredRequests = selectedFilter === "ALL"
    ? requests
    : requests.filter((r) => r.status === selectedFilter);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading shipping requests queue...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-rose-50 border border-rose-100 rounded-2xl text-center max-w-lg mx-auto">
        <AlertCircle className="h-8 w-8 text-rose-600 mb-2" />
        <h4 className="text-sm font-bold text-slate-900">Failed to load shipping queue</h4>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
        >
          Retry Connection
        </button>
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
            Warehouse Dispatch &amp; Fulfillment Queue
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Review event allocations, update physical shipment statuses, and track fulfillment timestamps.
          </p>
        </div>
        
        {/* Status Tab Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "PENDING", "APPROVED", "DISPATCHED", "DELIVERED"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedFilter === st
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredRequests.map((req) => {
          const isProcessing = loadingId === req.id;

          return (
            <div
              key={req.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:border-slate-300 transition-all"
            >
              {/* Top Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-lg tracking-wide">
                      #{req.orderNumber || req.id.slice(0, 8)}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base">
                      {req.eventName}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      {req.client?.name || "Client"}
                    </span>
                    {req.client?.companyName && (
                      <>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600 font-medium">{req.client.companyName}</span>
                      </>
                    )}
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400">{req.client?.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadgeStyles(req.status)}`}>
                    {req.status}
                  </span>
                </div>
              </div>

              {/* Line Items Grid */}
              <div className="mt-4 space-y-2">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block pl-0.5">
                  Requested SKUs to Pull ({req.items?.length || 0})
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {req.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 bg-white border border-slate-200/70 text-slate-600 rounded-lg shrink-0 shadow-2xs">
                          <Package className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 text-xs truncate">
                            {item.inventory?.name || "Product"}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                            <span>SKU: <strong className="text-slate-600">{item.inventory?.sku || "N/A"}</strong></span>
                            <span>•</span>
                            <span>Bin: <strong className="text-slate-600">{item.inventory?.bin || "N/A"}</strong></span>
                            <span>•</span>
                            <span>Condition: <strong className="text-slate-600">{item.inventory?.condition || "Good"}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 font-bold text-xs bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-900 shadow-2xs">
                        Pull: {item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Destination & Instructions */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-blue-600" /> Ship-To Routing
                  </span>
                  <p className="text-slate-700 font-medium whitespace-pre-line">{req.shipToAddress}</p>
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" /> Return Anchor Address
                  </span>
                  <p className="text-slate-700 font-medium whitespace-pre-line">{req.returnAddress}</p>
                </div>
              </div>

              {/* PRECISE DATE & TIME BAR + WORKFLOW CONTROLLER ACTIONS */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Date & Time Badges */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-4 flex-wrap text-[11px] text-slate-600">
                    <div className="flex items-center gap-1 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                      <span>Target Event Date:</span>
                      <strong className="text-slate-900">{formatDate(req.eventDate)}</strong>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500 font-medium">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Submitted:</span>
                      <strong className="text-slate-700">{formatDateTime(req.createdAt)}</strong>
                    </div>
                  </div>

                  {req.updatedAt && (
                    <p className="text-[10px] text-slate-400 font-medium">
                      Last status updated: {formatDateTime(req.updatedAt)} ({formatRelativeTime(req.updatedAt)})
                    </p>
                  )}
                </div>

                {/* Status Advancement Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {req.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => updateStatus(req.id, "APPROVED")}
                        disabled={isProcessing}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Approve Order
                      </button>
                      <button
                        onClick={() => updateStatus(req.id, "CANCELLED")}
                        disabled={isProcessing}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition border border-rose-200/80 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {req.status === "APPROVED" && (
                    <button
                      onClick={() => updateStatus(req.id, "DISPATCHED")}
                      disabled={isProcessing}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Truck className="h-3.5 w-3.5" />}
                      Mark as Dispatched
                    </button>
                  )}

                  {req.status === "DISPATCHED" && (
                    <button
                      onClick={() => updateStatus(req.id, "DELIVERED")}
                      disabled={isProcessing}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      Confirm Delivery
                    </button>
                  )}

                  {req.status === "DELIVERED" && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Fulfilled &amp; Delivered
                    </div>
                  )}
                </div>

              </div>
            </div>
          );
        })}

        {filteredRequests.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200/80 text-center p-6 shadow-xs">
            <Package className="h-10 w-10 text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No requests in this queue</h4>
            <p className="text-xs text-slate-400 mt-1">There are no orders currently matching this status filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}