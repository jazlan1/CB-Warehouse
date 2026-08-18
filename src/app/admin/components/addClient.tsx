"use client";

import React, { useState } from "react";
import { X, Loader2, UserPlus, ShieldCheck, Upload, Building2, Phone, MapPin, NotebookTabs } from "lucide-react";

export default function AddClient({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    companyName: "",
    phone: "",
    address: "",
    notes: "",
    role: "CLIENT",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.email) {
      setError("Name and Email are required");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("companyName", form.companyName);
      formData.append("phone", form.phone);
      formData.append("address", form.address);
      formData.append("notes", form.notes);
      formData.append("role", form.role);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const res = await fetch("/api/admin/create-client", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send invitation");
        return;
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const isClient = form.role === "CLIENT";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 text-lg">Add New User</h2>
              <p className="text-xs text-slate-500">Create a profile and send an invitation link</p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          {/* ROLE SELECT */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">User Role</label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="CLIENT">Client</option>
                <option value="CB">CB Staff</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* BASIC INFO GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Full Name *</label>
              <input
                name="name"
                type="text"
                value={form.name}
                placeholder="John Doe"
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Email Address *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                placeholder="john@example.com"
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          {/* IMAGE UPLOAD */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Profile Image</label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-1.5 text-slate-500">
                <Upload className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                <span className="text-sm font-medium text-slate-700">
                  {imageFile ? imageFile.name : "Click to upload image"}
                </span>
                <span className="text-xs text-slate-400">PNG, JPG up to 5MB</span>
              </div>
            </div>
          </div>

          {/* CLIENT ONLY FIELDS */}
          {isClient && (
            <div className="pt-2 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company Details</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Company Name</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      name="companyName"
                      value={form.companyName}
                      placeholder="Acme Corp"
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    <input
                      name="phone"
                      value={form.phone}
                      placeholder="+1 (555) 000-0000"
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    name="address"
                    value={form.address}
                    placeholder="123 Street, City, Country"
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Notes</label>
                <div className="relative">
                  <NotebookTabs className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <textarea
                    name="notes"
                    value={form.notes}
                    placeholder="Add any additional notes here..."
                    onChange={handleChange}
                    rows={3}
                    className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-slate-800 placeholder:text-slate-400 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/10 transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Send Invite"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}