"use client";

import React from "react";
import { FileText, Construction } from "lucide-react";

export default function Invoice() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-lg w-full bg-white border rounded-2xl shadow-sm p-10 text-center">

        <div className="flex justify-center mb-5">
          <div className="p-4 rounded-full bg-slate-100">
            <Construction className="h-10 w-10 text-slate-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mb-3">
          Billing & Invoices
        </h1>

        <p className="text-slate-500 mb-6">
          This module is currently under development and is not being used in
          the current workflow.
        </p>

        <div className="border rounded-xl p-4 bg-slate-50">
          <FileText className="h-8 w-8 mx-auto text-slate-400 mb-2" />
          <p className="text-sm text-slate-600">
            Invoice generation, payment tracking, and billing management will
            be available in a future release.
          </p>
        </div>

      </div>
    </div>
  );
}