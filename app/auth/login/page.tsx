"use client";

import React, { useState } from 'react';
import { 
  Package, ShieldCheck, Mail, Lock, 
  ArrowRight, Users, Warehouse, AlertCircle
} from 'lucide-react';

export default function LoginPage() {
  const [role, setRole] = useState<'client' | 'warehouse'>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Admin / Staff Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Admin login failed.");
        return;
      }

      window.location.href = `/verify-otp/admin?email=${encodeURIComponent(email)}`;
    } catch (err) {
      setError("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // Client Login
  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid email or password.");
      } else {
        window.location.href = `/verify-otp?email=${encodeURIComponent(email)}`;
      }
    } catch (err) {
      setError("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (role === 'warehouse') {
      handleAdminLogin(e);
    } else {
      handleClientLogin(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      
      {/* LEFT SIDE */}
      <div className="md:w-1/2 bg-slate-900 text-white p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-600/20">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight block">CB Core</span>
            <span className="text-xs text-slate-400">Inventory & Fulfillment</span>
          </div>
        </div>

        <div className="my-auto py-12 relative z-10 max-w-md">
          <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-full uppercase tracking-wider">
            Enterprise Logistics
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mt-4 leading-tight">
            Centralized Asset Management Platform.
          </h1>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed">
            Streamlining inventory intake, 2-week event buffers, round-trip tracking, and automated fulfillment workflows for Experian teams.
          </p>
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>Real-time Zoho System Mapping Replacement</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>Instant Event Portal Requests & Cart Pulls</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 relative z-10">
          &copy; 2026 CB Logistics Ecosystem. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex-1 bg-white p-8 md:p-16 flex items-center justify-center">
        <div className="w-full max-w-sm space-y-8">
          
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-sm text-slate-500 mt-1.5">Sign in to manage your events or track assets.</p>
          </div>

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setRole('client');
                setError('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                role === 'client'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users className="h-4 w-4" />
              Experian Client
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('warehouse');
                setError('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                role === 'warehouse'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Warehouse className="h-4 w-4" />
              CB Warehouse / Admin
            </button>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Password
                </label>
                <a 
                  href="/reset-password" 
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer ${
                role === 'warehouse'
                  ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/10'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/10'
              }`}
            >
              {loading
                ? "Signing In..."
                : role === 'warehouse'
                  ? "Admin Panel Login"
                  : "Sign In to Dashboard"
              }
              {!loading && <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-500">
              Developed by{" "}
              <a
                href="https://cntlcv.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                CNTL C&amp;V
              </a>
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}