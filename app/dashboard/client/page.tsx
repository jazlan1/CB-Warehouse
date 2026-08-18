"use client";

import React, { useState, useEffect } from "react";
import { 
  Package, 
  ShoppingCart, 
  Calendar, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle,
  ArrowRight,
  Loader2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Layers,
  MapPin,
  History,
  LogOut
} from "lucide-react";

// Imported Order History Component
import OrderHistory from "@/src/app/client/orderHistory";
import { useRouter } from "next/navigation";

// Exact Prisma matching interface representation
interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  bin: string;
  quantity: number;
  description: string | null;
  condition: string;
  images: string[];
  createdById: string;
  createdAt: string;
  stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | "DISCONTINUED";
}

// 🛒 Naya Database Structure Matcher Interface
interface DbCartItem {
  id: string;
  quantity: number;
  inventoryId: string;
  inventory: InventoryItem;
}

export default function ClientPortal() {
  // Inventory and System States
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🔄 State Modified: Ab hum array mappings database response store karenge
  const [dbCart, setDbCart] = useState<DbCartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("All");
  
  // Appended "history" type state variant
  const [step, setStep] = useState<"browse" | "checkout" | "success" | "history">("browse");

  const router = useRouter();

  const handleLogout = async () => {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    router.push("/auth/login"); // ya "/" jis page pe bhejna ho
  } catch (err) {
    console.error("Logout failed", err);
  }
};
  // Lightbox Modal States for Multi-Image Support
  const [lightbox, setLightbox] = useState<{ isOpen: boolean; images: string[]; currentIndex: number }>({
    isOpen: false,
    images: [],
    currentIndex: 0
  });

  // Form Logistics States
  const [formData, setFormData] = useState({
    eventName: "",
    eventDate: "",
    shipToAddress: "",
    returnAddress: "",
    specialInstructions: ""
  });

  // Fetch Live Prisma Connected Stream Engine + Live Cart Rows
  useEffect(() => {
    async function initPortalData() {
      try {
        setLoading(true);
        
        // Parallel fetching for performance boost
        const [inventoryRes, cartRes] = await Promise.all([
          fetch("/api/inventory/all"),
          fetch("/api/orders/cart")
        ]);

        const inventoryJson = await inventoryRes.json();
        const cartJson = await cartRes.json();

        if (!inventoryRes.ok || !inventoryJson.success) {
          throw new Error(inventoryJson.message || "Failed to fetch inventory data.");
        }

        setInventory(inventoryJson.data || []);
        
        if (cartRes.ok && cartJson.success) {
          setDbCart(cartJson.data || []);
        }
      } catch (err: any) {
        console.error("Initialization error:", err);
        setError(err.message || "Something went wrong while loading data.");
      } finally {
        setLoading(false);
      }
    }

    initPortalData();
  }, []);

  // 🛒 HELPER: Matrix values mapping converter for easy reading in render checks
  const getCartQty = (inventoryId: string): number => {
    const found = dbCart.find(item => item.inventoryId === inventoryId);
    return found ? found.quantity : 0;
  };

  // -----------------------------------------------------------------
  // Live Database Cart Mutators (Database Operations Sync)
  // -----------------------------------------------------------------
  
  const addToCart = async (inventoryId: string) => {
    const targetItem = inventory.find(i => i.id === inventoryId);
    const currentQty = getCartQty(inventoryId);

    if (!targetItem || currentQty >= targetItem.quantity) return;

    try {
      // Optimistic state change on frontend instantly
      const existingIndex = dbCart.findIndex(item => item.inventoryId === inventoryId);
      let updatedCart = [...dbCart];

      if (existingIndex > -1) {
        updatedCart[existingIndex].quantity += 1;
      } else {
        // Temp item generation for visual feedback before server payload roundtrip
        updatedCart.unshift({
          id: `temp-${Date.now()}`,
          quantity: 1,
          inventoryId,
          inventory: targetItem
        });
      }
      setDbCart(updatedCart);

      // Database execution match
      const res = await fetch("/api/orders/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryId, quantity: 1 })
      });
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        // Rollback state if server crashes
        window.location.reload();
      } else {
        // Sync generated unique id from server payload db
        setDbCart(prev => prev.map(item => item.inventoryId === inventoryId ? json.data : item));
      }
    } catch (err) {
      console.error("Cart mutation error:", err);
    }
  };

  const removeFromCart = async (inventoryId: string) => {
    const currentQty = getCartQty(inventoryId);
    const targetCartItem = dbCart.find(item => item.inventoryId === inventoryId);
    
    if (!targetCartItem) return;

    try {
      let updatedCart = [...dbCart];
      const targetIndex = dbCart.findIndex(item => item.inventoryId === inventoryId);

      if (currentQty <= 1) {
        updatedCart.splice(targetIndex, 1);
        setDbCart(updatedCart);

        // Delete completely since boundary hit zero metrics
        await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartItemId: targetCartItem.id, action: "decrement" })
        });
      } else {
        updatedCart[targetIndex].quantity -= 1;
        setDbCart(updatedCart);

        await fetch("/api/orders/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cartItemId: targetCartItem.id, action: "decrement" })
        });
      }
    } catch (err) {
      console.error("Cart adjustment failed:", err);
    }
  };

  const deleteFromCart = async (cartItemId: string) => {
    try {
      setDbCart(prev => prev.filter(item => item.id !== cartItemId));

      await fetch("/api/orders/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartItemId })
      });
    } catch (err) {
      console.error("Purging cart item failed:", err);
    }
  };

  // Live Count Tracker from state collection array
  const totalCartItems = dbCart.reduce((total, item) => total + item.quantity, 0);

  // Dynamic conditions extractor matching Prisma strings pool
  const conditions = ["All", ...Array.from(new Set(inventory.map(item => item.condition).filter(Boolean)))];

  // Client search structure mapping
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(search.toLowerCase()) || 
      item.sku?.toLowerCase().includes(search.toLowerCase()) ||
      item.id?.toLowerCase().includes(search.toLowerCase());
    const matchesCondition = selectedCondition === "All" || item.condition === selectedCondition;
    return matchesSearch && matchesCondition;
  });

  // Lightbox Operations Controllers
  const openImageModal = (imagesArray: string[], index: number) => {
    setLightbox({
      isOpen: true,
      images: imagesArray,
      currentIndex: index
    });
  };

  const nextModalImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightbox(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.images.length
    }));
  };

  const prevModalImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightbox(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length
    }));
  };

  // Form Submit Execution Logic
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Transforming dynamic database data into expected API dictionary pattern structure
      const formattedCartItemsPayload: { [key: string]: number } = {};
      dbCart.forEach(item => {
        formattedCartItemsPayload[item.inventoryId] = item.quantity;
      });

      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventName: formData.eventName,
          eventDate: formData.eventDate,
          shipToAddress: formData.shipToAddress,
          returnAddress: formData.returnAddress,
          specialInstructions: formData.specialInstructions,
          cartItems: formattedCartItemsPayload, 
        }),
      });

      const json = await response.json();

      if (json.success) {
        setStep("success");
        setDbCart([]); // Purge active front client state on transaction validation completion
      } else {
        alert(json.message || "Something went wrong while saving your order.");
      }
    } catch (err) {
      console.error("Submission failed:", err);
    }
  };

  // --- RENDERING LOADING CONTAINER ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500 font-medium tracking-wide">Syncing real-time database cache...</p>
      </div>
    );
  }

  // --- RENDERING ERROR CONTAINER ---
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="p-3 bg-rose-100 text-rose-600 rounded-full"><AlertCircle className="h-8 w-8" /></div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Database Connection Failed</h2>
          <p className="text-sm text-slate-500 max-w-sm mt-1">{error}</p>
        </div>
        <button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition">
          Re-Authenticate Session
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased font-sans">
      {/* GLOBAL TOP HEADER */}
      <header className="bg-white border-b border-slate-200/80 h-16 px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-xs">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm tracking-tight block">Experian Logistics Portal</span>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Master Pool
            </p>
          </div>
        </div>

        {/* Action Panel Controllers */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setStep(step === "history" ? "browse" : "history")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
              step === "history"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>{step === "history" ? "Browse Catalog" : "Order History"}</span>
          </button>

          {step === "browse" && (
            <button 
              onClick={() => totalCartItems > 0 && setStep("checkout")}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              disabled={totalCartItems === 0}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Review Requests</span>
              <span className="bg-white text-indigo-600 px-1.5 py-0.5 rounded-md text-[10px] font-black">
                {totalCartItems}
              </span>
            </button>
          )}

          <button
            onClick={handleLogout}
            title="Sign Out"
            className="flex items-center gap-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-600 hover:text-rose-600 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* CORE FRAMEWORK WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col lg:flex-row gap-6">
        
        {step === "browse" && (
          <>
            {/* GRID LAYOUT AREA */}
            <div className="flex-1 space-y-6">
              {/* FILTERS TOOLBAR */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Name, SKU, or tracking ID..."
                    className="w-full bg-slate-50 text-slate-900 pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  {conditions.map((cond) => (
                    <button
                      key={cond}
                      onClick={() => setSelectedCondition(cond)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${
                        selectedCondition === cond
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cond}
                    </button>
                  ))}
                </div>
              </div>

              {/* DYNAMIC ITEM LOOPER */}
              {filteredInventory.length === 0 ? (
                <div className="bg-white text-center py-24 border border-slate-200 rounded-2xl text-slate-400">
                  <Package className="h-12 w-12 mx-auto text-slate-300 stroke-1 mb-3" />
                  <p className="text-sm font-medium">No live stock records found matches.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredInventory.map((item) => {
                    const hasImages = item.images && item.images.length > 0;
                    const fallbackImage = "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?q=80&w=400&auto=format&fit=crop";
                    const primaryImage = hasImages ? item.images[0] : fallbackImage;
                    const currentCartQty = getCartQty(item.id);

                    return (
                      <div key={item.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between hover:border-indigo-400 transition-all duration-200">
                        
                        {/* MULTI-IMAGE VIEWER HEADER FRAME */}
                        <div className="relative bg-slate-100 h-48 w-full group overflow-hidden">
                          <img 
                            src={primaryImage} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 cursor-pointer"
                            onClick={() => openImageModal(hasImages ? item.images : [fallbackImage], 0)}
                          />
                          
                          {hasImages && item.images.length > 1 && (
                            <span className="absolute bottom-2 left-2 bg-slate-900/75 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                              {item.images.length} Photos (Click to view)
                            </span>
                          )}

                          <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-xs border border-slate-200 text-slate-800 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-tight">
                            SKU: {item.sku || "N/A"}
                          </span>
                          {/* 👇 Out of Stock / Discontinued overlay */}
{item.stockStatus !== "IN_STOCK" && (
  <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-[1.5px] flex items-center justify-center z-10">
    <span className={`text-white text-[11px] font-black px-3 py-1.5 rounded-xl tracking-widest uppercase shadow-lg ${
      item.stockStatus === "DISCONTINUED" 
        ? "bg-slate-700" 
        : "bg-rose-600"
    }`}>
      {item.stockStatus === "DISCONTINUED" ? "Discontinued" : "Out of Stock"}
    </span>
  </div>
)}
                        </div>

                        {/* CONTENT DETAILS BODY GRID */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-bold text-slate-800 text-sm tracking-tight line-clamp-1">{item.name}</h3>
                                <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                                  {item.condition}
                                </span>
                              </div>
                              {item.description && (
                                <p className="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                              )}
                            </div>

                            {/* Meta Metrics specifications */}
                            <div className="pt-2 grid grid-cols-2 gap-2 border-t border-slate-100 text-[11px] font-medium text-slate-500">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                <span className="truncate">Bin: <strong className="text-slate-700">{item.bin}</strong></span>
                              </div>
                              <div className="flex items-center gap-1 justify-end">
                                <Layers className="h-3.5 w-3.5 text-slate-400" />
                                <span>Stock: <strong className={item.quantity > 0 ? "text-emerald-600" : "text-rose-600"}>{item.quantity}</strong></span>
                              </div>
                            </div>
                          </div>

                          {/* Action Controller Systems Connected with DB Handlers */}
                          {item.stockStatus !== "IN_STOCK" ? (
  // Read-only disabled state — client kuch nahi kar sakta
  <div className={`w-full py-2 rounded-xl text-xs font-bold text-center border ${
    item.stockStatus === "DISCONTINUED"
      ? "bg-slate-100 text-slate-400 border-slate-200"
      : "bg-rose-50 text-rose-400 border-rose-100"
  }`}>
    {item.stockStatus === "DISCONTINUED" ? "Discontinued" : "Out of Stock"}
  </div>
) : currentCartQty > 0 ? (
  <div className="flex items-center justify-between bg-slate-50 p-1 rounded-xl border border-slate-200">
    <button onClick={() => removeFromCart(item.id)} className="p-1.5 hover:bg-white text-slate-600 hover:text-rose-600 rounded-lg transition shadow-2xs">
      <Minus className="h-3.5 w-3.5" />
    </button>
    <span className="text-xs font-black text-slate-800">{currentCartQty}</span>
    <button 
      onClick={() => addToCart(item.id)} 
      disabled={currentCartQty >= item.quantity}
      className="p-1.5 hover:bg-white text-slate-600 hover:text-indigo-600 rounded-lg transition shadow-2xs disabled:opacity-20"
    >
      <Plus className="h-3.5 w-3.5" />
    </button>
  </div>
) : (
  <button
    onClick={() => addToCart(item.id)}
    disabled={item.quantity === 0}
    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-2xs"
  >
    Add to Event Request
  </button>
)}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* MINI CART SIDEBAR CONTROL PANEL */}
            <div className="w-full lg:w-80 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs h-auto lg:h-[calc(100vh-8rem)] sticky top-24 flex flex-col justify-between shrink-0">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h2 className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider">
                    <ShoppingCart className="h-4 w-4 text-indigo-600" /> Selected Manifest
                  </h2>
                  <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-xs font-bold">{totalCartItems}</span>
                </div>

                {totalCartItems === 0 ? (
                  <div className="text-center py-16 text-slate-400 space-y-2">
                    <ShoppingCart className="h-8 w-8 mx-auto stroke-1 text-slate-300" />
                    <p className="text-xs font-medium">No components assigned yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 overflow-y-auto max-h-[52vh] pr-1">
                    {dbCart.map((item) => (
                      <div key={item.id} className="flex gap-2 items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{item.inventory.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {item.inventory.sku} • Qty: {item.quantity}</p>
                        </div>
                        <button onClick={() => deleteFromCart(item.id)} className="text-slate-400 hover:text-rose-600 p-1 transition">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setStep("checkout")}
                disabled={totalCartItems === 0}
                className="w-full mt-4 lg:mt-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                Proceed to Shipping Form
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {/* STEP 2: LOGISTICS CHECKOUT DISPATCH FORM */}
        {step === "checkout" && (
          <div className="max-w-2xl mx-auto w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-4">
              <button type="button" onClick={() => setStep("browse")} className="hover:text-indigo-600 transition">Inventory Catalog</button>
              <span>/</span>
              <span className="text-slate-800">Dispatch Setup</span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Event Logistics Details</h2>
            <p className="text-xs text-rose-500 font-bold mt-1 mb-6 flex items-center gap-1.5 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
              <Calendar className="h-4 w-4" /> <strong>Operational Notice:</strong> Requests must be locked down minimum 2 weeks in advance.
            </p>

            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Event Reference Identifier</label>
                <input
                  type="text" required
                  placeholder="e.g., Experian Global Strategy Summit 2026"
                  className="w-full bg-slate-50 text-slate-900 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.eventName}
                  onChange={e => setFormData({...formData, eventName: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Delivery Target Date</label>
                <input
                  type="date" required
                  className="w-full bg-slate-50 text-slate-900 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  value={formData.eventDate}
                  onChange={e => setFormData({...formData, eventDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ship-To Address (Destination Point)</label>
                <textarea
                  rows={3} required
                  placeholder="Provide precise destination routing address details..."
                  className="w-full bg-slate-50 text-slate-900 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none leading-relaxed"
                  value={formData.shipToAddress}
                  onChange={e => setFormData({...formData, shipToAddress: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Return Routing Address (Labels Anchor)</label>
                <textarea
                  rows={2} required
                  placeholder="Where should terminal return waybills target back?"
                  className="w-full bg-slate-50 text-slate-900 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none leading-relaxed"
                  value={formData.returnAddress}
                  onChange={e => setFormData({...formData, returnAddress: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  Special Handling Instructions <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="FRAGILE stack parameters, forklift mandates, temperature warnings..."
                  className="w-full bg-slate-50 text-slate-900 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none leading-relaxed"
                  value={formData.specialInstructions}
                  onChange={e => setFormData({...formData, specialInstructions: e.target.value})}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep("browse")}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition"
                >
                  Return to Manifest
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Authorize Shipping Request
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION MODAL STATE */}
        {step === "success" && (
          <div className="max-w-md mx-auto w-full text-center bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-4 my-auto">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Request Logged Successfully!</h2>
            <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
              Aapka event manifest automatic dynamic data payload processing ke liye CB Warehouse queue me push ho chuka hai.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setStep("history")} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition">
                View History
              </button>
              <button onClick={() => setStep("browse")} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-xs">
                Open Master Catalog
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 4: ORDER HISTORY VIEW SYSTEM --- */}
        {step === "history" && (
          <div className="w-full max-w-5xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Your Dispatched Orders</h2>
                <p className="text-xs text-slate-500 mt-0.5">Real-time status tracking profiles registered under your authentication token.</p>
              </div>
              <button 
                onClick={() => setStep("browse")}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"
              >
                Back to Inventory Catalog &rarr;
              </button>
            </div>

            {/* Mounted Imported Component */}
            <OrderHistory />
          </div>
        )}

      </main>

      <footer className="border-t border-slate-200 bg-white py-4">
  <div className="text-center text-xs text-slate-500">
    Developed by{" "}
    <a
      href="https://cntlcv.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
    >
      CNTL C&amp;V
    </a>
  </div>
</footer>

      {/* --- PREMIUM GLASSMORPHISM MULTI-IMAGE LIGHTBOX MODAL --- */}
      {lightbox.isOpen && lightbox.images.length > 0 && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md transition-all duration-300"
          onClick={() => setLightbox(prev => ({ ...prev, isOpen: false }))}
        >
          <button 
            onClick={() => setLightbox(prev => ({ ...prev, isOpen: false }))}
            className="absolute top-4 right-4 z-50 text-slate-400 hover:text-white transition bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10 backdrop-blur-md"
          >
            <X className="h-5 w-5" />
          </button>

          {lightbox.images.length > 1 && (
            <button 
              onClick={prevModalImage}
              className="absolute left-4 z-50 text-slate-300 hover:text-white transition bg-white/5 hover:bg-white/10 p-3 rounded-full border border-white/10 backdrop-blur-md"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          <div 
            className="relative max-w-5xl max-h-[80vh] w-full p-4 flex flex-col items-center justify-center select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={lightbox.images[lightbox.currentIndex]} 
              alt={`Focused view position ${lightbox.currentIndex}`} 
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/5"
            />
            
            <div className="absolute -bottom-8 bg-slate-900/80 border border-slate-800 text-slate-400 px-4 py-1 rounded-full text-[10px] tracking-widest font-mono shadow-lg backdrop-blur-md">
              IMAGE {lightbox.currentIndex + 1} OF {lightbox.images.length}
            </div>
          </div>

          {lightbox.images.length > 1 && (
            <button 
              onClick={nextModalImage}
              className="absolute right-4 z-50 text-slate-300 hover:text-white transition bg-white/5 hover:bg-white/10 p-3 rounded-full border border-white/10 backdrop-blur-md"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {lightbox.images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 max-w-xl overflow-x-auto bg-slate-900/40 p-2 border border-white/5 rounded-2xl backdrop-blur-xs" onClick={e => e.stopPropagation()}>
              {lightbox.images.map((img, idx) => (
                <div 
                  key={idx}
                  onClick={() => setLightbox(prev => ({ ...prev, currentIndex: idx }))}
                  className={`h-12 w-12 rounded-lg overflow-hidden cursor-pointer border-2 transition-all shrink-0 ${idx === lightbox.currentIndex ? "border-indigo-500 scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  <img src={img} alt="strip index" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}