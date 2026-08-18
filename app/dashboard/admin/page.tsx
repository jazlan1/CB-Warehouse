"use client";

import React, { useEffect, useState } from "react";
import {
  Package, Users, Shield, Truck, BarChart3, LogOut,
  PackageCheck, AlertTriangle, Clock, DollarSign,
  ArrowUpRight, ArrowDownRight, MapPin, ChevronRight,
  Bell, Search, Filter, Plus, Eye, CheckCircle2,
  XCircle, RefreshCw, Warehouse, Calendar, FileText,
  TrendingUp, Box, RotateCcw, Menu, X, PlusCircle
} from "lucide-react";
import ClientsPanel from "@/src/app/admin/components/client";
import InventoryList from "@/src/app/admin/components/InventoryList";
import ShipmentsPanel from "@/src/app/admin/components/ShipmentsPanel";
import ReturnsAudits from "@/src/app/team/ReturnsAudits";
import Invoice from "@/src/app/team/Invoice";
import IntakeSKU from "@/src/app/team/IntakeSKU";
import dynamic from "next/dynamic";

const Dash = dynamic(() => import("@/src/app/admin/components/dashboard"), {
  ssr: false,
});

type NavItem = { label: string; icon: React.ElementType; id: string };

const NAV: NavItem[] = [
  { label: "Dashboard", icon: BarChart3, id: "dashboard" },
  { label: "Inventory Ledger", icon: Package, id: "inventory" },
  { label: "Add / Intake Stock", icon: PlusCircle, id: "intake" },
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
      case "intake":
        return <IntakeSKU />;
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
                <p className="text-[10px] text-slate-300 leading-tight">4848 North Loop E Fwy, Houston TX 77028</p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM USER & LOGOUT */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                AD
              </div>
              <div>
                <p className="text-xs font-bold text-white">Administrator</p>
                <p className="text-[10px] text-slate-400">Full System Control</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* BACKDROP FOR MOBILE */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen pt-14 md:pt-0">
        
        {/* TOP BAR */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-800 capitalize">
              {NAV.find(n => n.id === activeNav)?.label || "Admin Console"}
            </h1>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-500 font-medium">Enterprise Management</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Hostinger Cluster
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-slate-200 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* VIEW CONTAINER */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          {renderContent()}
        </div>

      </main>
    </div>
  );
}