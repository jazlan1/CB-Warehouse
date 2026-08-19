"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, Mail, ArrowRight, Lock } from "lucide-react";

export default function VerifyOtpAdminClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid OTP code. Please verify and try again.");
        return;
      }

      router.push(data.redirect || "/dashboard/admin");
    } catch (err) {
      setError("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 px-4 relative text-slate-100">
      <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-100 p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Administrative Access
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Enter the 6-digit administrative OTP sent to
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-700 mt-2 max-w-full truncate">
            <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{email || "admin email address"}</span>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 text-center">
              Administrative OTP Code
            </label>

            <div className="relative">
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-full text-center tracking-[0.6em] text-2xl font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl py-3.5 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-inner"
              />
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Sent securely via <span className="font-medium text-slate-600">noreply@codeblkwarehouse.com</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? "Verifying Code..." : "Verify & Access Panel"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-400">
            Did not receive the code? Check your spam folder or{" "}
            <a href="/auth/login" className="text-blue-600 font-semibold hover:underline">
              return to login
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}