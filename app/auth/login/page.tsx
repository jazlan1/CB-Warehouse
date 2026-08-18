// app/login/page.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Package, ShieldCheck, Lock, Mail, ArrowRight, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const [role, setRole] = useState<'client' | 'warehouse'>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpPopup, setOtpPopup] = useState<string | null>(null);

  // ✅ Admin ke liye alag handler
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

      if (data.debugOtp) {
        alert(`🔑 Your Admin OTP is: ${data.debugOtp}`);
      }

      const otpParam = data.debugOtp ? `&otp=${encodeURIComponent(data.debugOtp)}` : '';
      window.location.href = `/verify-otp/admin?email=${encodeURIComponent(email)}${otpParam}`;
    } catch (err) {
      setError("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Client ke liye alag handler
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
        if (data.debugOtp) {
          alert(`🔑 Your Client Login OTP is: ${data.debugOtp}`);
        }
        const otpParam = data.debugOtp ? `&otp=${encodeURIComponent(data.debugOtp)}` : '';
        window.location.href = `/verify-otp?email=${encodeURIComponent(email)}${otpParam}`;
      }
    } catch (err) {
      setError("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Role ke hisaab se sahi handler choose karo
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

          {/* ROLE TABS */}
          <div className="p-1 bg-slate-100 border border-slate-200/60 rounded-xl flex">
            <button
              type="button"
              onClick={() => { setRole('client'); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                role === 'client' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Experian Client
            </button>
            <button
              type="button"
              onClick={() => { setRole('warehouse'); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                role === 'warehouse' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              CB Warehouse / Admin
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Username / Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'client' ? 'client@warehouse.com' : 'admin@warehouse.com'} 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 block">Password</label>
                <button
                  type="button"
                  onClick={async () => {
                    if (!email) {
                      alert("Please enter your email first");
                      return;
                    }
                    await fetch("/api/auth/forgot-password", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email }),
                    });
                    alert("Reset link sent to email");
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input 
                id="remember-me" 
                type="checkbox" 
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded-md accent-blue-600"
              />
              <label htmlFor="remember-me" className="ml-2 text-xs text-slate-600 font-medium cursor-pointer select-none">
                Keep me logged in
              </label>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 text-white rounded-xl text-sm font-semibold shadow-sm flex items-center justify-center gap-2 group transition-all mt-2 disabled:opacity-50 ${
                role === 'warehouse'
                  ? 'bg-slate-800 hover:bg-slate-900 shadow-slate-800/10'
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

          {/* Quick Demo Help */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl mt-4 space-y-1.5 text-xs text-slate-700">
            <p className="font-semibold text-blue-900 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              Demo Credentials:
            </p>
            <div className="text-[11px] text-slate-600 space-y-1">
              <div>• <b>Admin:</b> <code>admin@warehouse.com</code> / <code>Admin@12345</code></div>
              <div>• <b>CB Team:</b> <code>cb@warehouse.com</code> / <code>Team@12345</code></div>
              <div>• <b>Client:</b> <code>client@warehouse.com</code> / <code>Client@12345</code></div>
            </div>
          </div>

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