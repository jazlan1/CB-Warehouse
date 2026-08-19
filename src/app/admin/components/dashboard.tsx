"use client";

import React, { useEffect, useState } from "react";
import {
  Package, Truck, Clock, DollarSign, ArrowUpRight, 
  AlertTriangle, MapPin, ChevronRight, RefreshCw, 
  Box, RotateCcw, FileText, Plus, Eye, CheckCircle2, Search,
  Edit3, Trash2, Users, Layers, Sparkles
} from "lucide-react";
import { formatDateTime, formatDate, formatTime, formatRelativeTime } from "@/lib/date";

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function AdminDashboardContent({ onNavigate }: DashboardProps) {
  const [localSearch, setLocalSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalItems: 0,
    activeShipments: 0,
    pendingRequests: 0,
    monthlyRevenue: "$0",
  });
  const [shipments, setShipments] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/users/dashboard/admin-data", { 
          method: "GET",
          credentials: "include"
        });
        
        const json = await res.json();
        
        if (json.success && json.data) {
          setStats(json.data.stats);
          setShipments(json.data.shipments || []);
          setActivities(json.data.activities || []);
          setInventory(json.data.inventory || []);
        }
      } catch (err) {
        console.error("Failed to sync warehouse data matrices:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const filteredShipments = shipments.filter(s => {
    const query = localSearch.toLowerCase().trim();
    if (!query) return true;
    
    const orderNumStr = s.orderNumber !== undefined && s.orderNumber !== null ? String(s.orderNumber) : "";
    const clientStr = s.client || "";
    const eventStr = s.event || "";

    return (
      orderNumStr.toLowerCase().includes(query) ||
      clientStr.toLowerCase().includes(query) ||
      eventStr.toLowerCase().includes(query)
    );
  });

  const statusStyles: Record<string, string> = {
    APPROVED: "bg-blue-50 text-blue-700 border-blue-200/80",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200/80",
    DISPATCHED: "bg-purple-50 text-purple-700 border-purple-200/80",
    DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200/80",
  };

  const activityIcon: Record<string, { icon: React.ElementType; color: string }> = {
    request: { icon: FileText, color: "text-blue-500 bg-blue-50" },
    intake: { icon: Box, color: "text-emerald-500 bg-emerald-50" },
    pull: { icon: Truck, color: "text-violet-500 bg-violet-50" },
    return: { icon: RotateCcw, color: "text-amber-500 bg-amber-50" },
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-xs font-bold tracking-wider text-slate-400 uppercase">
          Loading live operational metrics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ── STATS CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { title: "Total Inventory Items", value: stats.totalItems, change: "In warehouse stock", up: true, icon: Box, bg: "bg-blue-50 text-blue-600 border-blue-100", target: "inventory" },
          { title: "Active Shipments", value: stats.activeShipments, change: "In active workflow", up: true, icon: Truck, bg: "bg-emerald-50 text-emerald-600 border-emerald-100", target: "shipments" },
          { title: "Pending Requests", value: stats.pendingRequests, change: "Requires review", up: false, icon: Clock, bg: "bg-amber-50 text-amber-600 border-amber-100", target: "shipments" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div 
              key={i} 
              onClick={() => onNavigate(s.target)}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-500 group-hover:text-blue-600 transition">{s.title}</p>
                <div className={`p-2.5 rounded-xl border ${s.bg}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {typeof s.value === "number" ? s.value.toLocaleString() : s.value}
              </p>
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${s.up ? "text-emerald-600" : "text-amber-600"}`}>
                {s.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                {s.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 2-WEEK ADVANCE NOTICE BANNER ── */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3.5">
        <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-amber-900">2-Week Advance Notice Policy Active</p>
          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
            All logistics shipping requests require <strong>minimum 14 days lead time</strong> prior to event dates. Rush requests under 14 days incur automatic rush processing protocols.
          </p>
        </div>
      </div>

      {/* ── ACTIVE SHIPMENTS QUEUE & LOGS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Active Shipments Queue */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <Truck className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Active Shipments Queue</h3>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                placeholder="Filter orders..."
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 w-36 text-slate-900"
              />
              <button 
                onClick={() => onNavigate("shipments")} 
                className="flex items-center gap-1 text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-xl transition font-semibold shadow-2xs cursor-pointer"
              >
                Manage &rarr;
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 bg-slate-50/70 border-b border-slate-100 text-[10px] uppercase font-bold tracking-wider">
                  <th className="px-5 py-3">Order ID / Client</th>
                  <th className="px-3 py-3">Target Event</th>
                  <th className="px-3 py-3">Event Date</th>
                  <th className="px-3 py-3">Creation Time</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredShipments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">No active shipments matching parameters.</td>
                  </tr>
                ) : (
                  filteredShipments.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">#{row.orderNumber || (row.id && row.id.substring(0, 8)) || "N/A"}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5 font-medium">{row.client}</p>
                      </td>
                      <td className="px-3 py-3.5 text-slate-800 font-medium truncate max-w-[160px]">{row.event}</td>
                      <td className="px-3 py-3.5 text-slate-700 font-semibold">
                        {row.shipDate ? formatDate(row.shipDate) : "N/A"}
                      </td>
                      <td className="px-3 py-3.5 text-slate-500 font-medium text-[11px]">
                        {row.createdAt ? formatDateTime(row.createdAt) : "Recorded"}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusStyles[row.status] || "bg-slate-100 text-slate-700"}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <button 
                          onClick={() => onNavigate("shipments")} 
                          title="View & Edit Shipment"
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 border border-slate-200 transition cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Logs Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg">
                <RefreshCw className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Activity Logs</h3>
            </div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Live Feed</span>
          </div>

          <div className="p-3 space-y-1 flex-1 overflow-y-auto max-h-[350px]">
            {activities.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-12 font-medium">No recent activity logs recorded.</p>
            ) : (
              activities.map((a, i) => {
                const config = activityIcon[a.type] || { icon: FileText, color: "text-slate-500 bg-slate-50" };
                const AIcon = config.icon;
                return (
                  <div key={a.id || i} className="flex gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-all">
                    <div className={`p-1.5 rounded-lg shrink-0 h-8 w-8 flex items-center justify-center ${config.color}`}>
                      <AIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 leading-snug">
                        {a.action || "Activity logged"}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-1 text-[10px] text-slate-400">
                        <span className="truncate">{a.user || "System"}</span>
                        <span className="font-medium shrink-0">{a.time || "Recently"}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}