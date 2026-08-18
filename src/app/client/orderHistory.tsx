"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  AlertCircle,
  FileText,
  ArrowRight
} from "lucide-react";
import { formatDateTime, formatDate, formatTime, formatRelativeTime } from "@/lib/date";

interface OrderItem {
  id: string;
  quantity: number;
  inventory: {
    name: string;
    sku: string;
  };
}

interface Order {
  id: string;
  orderNumber?: number | string;
  eventName: string;
  eventDate: string;
  shipToAddress: string;
  returnAddress: string;
  specialInstructions: string | null;
  status: "PENDING" | "APPROVED" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
}

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMyOrders() {
      try {
        setLoading(true);
        const res = await fetch("/api/orders/my-orders");
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to fetch orders.");
        }
        setOrders(json.data || []);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }
    fetchMyOrders();
  }, []);

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusBadge = (status: Order["status"]) => {
    const styles = {
      PENDING: "bg-amber-50 text-amber-700 border-amber-200/80 shadow-2xs",
      APPROVED: "bg-blue-50 text-blue-700 border-blue-200/80 shadow-2xs",
      DISPATCHED: "bg-purple-50 text-purple-700 border-purple-200/80 shadow-2xs",
      DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs",
      CANCELLED: "bg-rose-50 text-rose-700 border-rose-200/80 shadow-2xs",
    };

    const icons = {
      PENDING: <Clock className="h-3.5 w-3.5" />,
      APPROVED: <CheckCircle2 className="h-3.5 w-3.5" />,
      DISPATCHED: <Truck className="h-3.5 w-3.5" />,
      DELIVERED: <CheckCircle2 className="h-3.5 w-3.5" />,
      CANCELLED: <XCircle className="h-3.5 w-3.5" />,
    };

    return (
      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500 font-medium">Loading your event manifests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 p-6 bg-rose-50 rounded-2xl border border-rose-100 max-w-xl mx-auto">
        <AlertCircle className="h-8 w-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-900">Failed to load orders</h3>
        <p className="text-xs text-slate-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {orders.length === 0 ? (
        <div className="bg-white text-center py-20 border border-slate-200/80 rounded-2xl text-slate-400">
          <Package className="h-12 w-12 mx-auto text-slate-300 stroke-1 mb-3" />
          <p className="text-sm font-medium">You haven't submitted any event orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {orders.map((order) => {
            const isExpanded = expandedOrder === order.id;
            const totalItemsCount = order.items?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;

            return (
              <div 
                key={order.id} 
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs hover:border-slate-300 transition-all"
              >
                {/* ORDER ROW CARD HEADER */}
                <div 
                  onClick={() => toggleOrderExpand(order.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none bg-white hover:bg-slate-50/60 transition"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {order.orderNumber && (
                        <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-lg tracking-wide">
                          #{order.orderNumber}
                        </span>
                      )}
                      <h3 className="font-bold text-slate-900 text-base truncate">{order.eventName}</h3>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-indigo-600" /> 
                        Event Target: <strong className="text-slate-800">{formatDate(order.eventDate)}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        Submitted: <strong className="text-slate-700">{formatDateTime(order.createdAt)}</strong>
                      </span>
                      <span>•</span>
                      <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                        {totalItemsCount} Total Items
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0">
                    {order.updatedAt && order.updatedAt !== order.createdAt && (
                      <span className="text-[10px] text-slate-400 font-medium hidden md:inline">
                        Updated {formatRelativeTime(order.updatedAt)}
                      </span>
                    )}
                    <div className="p-1 rounded-lg bg-slate-50 text-slate-500">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>

                {/* EXPANDED AREA DETAILS */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-5 md:p-6 space-y-5 text-xs">
                    
                    {/* ADDRESSES ROUTING GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-slate-200/70 space-y-1.5 shadow-2xs">
                        <h4 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-slate-400">
                          <MapPin className="h-3.5 w-3.5 text-indigo-600" /> Destination / Ship-To Address
                        </h4>
                        <p className="text-slate-800 font-medium leading-relaxed whitespace-pre-line">{order.shipToAddress}</p>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200/70 space-y-1.5 shadow-2xs">
                        <h4 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-slate-400">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" /> Return Labels Anchor
                        </h4>
                        <p className="text-slate-800 font-medium leading-relaxed whitespace-pre-line">{order.returnAddress}</p>
                      </div>
                    </div>

                    {/* SPECIAL HANDLING INSTRUCTIONS */}
                    {order.specialInstructions && (
                      <div className="bg-amber-50 border border-amber-200/70 p-3.5 rounded-xl space-y-1">
                        <h4 className="font-bold text-amber-800 flex items-center gap-1 uppercase text-[10px] tracking-wider">
                          <FileText className="h-3.5 w-3.5" /> Special Handling Notes
                        </h4>
                        <p className="text-amber-900 leading-relaxed font-medium">{order.specialInstructions}</p>
                      </div>
                    )}

                    {/* ITEMS MANIFEST TABLE */}
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-500 uppercase text-[10px] tracking-wider px-1">Allocated Inventory Items</h4>
                      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                              <th className="p-3.5">Component / Product</th>
                              <th className="p-3.5">SKU</th>
                              <th className="p-3.5 text-right">Quantity</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                            {order.items?.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/40">
                                <td className="p-3.5 text-slate-900 font-semibold">{item.inventory?.name || "Product"}</td>
                                <td className="p-3.5 font-mono text-slate-500">{item.inventory?.sku || "N/A"}</td>
                                <td className="p-3.5 text-right font-black text-slate-900">{item.quantity}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* TIMESTAMP SUMMARY FOOTER */}
                    <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Order UID: <code className="font-mono text-slate-600">{order.id}</code></span>
                      <span>Recorded on: {formatDateTime(order.createdAt)}</span>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}