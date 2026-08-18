"use client";

import React, { useEffect, useState } from "react";
import {
  Users, Search, Mail, Phone, Truck, Calendar, Eye, Plus, X, Building2, Loader2, ShieldCheck, UserCheck, Clock
} from "lucide-react";
import AddClient from "./addClient";
import { formatDateTime, formatDate, formatTime } from "@/lib/date";

type Client = {
  id: string;
  name: string | null;
  email: string;
  phone?: string;
  companyName?: string;
  role: "CLIENT" | "CB";
  createdAt: string;
};

const initials = (name: string | null) =>
  (name || "NA")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

export default function ClientsPanel() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/users/dashboard/clients", {
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setClients(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.companyName?.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ─── Header Section ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-xs">
              <Users className="h-5 w-5" />
            </div>
            Clients &amp; Team Directory
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Manage your authenticated network of <strong className="text-slate-800">{clients.length} accounts</strong> (Experian Clients &amp; CB Logistics Team)
          </p>
        </div>

        <button
          onClick={() => setShowAddClient(true)}
          className="flex items-center justify-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition px-4 py-2.5 rounded-xl shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Provision New Client
        </button>

        {showAddClient && (
          <AddClient 
            onClose={() => setShowAddClient(false)} 
            onSuccess={() => {
              setShowAddClient(false);
              fetchClients();
            }} 
          />
        )}
      </div>

      {/* ─── Action Bar (Search) ─── */}
      <div className="flex items-center bg-white border border-slate-200/80 rounded-xl px-3.5 py-2.5 w-full max-w-sm shadow-xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
        <Search className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, company, or ID..."
          className="text-xs bg-transparent outline-none w-full text-slate-800 placeholder:text-slate-400"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ─── Main Content / Table Area ─── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-500">Fetching directory records...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 font-bold text-[10px] tracking-wider uppercase">
                  <th className="px-6 py-3.5 text-left">Account Profile</th>
                  <th className="px-6 py-3.5 text-left">Email Address</th>
                  <th className="px-6 py-3.5 text-left">Role Permissions</th>
                  <th className="px-6 py-3.5 text-left">Registration Timestamp</th>
                  <th className="px-6 py-3.5 text-right">View</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/60 transition cursor-pointer group"
                    onClick={() => setSelectedClient(c)}
                  >
                    {/* Profile & Name */}
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold text-xs border border-blue-200/60 shadow-2xs">
                          {initials(c.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition">
                            {c.name || "Unnamed Client"}
                          </p>
                          {c.companyName && (
                            <p className="text-[10px] text-slate-400 font-medium">{c.companyName}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-3.5">
                      <span className="text-slate-600 font-medium">
                        {c.email}
                      </span>
                    </td>

                    {/* Dynamic Role Badges */}
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                          c.role === "CB"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {c.role === "CB" ? <ShieldCheck className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                        {c.role}
                      </span>
                    </td>

                    {/* Joined Date & Time */}
                    <td className="px-6 py-3.5 text-slate-500 font-medium">
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-800">{formatDate(c.createdAt)}</p>
                        <p className="text-[10px] text-slate-400">{formatTime(c.createdAt)}</p>
                      </div>
                    </td>

                    {/* Action Icon */}
                    <td className="px-6 py-3.5 text-right">
                      <div className="inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50 group-hover:border-blue-200 transition">
                        <Eye className="h-3.5 w-3.5" />
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Empty State */}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-16 px-4">
                      <div className="max-w-xs mx-auto flex flex-col items-center">
                        <div className="h-10 w-10 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 mb-3">
                          <Search className="h-5 w-5" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">No client records found</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          No registered accounts match "{search}".
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Premium Side Drawer Modal ─── */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop Overlay */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setSelectedClient(null)}
          />

          {/* Drawer Sheet */}
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l border-slate-200">
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Account Details</span>
              <button 
                onClick={() => setSelectedClient(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              
              {/* Profile Card */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-xs">
                  {initials(selectedClient.name)}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{selectedClient.name || "No Name"}</h4>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">UID: {selectedClient.id}</p>
                </div>
              </div>

              {/* Information Cards */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Authentication &amp; Profile</h5>
                
                {/* Email Box */}
                <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-500"><Mail className="h-4 w-4" /></div>
                  <div className="flex flex-col"><span className="text-slate-400 text-[10px] font-medium">Email Address</span><span className="text-xs font-semibold text-slate-800">{selectedClient.email}</span></div>
                </div>

                {/* Role Box */}
                <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                    {selectedClient.role === "CB" ? <ShieldCheck className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  </div>
                  <div className="flex flex-col"><span className="text-slate-400 text-[10px] font-medium">Assigned Role</span><span className="text-xs font-semibold text-slate-800">{selectedClient.role === "CB" ? "CB Warehouse Team" : "Experian Client"}</span></div>
                </div>

                {/* Account Created Box */}
                <div className="flex items-center gap-3 p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-500"><Calendar className="h-4 w-4" /></div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] font-medium">Registration Date &amp; Time</span>
                    <span className="text-xs font-semibold text-slate-800">
                      {formatDateTime(selectedClient.createdAt)}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer Action Inside Drawer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
              <button 
                onClick={() => setSelectedClient(null)} 
                className="w-full text-center py-2.5 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition shadow-xs cursor-pointer"
              >
                Dismiss Details
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}