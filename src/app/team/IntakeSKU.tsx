"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  MapPin,
  Save,
  Loader2,
  ImagePlus,
  Layers,
  FileText,
  Trash2,
  Boxes,
  Edit3,
  X,
  PackageX,
  PackageCheck,
  Clock,
  AlertTriangle,
  Check
} from "lucide-react";
import { formatDateTime, formatDate, formatTime } from "@/lib/date";

type Item = {
  name: string;
  quantity: number;
  description: string;
  condition: string;
  sku: string;
  bin: string;
  images: File[];
};

type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  bin: string;
  quantity: number;
  condition: string;
  description: string | null;
  images: string[];
  createdAt: string;
  stockStatus: "IN_STOCK" | "OUT_OF_STOCK";
  createdBy?: {
    name: string;
    email: string;
  };
  client?: {
    name: string;
    email: string;
  };
};

export default function IntakeSKU() {
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  
  // 📸 Image Modal Viewer States
  const [activeImages, setActiveImages] = useState<string[] | null>(null);
  const [currentImgIndex, setCurrentImgIndex] = useState<number>(0);

  // 📝 Edit Popup Modal States
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    quantity: number;
    description: string;
    condition: string;
    sku: string;
    bin: string;
    newImages: File[];
  }>({
    name: "",
    quantity: 1,
    description: "",
    condition: "Good",
    sku: "",
    bin: "",
    newImages: [],
  });
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);
  const [editLoading, setEditLoading] = useState(false);

  // 🗑️ Delete Modal State
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [item, setItem] = useState<Item>({
    name: "",
    quantity: 1,
    description: "",
    condition: "Good",
    sku: "",
    bin: "",
    images: [],
  });

  const [clientSearch, setClientSearch] = useState("");
  const [clientList, setClientList] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const searchClient = async (value: string) => {
    setClientSearch(value);

    if (value.length < 2) return;

    try {
      const res = await fetch(`/api/inventory/search?email=${value}`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setClientList(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUserInventory = async () => {
    try {
      const res = await fetch("/api/inventory/intake", { method: "GET", credentials: "include" });
      const result = await res.json();
      if (result.success) {
        setInventoryList(result.data || []);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    fetchUserInventory();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setItem({ ...item, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files).filter((file) =>
      file.type.startsWith("image/")
    );

    setItem({ ...item, images: [...item.images, ...files] });

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    const updatedImages = item.images.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);

    setItem({ ...item, images: updatedImages });
    setImagePreviews(updatedPreviews);
  };

  // --- ➕ SUBMIT (CREATE) LOGIC ---
  const handleSubmit = async () => {
    if (!item.name.trim() || !item.sku.trim() || !item.bin.trim()) {
      alert("Please fill out all mandatory fields: Name, SKU, and Bin Location.");
      return;
    }

    if (item.quantity < 1) {
      alert("Quantity must be at least 1.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", item.name.trim());
      formData.append("quantity", String(Number(item.quantity)));
      formData.append("description", item.description.trim());
      formData.append("condition", item.condition);
      formData.append("sku", item.sku.trim());
      formData.append("bin", item.bin.trim());
      formData.append("clientId", selectedClient?.id || "");

      item.images.forEach((img) => {
        formData.append("images", img);
      });

      const res = await fetch("/api/inventory/intake", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save item");
      }

      setInventoryList((prev) => [data.data, ...prev]);

      setItem({
        name: "",
        quantity: 1,
        description: "",
        condition: "Good",
        sku: "",
        bin: "",
        images: [],
      });
      setImagePreviews([]);
      setSelectedClient(null);
      setClientSearch("");

      alert("Item successfully committed to inventory!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong during intake.");
    } finally {
      setLoading(false);
    }
  };

  const handleStockToggle = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory/intake?id=${id}`, {
        method: "PATCH",
        credentials: "include",
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message);

      setInventoryList((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, stockStatus: result.data.stockStatus, quantity: result.data.quantity }
            : item
        )
      );
    } catch (err: any) {
      alert(err.message || "Failed to update stock status");
    }
  };

  // --- 🗑️ DELETE CONFIRMATION HANDLER ---
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/inventory/intake?id=${deletingItem.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to delete item");
      }

      setInventoryList((prev) => prev.filter((item) => item.id !== deletingItem.id));
      setDeletingItem(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error while deleting item");
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- 📝 EDIT POPUP TRIGGER ---
  const startEditing = (prod: InventoryItem) => {
    setEditingItem(prod);
    setEditForm({
      name: prod.name,
      quantity: prod.quantity,
      description: prod.description || "",
      condition: prod.condition,
      sku: prod.sku,
      bin: prod.bin,
      newImages: [],
    });
    setEditImagePreviews([]);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).filter((file) => file.type.startsWith("image/"));
    setEditForm({ ...editForm, newImages: [...editForm.newImages, ...files] });

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setEditImagePreviews([...editImagePreviews, ...newPreviews]);
  };

  const handleUpdate = async () => {
    if (!editingItem) return;

    if (!editForm.name.trim() || !editForm.sku.trim() || !editForm.bin.trim()) {
      alert("Mandatory fields cannot be left empty.");
      return;
    }

    setEditLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", editForm.name.trim());
      formData.append("quantity", String(editForm.quantity));
      formData.append("description", editForm.description.trim());
      formData.append("condition", editForm.condition);
      formData.append("sku", editForm.sku.trim());
      formData.append("bin", editForm.bin.trim());

      editForm.newImages.forEach((img) => {
        formData.append("images", img);
      });

      const res = await fetch(`/api/inventory/intake?id=${editingItem.id}`, {
        method: "PUT",
        body: formData,
        credentials: "include",
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to update item");
      }

      setInventoryList((prev) =>
        prev.map((item) => (item.id === editingItem.id ? result.data : item))
      );

      setEditingItem(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong during update");
    } finally {
      setEditLoading(false);
    }
  };

  // ◀️ ▶️ Handlers for next and previous image inside lightbox
  const showPrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeImages) return;
    setCurrentImgIndex((prev) => (prev === 0 ? activeImages.length - 1 : prev - 1));
  };

  const showNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeImages) return;
    setCurrentImgIndex((prev) => (prev === activeImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen rounded-2xl">
      
      {/* 📦 INTAKE FORM HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-xs">
              <Package className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Warehouse SKU Intake &amp; Cataloging
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Capture, audit, document, and assign new inbound physical assets to client profiles.
          </p>
        </div>
      </div>

      {/* 📝 INTAKE FORM CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-emerald-400" />
            <h2 className="font-semibold text-xs tracking-wider uppercase">Asset Intake Blueprint</h2>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">STEP 1: METRIC ALLOCATION</span>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* NAME */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Product / Hardware Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={item.name}
                onChange={handleChange}
                placeholder="e.g. 55-inch Display Monitor"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/30 font-medium"
              />
            </div>

            {/* SKU */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                SKU Identifier <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="sku"
                value={item.sku}
                onChange={handleChange}
                placeholder="e.g. MON-55-4K-01"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/30"
              />
            </div>

            {/* BIN */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Physical Bin Anchor <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="bin"
                value={item.bin}
                onChange={handleChange}
                placeholder="e.g. BIN-A3-SHELF2"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/30 font-medium"
              />
            </div>

            {/* QUANTITY */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Quantity Count <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                min="1"
                value={item.quantity}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/30"
              />
            </div>

            {/* CONDITION */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Physical Condition
              </label>
              <select
                name="condition"
                value={item.condition}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/30 font-medium cursor-pointer"
              >
                <option value="Good">Good / Ready for Dispatch</option>
                <option value="Fair">Fair / Minor Scratches</option>
                <option value="Damaged">Damaged / Non-Functional</option>
              </select>
            </div>

            {/* CLIENT ASSIGNMENT */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Assign to Client Profile
              </label>
              <input
                type="text"
                placeholder="Type client email or name..."
                value={clientSearch}
                onChange={(e) => searchClient(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/30 font-medium"
              />

              {clientList.length > 0 && (
                <div className="border border-slate-200 rounded-xl mt-1 max-h-40 overflow-y-auto bg-white shadow-lg z-20">
                  {clientList.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedClient(c);
                        setClientSearch(c.email);
                        setClientList([]);
                      }}
                      className="p-2 hover:bg-emerald-50 cursor-pointer text-xs flex justify-between"
                    >
                      <span className="font-semibold text-slate-800">{c.name || c.email}</span>
                      <span className="text-slate-400">{c.email}</span>
                    </div>
                  ))}
                </div>
              )}

              {selectedClient && (
                <div className="mt-1 text-xs font-semibold text-emerald-700">
                  ✓ Allocated to: {selectedClient.name || selectedClient.email}
                </div>
              )}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Additional Description &amp; Notes
            </label>
            <textarea
              name="description"
              rows={2}
              value={item.description}
              onChange={handleChange}
              placeholder="Provide serial numbers, batch info, or visible defect notes..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/30 font-medium resize-none"
            />
          </div>

          {/* IMAGE UPLOAD & PREVIEW GRID */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <ImagePlus className="h-4 w-4 text-emerald-600" />
              Visual Auditing &amp; Physical Photos
            </label>

            <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500/50 rounded-2xl p-6 transition-colors bg-slate-50/50 flex flex-col items-center justify-center relative group">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                  Click to upload or drag &amp; drop images
                </p>
                <p className="text-[11px] text-slate-400">PNG, JPG, WEBP formats supported</p>
              </div>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
                {imagePreviews.map((url, index) => (
                  <div key={index} className="relative aspect-square rounded-xl border overflow-hidden bg-slate-100 group shadow-sm">
                    <img src={url} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM FORM BUTTON ACTION */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs shadow-xs transition-all disabled:opacity-50 disabled:pointer-events-none w-full sm:w-auto justify-center cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Processing Intake...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Commit to Inventory
              </>
            )}
          </button>
        </div>
      </div>

      {/* 📊 REAL-TIME USER PRODUCTS LIST */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center gap-2">
          <Boxes className="h-4 w-4 text-emerald-400" />
          <h2 className="font-semibold text-xs tracking-wide uppercase">Your Uploaded Stock</h2>
        </div>

        <div className="p-6">
          {fetchLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="animate-spin h-6 w-6 text-emerald-600" />
              <p className="text-xs font-medium">Loading your inventory snapshot...</p>
            </div>
          ) : inventoryList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 border border-dashed rounded-xl border-slate-200">
              <Package className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-medium">No items uploaded yet by your session.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventoryList.map((prod) => (
                <div
                  key={prod.id}
                  className="border border-slate-200/80 bg-white rounded-xl p-4 flex gap-4 hover:border-slate-300 transition-all shadow-xs relative"
                >
                  {/* 🖼️ MULTIPLE IMAGES CONTAINER */}
                  <div 
                    onClick={() => {
                      if (prod.images && prod.images.length > 0) {
                        setActiveImages(prod.images);
                        setCurrentImgIndex(0);
                      }
                    }}
                    className="h-24 w-24 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden shrink-0 aspect-square relative flex flex-col justify-between cursor-pointer select-none"
                  >
                    {prod.images && prod.images.length > 0 ? (
                      <>
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="h-full w-full object-cover hover:scale-105 transition-transform"
                        />
                        {prod.images.length > 1 && (
                          <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm z-10">
                            +{prod.images.length - 1} More
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-300">
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  {/* 📋 PRODUCT METADATA */}
                  <div className="flex flex-col justify-between overflow-hidden w-full">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-slate-800 text-sm truncate pr-20">
                          {prod.name}
                        </h3>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase shrink-0 border ${
                            prod.condition === "Good"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : prod.condition === "Damaged"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {prod.condition}
                        </span>
                      </div>
                      
                      <div className="text-[11px] text-slate-500 mt-1">
                        Client: <strong className="text-slate-700">{prod.client?.name ?? "No client assigned"}</strong>
                      </div>
                      <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                        SKU: {prod.sku}
                      </p>
                      
                      <span
                        className={`inline-block mt-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          prod.stockStatus === "OUT_OF_STOCK"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {prod.stockStatus === "OUT_OF_STOCK" ? "Out of Stock" : "In Stock"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100 mt-2">
                      <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                        <MapPin className="h-3 w-3 text-slate-400" /> {prod.bin}
                      </span>
                      <span className="font-bold text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 text-xs">
                        Qty: {prod.quantity}
                      </span>
                    </div>
                  </div>

                  {/* 🛠️ ACTION BUTTONS (ALWAYS VISIBLE) */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/95 p-1 rounded-lg border border-slate-200 shadow-xs backdrop-blur-sm">
                    <button
                      onClick={() => startEditing(prod)}
                      className="p-1 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-md transition cursor-pointer"
                      title="Edit Stock Item"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleStockToggle(prod.id)}
                      title={prod.stockStatus === "IN_STOCK" ? "Mark as Out of Stock" : "Mark as In Stock"}
                      className={`p-1 rounded-md transition cursor-pointer ${
                        prod.stockStatus === "IN_STOCK"
                          ? "hover:bg-amber-50 text-amber-600"
                          : "hover:bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {prod.stockStatus === "IN_STOCK" ? (
                        <PackageX className="h-3.5 w-3.5" />
                      ) : (
                        <PackageCheck className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => setDeletingItem(prod)}
                      className="p-1 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-md transition cursor-pointer"
                      title="Delete Entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── DELETE CONFIRMATION MODAL ─── */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-2xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Delete Inventory Stock</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to delete <strong className="text-slate-900 font-bold">{deletingItem.name}</strong> (SKU: {deletingItem.sku})? This will remove the item from active warehouse ledgers.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={deleteLoading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                {deleteLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Yes, Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT MODAL ─── */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-base">Edit Stock Details</h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU</label>
                  <input
                    type="text"
                    name="sku"
                    value={editForm.sku}
                    onChange={handleEditChange}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bin Location</label>
                  <input
                    type="text"
                    name="bin"
                    value={editForm.bin}
                    onChange={handleEditChange}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    min="0"
                    value={editForm.quantity}
                    onChange={handleEditChange}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Condition</label>
                  <select
                    name="condition"
                    value={editForm.condition}
                    onChange={handleEditChange}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Damaged">Damaged</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  value={editForm.description}
                  onChange={handleEditChange}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Add Visual Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={editLoading}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {editLoading ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 LIGHTBOX OVERLAY / SWIPE SLIDER MODAL */}
      {activeImages && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4 md:p-8 transition-all"
          onClick={() => setActiveImages(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Audit Snapshot Gallery
                </span>
                <span className="text-sm font-semibold text-slate-700 mt-0.5">
                  Image {currentImgIndex + 1} of {activeImages.length}
                </span>
              </div>
              <button
                onClick={() => setActiveImages(null)}
                className="text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm text-xs font-bold transition-all hover:bg-slate-50 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="relative aspect-[4/3] md:aspect-[16/10] max-h-[65vh] bg-slate-50 flex items-center justify-center p-6 group select-none border-b border-slate-100">
              <img
                src={activeImages[currentImgIndex]}
                alt="Expanded View"
                className="max-w-full max-h-full object-contain pointer-events-none transition-all duration-300 rounded-xl shadow-lg border border-slate-200/60"
              />

              {activeImages.length > 1 && (
                <button
                  onClick={showPrevImage}
                  className="absolute left-4 p-4 rounded-full bg-white/80 hover:bg-white text-slate-800 border border-slate-200/80 font-black text-lg transition-all backdrop-blur-sm shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                >
                  ❮
                </button>
              )}

              {activeImages.length > 1 && (
                <button
                  onClick={showNextImage}
                  className="absolute right-4 p-4 rounded-full bg-white/80 hover:bg-white text-slate-800 border border-slate-200/80 font-black text-lg transition-all backdrop-blur-sm shadow-md hover:scale-105 active:scale-95 cursor-pointer"
                >
                  ❯
                </button>
              )}
            </div>

            {activeImages.length > 1 && (
              <div className="p-4 bg-white flex gap-2 overflow-x-auto justify-start md:justify-center scrollbar-none">
                {activeImages.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt="Quick Switch Nav"
                    onClick={() => setCurrentImgIndex(index)}
                    className={`h-12 w-12 object-cover rounded-xl border-2 transition-all cursor-pointer shrink-0 ${
                      currentImgIndex === index 
                        ? "border-emerald-500 scale-105 shadow-md ring-2 ring-emerald-500/20" 
                        : "border-slate-200 opacity-60 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER INFO CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-start gap-3 shadow-xs">
          <div className="p-2 bg-slate-100 text-slate-600 rounded-lg shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Audit Standards</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Every committed entry triggers a warehouse tracking snapshot bound to your logged session ID.
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-start gap-3 shadow-xs">
          <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Physical Verification</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Attaching precise image counts guarantees rapid validation during physical stock cycles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}