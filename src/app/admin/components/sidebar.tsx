// components/admin/Sidebar.tsx

"use client";

import {
  LayoutDashboard,
  Users,
  Package,
  Truck,
  FileText,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export default function Sidebar({
  activePage,
  setActivePage,
}: SidebarProps) {
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "clients",
      label: "Clients",
      icon: Users,
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: Package,
    },
    {
      id: "shipments",
      label: "Shipments",
      icon: Truck,
    },
    {
      id: "reports",
      label: "Reports",
      icon: FileText,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      window.location.href = "/login";
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <aside className="w-72 bg-slate-900 text-white flex flex-col h-screen sticky top-0">

      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <Shield size={22} />
          </div>

          <div>
            <h1 className="font-bold text-lg">
              CB Core
            </h1>
            <p className="text-xs text-slate-400">
              Warehouse Admin
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <p className="text-xs uppercase text-slate-500 mb-3 px-3">
          Main Menu
        </p>

        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activePage === item.id
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}