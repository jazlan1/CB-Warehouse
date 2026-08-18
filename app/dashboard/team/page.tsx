"use client";

import React, { useState } from "react";
import {
  Package,
  Truck,
  Clock,
  FileText,
  Layers,
  LogOut,
  Loader2,
  Menu,
  X,
  RotateCcw,
} from "lucide-react";

import DashboardContentComponent from "@/src/app/team/DashboardContent";
import ShippingRequests from "@/src/app/team/ShippingRequests";
import IntakeSKU from "@/src/app/team/IntakeSKU";
import ReturnsAudits from "@/src/app/team/ReturnsAudits";
import Invoice from "@/src/app/team/Invoice";

interface DashboardContentProps {
  onNavigate?: (page: string) => void;
}

export default function TeamPage({ onNavigate }: DashboardContentProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("userData");
      localStorage.removeItem("userToken");
      await new Promise((r) => setTimeout(r, 400));
      window.location.href = "/auth/login";
    } catch (err) {
      console.error(err);
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { id: "dashboard", label: "Operations Overview", icon: Layers },
    { id: "intake", label: "Inventory Intake & SKUs", icon: Package },
    { id: "shipping", label: "Approve & Dispatch", icon: Truck },
    { id: "returns", label: "Returns & Audit Check", icon: RotateCcw },
    { id: "billing", label: "Billing Records", icon: FileText },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100 font-sans">

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-600 rounded-lg text-white">
            <Package className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm">CB Warehouse</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transform transition-transform duration-200 ease-in-out md:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        
        {/* TOP BRAND */}
        <div>
          <div className="h-20 flex items-center px-6 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 rounded-xl text-white shadow-xs">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">CB Warehouse</p>
                <p className="text-[10px] text-slate-400">Operations &amp; Logistics</p>
              </div>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button 
                key={id}
                onClick={() => {
                  setActivePage(id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activePage === id 
                    ? "bg-blue-600 text-white shadow-xs" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* USER LOGOUT */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <p className="text-white text-xs font-bold">CB Operations Team</p>
            <p className="text-[10px] text-slate-400">Warehouse Staff Access</p>
          </div>
          <button 
            onClick={handleLogout} 
            title="Sign Out"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
          >
            {isLoggingOut ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
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
      <main className="flex-1 md:ml-64 p-6 md:p-8 pt-20 md:pt-8 min-h-screen">
        {activePage === "dashboard" && (
          <DashboardContentComponent onNavigate={(targetPage) => setActivePage(targetPage)} />
        )}
        {activePage === "intake" && <IntakeSKU />}
        {activePage === "shipping" && <ShippingRequests />}
        {activePage === "returns" && <ReturnsAudits />}
        {activePage === "billing" && <Invoice />}
      </main>

    </div>
  );
}