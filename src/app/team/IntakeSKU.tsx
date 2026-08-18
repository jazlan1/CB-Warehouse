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

  const res = await fetch(`/api/inventory/search?email=${value}`);
  const data = await res.json();

  if (data.success) setClientList(data.data);
};

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return null;
  };

  const fetchUserInventory = async () => {
    try {
      const res = await fetch("/api/inventory/intake", { method: "GET" });
      const result = await res.json();
      if (result.success) {
        setInventoryList(result.data);
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

      const token = getCookie("auth_token");

      const res = await fetch("/api/inventory/intake", {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json();

      if (!res.ok) {
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

      alert("Item successfully saved!");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleStockToggle = async (id: string) => {
  try {
    const token = getCookie("auth_token");
    const res = await fetch(`/api/inventory/intake?id=${id}`, {
      method: "PATCH",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);

    setInventoryList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, stockStatus: result.data.stockStatus }
          : item
      )
    );
  } catch (err: any) {
    alert(err.message || "Failed to update stock status");
  }
};

  // --- 🗑️ DELETE LOGIC ---
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this item from warehouse stock?")) {
      return;
    }

    try {
      const token = getCookie("auth_token");
      const res = await fetch(`/api/inventory/intake?id=${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to delete item");
      }

      setInventoryList((prev) => prev.filter((item) => item.id !== id));
      alert("Item successfully deleted.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error while deleting item");
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
    setEditImagePreviews([]); // Nayi files ke preview clean karein
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

  // --- 💾 SAVE UPDATE (PUT LOGIC) ---
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

      const token = getCookie("auth_token");
      const res = await fetch(`/api/inventory/intake?id=${editingItem.id}`, {
        method: "PUT",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to update item");
      }

      // Live inventory list track map se update karein
      setInventoryList((prev) =>
        prev.map((item) => (item.id === editingItem.id ? result.data : item))
      );

      alert("Item updated successfully!");
      setEditingItem(null); // Modal close karein
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
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Layers className="h-8 w-8 text-emerald-600" />
            Inventory Intake
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your warehouse items with real-time SKU, Bin location, and image audits.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full w-fit">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Warehouse Node Active
        </div>
      </div>

      {/* MAIN FORM PANEL */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-emerald-400" />
          <h2 className="font-semibold text-sm tracking-wide uppercase">Item Specifications</h2>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* ITEM NAME */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Item Name <span className="text-rose-500">*</span>
            </label>
            <input
              name="name"
              value={item.name}
              onChange={handleChange}
              placeholder="e.g. Wireless Mechanical Keyboard K89"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/30 font-medium"
            />
          </div>

          {/* QTY + CONDITION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                name="quantity"
                type="number"
                min="1"
                value={item.quantity}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/30 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Condition Status
              </label>
              <select
                name="condition"
                value={item.condition}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/30 font-medium appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1rem_1rem] bg-[right_1rem_center] bg-no-repeat"
              >
                <option>Good</option>
                <option>Damaged</option>
                <option>Needs Inspection</option>
              </select>
            </div>
          </div>

          {/* SKU + BIN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                SKU Identifier <span className="text-rose-500">*</span>
              </label>
              <input
                name="sku"
                value={item.sku}
                onChange={handleChange}
                placeholder="e.g. ELEC-KEY-892"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/30 font-mono tracking-wider"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Warehouse Bin Location <span className="text-rose-500">*</span>
              </label>
              <input
                name="bin"
                value={item.bin}
                onChange={handleChange}
                placeholder="e.g. Row-4-Shelf-B"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/30 font-medium"
              />
            </div>

            <div className="bg-white p-4 border border-emerald-100 rounded-xl mb-4 shadow-sm">
  <label className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
    Client Email Search
  </label>

  <input
    value={clientSearch}
    onChange={(e) => searchClient(e.target.value)}
    placeholder="Enter client email..."
    className="w-full border border-emerald-200 text-black focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 p-2 rounded-lg mt-2 outline-none"
  />

  {clientList.length > 0 && (
    <div className="mt-2 border border-emerald-100 rounded-lg bg-emerald-50 overflow-hidden">
      {clientList.map((u) => (
        <div
          key={u.id}
          onClick={() => {
            setSelectedClient(u);
            setClientSearch(u.email);
            setClientList([]);
          }}
          className="p-2 cursor-pointer hover:bg-emerald-100 transition-all"
        >
          <p className="font-semibold text-slate-800">{u.name}</p>
          <p className="text-xs text-slate-500">{u.email}</p>
          <p className="text-[10px] text-emerald-700">ID: {u.id}</p>
        </div>
      ))}
    </div>
  )}

  {selectedClient && (
    <div className="mt-2 text-xs font-semibold text-emerald-700">
      ✓ Selected: {selectedClient.name} ({selectedClient.email})
    </div>
  )}
</div>
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Additional Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={item.description}
              onChange={handleChange}
              placeholder="Provide serial numbers, batch info, or visible defect notes..."
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-slate-50/30 font-medium resize-none"
            />
          </div>

          {/* IMAGE UPLOAD & PREVIEW GRID */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <ImagePlus className="h-4 w-4 text-emerald-600" />
              Visual Auditing (Images)
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
                <p className="text-sm font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-slate-400">PNG, JPG, WEBP up to 5MB each</p>
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
            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold shadow-md shadow-emerald-600/10 transition-all disabled:opacity-50 disabled:pointer-events-none w-full sm:w-auto justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                Processing Intake...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Commit to Inventory
              </>
            )}
          </button>
        </div>
      </div>

      {/* 📊 REAL-TIME USER PRODUCTS LIST */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center gap-2">
          <Boxes className="h-5 w-5 text-emerald-400" />
          <h2 className="font-semibold text-sm tracking-wide uppercase">Your Uploaded Stock</h2>
        </div>

        <div className="p-6 md:p-8">
          {fetchLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
              <p className="text-sm font-medium">Loading your inventory snapshot...</p>
            </div>
          ) : inventoryList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 border border-dashed rounded-xl border-slate-200">
              <Package className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">No items uploaded yet by your session.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventoryList.map((prod) => (
                
                <div
                  key={prod.id}
                  className="border border-slate-100 bg-slate-50/40 rounded-xl p-4 flex gap-4 hover:border-emerald-500/20 hover:bg-white transition-all shadow-sm group relative"
                >
                  {/* 🖼️ MULTIPLE IMAGES CONTAINER */}
                  <div 
                    onClick={() => {
                      if (prod.images && prod.images.length > 0) {
                        setActiveImages(prod.images);
                        setCurrentImgIndex(0);
                      }
                    }}
                    className="h-24 w-24 bg-slate-100 border rounded-lg overflow-hidden shrink-0 aspect-square relative flex flex-col justify-between cursor-pointer group/img select-none"
                  >
                    {prod.images && prod.images.length > 0 ? (
                      <>
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="h-full w-full object-cover group-hover/img:scale-105 transition-transform"
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
                        <h3 className="font-bold text-slate-800 text-base truncate pr-16">
                          {prod.name}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                            prod.condition === "Good"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : prod.condition === "Damaged"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {prod.condition}
                        </span>
                        
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
  Client: {prod.client?.name ?? "No client assigned"} ({prod.client?.email ?? "—"})
</div>
                      <p className="text-xs font-mono text-slate-400 mt-0.5 tracking-wider">
                        SKU: {prod.sku}
                      </p>
                      <span
  className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
    prod.stockStatus === "OUT_OF_STOCK"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200"
  }`}
>
  {prod.stockStatus === "OUT_OF_STOCK" ? "Out of Stock" : "In Stock"}
</span>

                      {/* 🔍 MINI THUMBNAILS */}
                      {prod.images && prod.images.length > 1 && (
                        <div className="flex gap-1 mt-2 overflow-x-auto pb-1 scrollbar-none">
                          {prod.images.map((imgUrl, idx) => (
                            <img
                              key={idx}
                              src={imgUrl}
                              alt={`preview-${idx}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveImages(prod.images);
                                setCurrentImgIndex(idx);
                              }}
                              className="h-6 w-6 object-cover rounded border border-slate-200 opacity-75 hover:opacity-100 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100 mt-2">
                      <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                        <MapPin className="h-3 w-3 text-slate-400" /> {prod.bin}
                      </span>
                      <span className="text-slate-400 text-[10px] flex items-center gap-1 font-medium">
                        <Clock className="h-3 w-3 text-slate-400" /> {formatDate(prod.createdAt)}
                      </span>
                      <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border shadow-2xs text-xs">
                        Qty: {prod.quantity}
                      </span>
                    </div>
                  </div>

                  {/* 🛠️ ACTION BUTTONS (EDIT & DELETE ON HOVER / TOP RIGHT) */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg border shadow-sm backdrop-blur-sm">
                    <button
                      onClick={() => startEditing(prod)}
                      className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-md transition-colors"
                      title="Edit Stock Item"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
  onClick={() => handleStockToggle(prod.id)}
  title={
    prod.stockStatus === "IN_STOCK"
      ? "Mark as Out of Stock"
      : "Mark as In Stock"
  }
  className={`p-1.5 rounded-md transition-colors ${
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
                      onClick={() => handleDelete(prod.id)}
                      className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-md transition-colors"
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

      {/* 📝 SEPARATE EDIT POPUP MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Edit Warehouse Product</h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Item Name</label>
                <input
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Quantity</label>
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    value={editForm.quantity}
                    onChange={handleEditChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Condition</label>
                  <select
                    name="condition"
                    value={editForm.condition}
                    onChange={handleEditChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  >
                    <option>Good</option>
                    <option>Damaged</option>
                    <option>Needs Inspection</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">SKU Code</label>
                  <input
                    name="sku"
                    value={editForm.sku}
                    onChange={handleEditChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-mono tracking-wider focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Bin Location</label>
                  <input
                    name="bin"
                    value={editForm.bin}
                    onChange={handleEditChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  value={editForm.description}
                  onChange={handleEditChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                />
              </div>

              {/* Nayi Images Ke liye Override Option */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block text-amber-600">
                  ⚠️ Replace Existing Images (Optional)
                </label>
                <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center relative bg-slate-50">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleEditImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <p className="text-xs font-semibold text-slate-600">Click to upload new snapshot trail</p>
                </div>

                {editImagePreviews.length > 0 ? (
                  <div className="flex gap-2 pt-1 overflow-x-auto">
                    {editImagePreviews.map((url, i) => (
                      <img key={i} src={url} alt="New Preview" className="h-12 w-12 object-cover rounded-lg border" />
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Leaves current saved Cloudinary images active if empty.</p>
                )}
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={editLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-all shadow-sm"
              >
                {editLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    Saving Changes...
                  </>
                ) : (
                  "Save Changes"
                )}
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
                className="text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm text-xs font-bold transition-all hover:bg-slate-50"
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
                  className="absolute left-4 p-4 rounded-full bg-white/80 hover:bg-white text-slate-800 border border-slate-200/80 font-black text-lg transition-all backdrop-blur-sm shadow-md hover:scale-105 active:scale-95"
                >
                  ❮
                </button>
              )}

              {activeImages.length > 1 && (
                <button
                  onClick={showNextImage}
                  className="absolute right-4 p-4 rounded-full bg-white/80 hover:bg-white text-slate-800 border border-slate-200/80 font-black text-lg transition-all backdrop-blur-sm shadow-md hover:scale-105 active:scale-95"
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
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-start gap-3 shadow-sm">
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

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex items-start gap-3 shadow-sm">
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