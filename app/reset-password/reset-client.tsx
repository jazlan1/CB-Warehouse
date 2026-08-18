"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
// dynamic icons ke liye lucide-react ka use kiya hai (optional, remove if not needed)
import { Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"; 

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();

  const email = searchParams.get("email");
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!password || !confirm) {
      setError("Please fill all fields");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
      } else {
        setMessage("Password reset successful. You can now login.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-300">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 ring-4 ring-blue-50/50">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Please enter your new password below.
          </p>
        </div>

        {/* Validation Error for Missing Link Parameters */}
        {!email || !token ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">Invalid Link</h3>
              <p className="text-xs text-red-600 mt-0.5">
                The password reset link is invalid or has expired. Please request a new one.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            
            {/* Password Input Group */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* Confirm Password Input Group */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-200"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            {/* Dynamic Status Messages */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2.5 text-red-700 text-sm animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2.5 text-emerald-700 text-sm animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-xl font-medium shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                "Reset Password"
              )}
            </button>

          </form>
        )}
      </div>
    </div>
  );
}