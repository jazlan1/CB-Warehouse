"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, Mail, ArrowRight, KeyRound, Check } from "lucide-react";

export default function VerifyOtpClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const email = searchParams.get("email") || "";
  const paramOtp = searchParams.get("otp") || "";

  const [otp, setOtp] = useState(paramOtp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (paramOtp) {
      setOtp(paramOtp);
    }
  }, [paramOtp]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid OTP");
        return;
      }

      router.push(data.redirect || "/dashboard/client");
    } catch (err) {
      setError("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (paramOtp) {
      navigator.clipboard.writeText(paramOtp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4 relative">

      {/* 🚀 PROMINENT FLOATING OTP POPUP */}
      {paramOtp && (
        <div className="mb-6 w-full max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-blue-500/40 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-300">Demo Verification OTP:</p>
              <p className="text-xl font-extrabold tracking-widest text-blue-400 font-mono">{paramOtp}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={copyToClipboard}
            className="px-3.5 py-2 bg-blue-600/30 hover:bg-blue-600 border border-blue-500/50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
            {copied ? "Copied!" : "Copy OTP"}
          </button>
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="text-blue-600 w-6 h-6" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mt-3">
            Verify Your Account
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            We sent a code to your email
          </p>
        </div>

        {/* Email Box */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 mb-5">
          <Mail className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600 truncate">{email}</span>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-100 p-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleVerify} className="space-y-5">

          <div>
            <label className="text-xs font-medium text-slate-600">
              Enter OTP Code
            </label>

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="••••••"
              className="mt-2 w-full text-slate-700 text-center tracking-[10px] text-xl font-semibold border border-slate-200 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50"
              maxLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify OTP & Continue"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

        </form>

      </div>
    </div>
  );
}