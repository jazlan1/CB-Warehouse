"use client";

import React, { useEffect, useState } from "react";
import {
  Package, Users, Shield, Truck, BarChart3, LogOut,
  PackageCheck, AlertTriangle, Clock, DollarSign,
  ArrowUpRight, ArrowDownRight, MapPin, ChevronRight,
  Bell, Search, Filter, Plus, Eye, CheckCircle2,
  XCircle, RefreshCw, Warehouse, Calendar, FileText,
  TrendingUp, Box, RotateCcw, Menu, X
} from "lucide-react";
import ClientsPanel from "@/src/app/admin/components/client";
import InventoryList from "@/src/app/admin/components/InventoryList";
import ShipmentsPanel from "@/src/app/admin/components/ShipmentsPanel";
import ReturnsAudits from "@/src/app/team/ReturnsAudits";
import Invoice from "@/src/app/team/Invoice";
import dynamic from "next/dynamic";

const Dash = dynamic(() => import("@/src/app/admin/components/dashboard"), {
  ssr: false,
});

type NavItem = { label: string; icon: React.ElementType; id: string };

const NAV: NavItem[] = [
  { label: "Dashboard", icon: BarChart3, id: "dashboard" },
  { label: "Inventory Ledger", icon: Package, id: "inventory" },
  { label: "Shipments & Orders", icon: Truck, id: "shipments" },
  { label: "Clients Directory", icon: Users, id: "clients" },
  { label: "Returns & Audits", icon: RotateCcw, id: "returns" },
  { label: "Billing & Reports", icon: FileText, id: "reports" },
];

export default function AdminDashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const renderContent = () => {
    switch (activeNav) {
      case "dashboard":
        return <Dash onNavigate={(page) => setActiveNav(page)} />;
      case "clients":
        return <ClientsPanel />;
      case "inventory":
      case "inventory-list":
        return <InventoryList />;
      case "shipments":
        return <ShipmentsPanel />;
      case "returns":
        return <ReturnsAudits />;
      case "reports":
        return <Invoice />;
      default:
        return (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
            {NAV.find(n => n.id === activeNav)?.label} Content Under Development
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-lg text-white">
            <Package className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm">CB Admin Center</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        
        {/* TOP BRAND & NAV */}
        <div>
          <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-xs">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">CB Core</p>
              <p className="text-[10px] text-slate-400 font-medium">Admin Control Center</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="px-3 py-4 space-y-1">
            {NAV.map(({ label, icon: Icon, id }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveNav(id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeNav === id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          {/* Locations quick ref */}
          <div className="mx-3 mt-2 p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Warehouse Hubs</p>
            <div className="space-y-2">
              <div className="flex gap-2 items-start">
                <MapPin className="h-3 w-3 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-300 leading-tight">1019 W Dallas St, Units 3048–3059, Houston TX 77019</p>
              </div>
              <div className="flex gap-2 items-start">
                <MapPin className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-300 leading-tight">9894 Bissonnet St, Ste 908, Houston TX 77036</p>
              </div>
            </div>
          </div>
        </div>

        {/* User + Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-xs">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name || "System Admin"}</p>
              <p className="text-[10px] text-slate-400 font-medium">{user?.role || "ADMIN"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs text-red-400 hover:text-white hover:bg-red-600/20 py-2 rounded-xl border border-red-500/20 transition-all font-semibold"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs"
        />
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 md:ml-64 min-h-screen pt-16 md:pt-0">
        <div className="p-6 md:p-8 space-y-6">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}