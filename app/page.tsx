// app/page.tsx
/**
 * CB Core - Central Asset & Inventory Gateway
 * --------------------------------------------------------------------------
 * File: app/page.tsx
 * Type: Next.js Server Component (Default)
 * Ecosystem: Tailwind CSS / Lucide React / Next Link
 * * Description:
 * یہ پروجیکٹ کا مین انٹری پوائنٹ (Home Page) ہے۔ اسے ڈیزائن گائیڈلائنز کے مطابق
 * بالکل سمپل، کلین اور ڈیسنٹ رکھا گیا ہے۔ یہاں سے سسٹمز کے تمام یوزرز (Clients اور Admins)
 * اپنے متعلقہ پورٹلز کی طرف نیویگیٹ کر سکتے ہیں۔ 
 */

import React from "react";
import Link from "next/link";
import { 
  Package, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  Activity, 
  Lock 
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans p-4 md:p-8 selection:bg-blue-600 selection:text-white">
      
      {/* MAIN CONTAINER: تمام کنٹینٹ کو ایک سینٹرلائزڈ کارڈ اسٹرکچر میں ریپ کیا ہے */}
      <div className="w-full max-w-xl bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 md:p-10 space-y-8 transition-all">
        
        {/* SECTION 1: BRANDING & IDENTITY (لوگو اور مین ہیڈنگ) */}
        <div className="flex flex-col items-center text-center space-y-3">
          {/* پریمیم آئیکن کنٹینر */}
          <div className="p-3.5 bg-blue-600 rounded-2xl text-white shadow-md shadow-blue-600/10 transition-transform hover:scale-105 duration-200">
            <Package className="h-8 w-8" />
          </div>
          
          {/* برانڈ نیم اور سب-ٹائٹل */}
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              CB Core
            </h1>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
              Inventory & Logistics Ecosystem
            </p>
          </div>
        </div>

        {/* ڈیوائیڈر لائن */}
        <hr className="border-slate-100" />

        {/* SECTION 2: PLATFORM OVERVIEW (سسٹم کی مختصر اور کلین ڈیسکرپشن) */}
        <div className="space-y-2 text-center max-w-md mx-auto">
          <h2 className="text-base font-bold text-slate-800">
            Centralized Asset Management Gateway
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Welcome to the official logistics management platform. This ecosystem replacement streamlines internal tracking, asset intake pipelines, 2-week event buffers, and round-trip deployment schedules.
          </p>
        </div>

        {/* SECTION 3: SYSTEM ARCHITECTURE BULLETS (سسٹم کے اہم سیکیورٹی اور ورک فلو پوائنٹس) */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
          <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider px-1">
            Core Architecture Status
          </p>
          
          <div className="space-y-2.5">
            {/* پوائنٹ 1: سیکیورٹی */}
            <div className="flex items-start gap-3 text-xs text-slate-600">
              <Lock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 block">Encrypted Authorization</span>
                <span className="text-slate-500 text-xxs">Protected via secure HttpOnly session cookie infrastructure.</span>
              </div>
            </div>

            {/* پوائنٹ 2: ڈیٹا بیس سٹرکچر */}
            <div className="flex items-start gap-3 text-xs text-slate-600">
              <Layers className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 block">Prisma Edge Engine</span>
                <span className="text-slate-500 text-xxs">Fully integrated with up-to-date Prisma structures for seamless scaling.</span>
              </div>
            </div>

            {/* پوائنٹ 3: آٹومیشن */}
            <div className="flex items-start gap-3 text-xs text-slate-600">
              <Activity className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-800 block">Real-time Synchronization</span>
                <span className="text-slate-500 text-xxs">Unified management dashboard replacing legacy tracking logs.</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: PRIMARY ACTIONS (نیویگیشن اور ایکشن بٹنز) */}
        <div className="space-y-3 pt-2">
          
          {/* بٹن 1: لاگ ان پورٹل پر جانے کے لیے */}
          <Link 
            href="/auth/login" 
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all text-center flex items-center justify-center gap-2 group shadow-sm shadow-blue-600/10"
          >
            Sign In to Account
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform duration-250" />
          </Link>
          
          {/* بٹن 2: پہلی بار آنے والے یوزرز کے لیے (Activation) */}
          <Link 
            href="/auth/signup" 
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/50 rounded-xl text-sm font-semibold transition-all text-center flex items-center justify-center gap-2"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Activate Portal Access
          </Link>

        </div>

        {/* SECTION 5: SECURITY COMPLIANCE NOTICE */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-400 leading-normal max-w-sm mx-auto">
            Authorized organizational login required. Unauthenticated attempts are restricted by server-side middleware routing walls.
          </p>
        </div>

      </div>

      {/* FOOTER SYSTEM: کاپی رائٹ اور انفارمیشن */}
      <footer className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-xxs text-slate-400 mt-8">
        <p>&copy; 2026 CB Logistics Ecosystem. All rights reserved.</p>
        <div className="flex gap-3">
          <span className="text-slate-300">|</span>
          <p className="font-medium text-slate-400">Enterprise Verified Flow</p>
        </div>
      </footer>

    </div>
  );
}