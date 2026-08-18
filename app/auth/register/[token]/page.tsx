"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (loading || !password) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/complete-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      alert("Registration successful! Please login.");
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-lg p-6 space-y-5">

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Complete Registration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Set a password to activate your account
          </p>
        </div>

        {/* Password only */}
        <input
          className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
          type="password"
          placeholder="Set your password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleSubmit}
          disabled={loading || !password}
          className="w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Activate Account"}
        </button>

      </div>
    </div>
  );
}