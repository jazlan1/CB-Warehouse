"use client";

import React, { useEffect, useState } from "react";
import {
  Package,
  Truck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Activity,
  ArrowUpRight,
  ClipboardList,
  RefreshCw,
} from "lucide-react";
import { formatDateTime, formatDate, formatTime } from "@/lib/date";

type DashboardContentProps = {
  onNavigate: (targetPage: string) => void;
};

export default function DashboardPage({ onNavigate }: DashboardContentProps) {
  const [stats, setStats] = useState({
    totalItems: 0,
    pendingOrders: 0,
    activeReturns: 0,
    issues: 0,
  });

  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH DASHBOARD STATS
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/inventory/dashboard/stats", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (err) {
        console.error("Stats fetch error:", err);
      }
    };
    fetchStats();
  }, []);

  // FETCH ACTIVITIES
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const res = await fetch("/api/inventory/dashboard/activity", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setActivities(data.data);
        }
      } catch (err) {
        console.error("Activities fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const quickActions = [
    {
      label: "View Shipping Requests Queue",
      tab: "shipping",
      badge: stats.pendingOrders,
      icon: Truck,
      bgIcon: "bg-blue-50 text-blue-600 border-blue-100",
    },
    {
      label: "Log New Inventory Intake SKU",
      tab: "intake",
      badge: null,
      icon: ClipboardList,
      bgIcon: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      label: "Audit Reverse Logistics & Returns",
      tab: "returns",
      badge: stats.activeReturns,
      icon: RefreshCw,
      bgIcon: "bg-amber-50 text-amber-600 border-amber-100",
    },
  ];

  const getActivityIcon = (activity: any) => {
    if (activity.type === "ORDER") {
      switch (activity.status) {
        case "APPROVED":
          return (
            <div className="p-1.5 bg-green-50 rounded-lg text-green-600 border border-green-100">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          );
        case "PENDING":
          return (
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
              <Clock className="h-4 w-4" />
            </div>
          );
        default:
          return (
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
              <Truck className="h-4 w-4" />
            </div>
          );
      }
    }
    return (
      <div className="p-1.5 bg-slate-50 rounded-lg text-slate-600 border border-slate-100">
        <Activity className="h-4 w-4" />
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col gap-1 border-b border-slate-200/80 pb-5">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          CB Warehouse Operations Overview
        </h1>
        <p className="text-xs font-medium text-slate-500">
          Real-time physical asset storage, active dispatch pipelines, and reverse intake metrics.
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: "Total Items", value: stats.totalItems, icon: Package, color: "text-blue-600", bg: "bg-blue-50", border: "border-slate-200/80" },
          { title: "Pending Shipments", value: stats.pendingOrders, icon: Truck, color: "text-amber-600", bg: "bg-amber-50", border: "border-slate-200/80" },
          { title: "Active Returns", value: stats.activeReturns, icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-slate-200/80" },
          { title: "Issues / Alerts", value: stats.issues, icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50", border: "border-slate-200/80" }
        ].map((item, i) => (
          <div
            key={i}
            className={`bg-white p-6 rounded-2xl border ${item.border} shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 flex items-center justify-between group`}
          >
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">{item.title}</p>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{item.value.toLocaleString()}</p>
            </div>
            <div className={`p-3.5 rounded-xl ${item.bg} ${item.color} transition-transform duration-200 group-hover:scale-105`}>
              <item.icon className="h-6 w-6" />
            </div>
          </div>
        ))}
      </div>

      {/* MIDDLE SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* QUICK ACTIONS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-4 tracking-tight">
              Operational Actions
            </h2>
            <div className="space-y-3">
              {quickActions.map((action) => {
                const ActionIcon = action.icon;
                
                return (
                  <button
                    key={action.tab}
                    onClick={() => onNavigate(action.tab)}
                    className="w-full flex items-center justify-between text-left px-4 py-3.5 bg-slate-50 hover:bg-slate-900 text-slate-700 hover:text-white font-semibold text-xs rounded-xl transition-all duration-200 group border border-slate-200/70 hover:border-transparent cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg border bg-white text-slate-700 group-hover:bg-white/10 group-hover:border-transparent group-hover:text-white transition-colors">
                        <ActionIcon className="h-4 w-4" />
                      </div>
                      <span>{action.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {action.badge !== null && action.badge > 0 && (
                        <span className="text-xs px-2.5 py-0.5 bg-blue-100 text-blue-800 group-hover:bg-white/20 group-hover:text-white font-bold rounded-md transition-colors">
                          {action.badge}
                        </span>
                      )}
                      <ArrowUpRight className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-all transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <h2 className="text-base font-bold text-slate-900 mb-4 tracking-tight">
            Live Activity Feed
          </h2>

          {loading ? (
            <div className="space-y-3 animate-pulse flex-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-slate-400 text-xs py-10 text-center">No recent activity logs recorded.</p>
          ) : (
            <div className="flow-root flex-1">
              <ul className="space-y-3">
                {activities.map((activity, i) => (
                  <li key={activity.id || i} className="flex gap-3.5 items-start bg-slate-50/70 hover:bg-slate-50 p-3 rounded-xl border border-slate-200/60 transition-colors">
                    {getActivityIcon(activity)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 capitalize">
                        {activity.text}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 tracking-wide">
                        {activity.subText}
                      </p>
                    </div>
                    <div className="text-right whitespace-nowrap text-[10px] text-slate-400 font-medium">
                      <p>{formatTime(activity.date)}</p>
                      <p className="font-bold text-slate-500 uppercase">{formatDate(activity.date)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}