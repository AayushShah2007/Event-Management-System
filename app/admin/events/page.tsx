"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit3, Trash2, ToggleLeft, ToggleRight, Search, Calendar, MapPin, X, DollarSign, Users, Image, Tag, CloudUpload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppStore } from "@/store";
import { supabaseQuery } from "@/lib/supabase-rest";
import { formatDate, cn } from "@/lib/utils";
import toast from "react-hot-toast";

const emptyCategory = { name: "", price: "", total_seats: "100", available_seats: "100", description: "", color: "#dc2626" };

const emptyEvent = {
  title: "", description: "", artist_name: "", venue: "", venue_address: "", date: "", time: "18:00",
  image_url: "", thumbnail_url: "", venue_plan: "", total_tickets: "1000", is_featured: false, is_trending: false, is_live: true,
  categories: [{ ...emptyCategory }],
};

const COLORS = [
  { value: "#dc2626", label: "Red" },
  { value: "#f59e0b", label: "Gold" },
  { value: "#8b5cf6", label: "Purple" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#10b981", label: "Green" },
  { value: "#ec4899", label: "Pink" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#f97316", label: "Orange" },
];

export default function AdminEventsPage() {
  const { theme } = useAppStore();
  const isDark = theme === "dark";
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [newEvent, setNewEvent] = useState<any>({ ...emptyEvent, categories: [{ ...emptyCategory }] });
  const [saving, setSaving] = useState(false);

  const uploadFile = async (file: File, setUrl: (url: string) => void) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file: base64, name: file.name }),
        });
        const data = await res.json();
        if (data.url) { setUrl(data.url); toast.success("Uploaded!"); }
        else toast.error(data.error || "Upload failed");
      };
      reader.onerror = () => toast.error("Failed to read file");
    } catch (e: any) { toast.error(e.message || "Upload failed") }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await supabaseQuery("events", {
          select: "*,categories:event_categories(*)",
          params: { order: "date.asc" },
        });
        setEvents(data || []);
      } catch (e) { console.log(e) }
      finally { setLoading(false) }
    };
    fetch();
  }, []);

  const toggleLive = async (id: string, current: boolean) => {
    try {
      await supabaseQuery(`events?id=eq.${id}`, { method: "PATCH", body: { is_live: !current } });
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, is_live: !current } : e)));
      toast.success(`Event ${current ? "disabled" : "enabled"}`);
    } catch { toast.error("Failed to update event") }
  };

  const deleteEvent = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await supabaseQuery(`events?id=eq.${id}`, { method: "DELETE" });
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast.success("Event deleted");
    } catch { toast.error("Failed to delete event") }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const { id, created_at, categories, ...body } = editing;
      const cleanBody = { ...body };
      for (const k of Object.keys(cleanBody)) { if (cleanBody[k] === "" || cleanBody[k] === null) delete cleanBody[k]; }
      await supabaseQuery(`events?id=eq.${id}`, { method: "PATCH", body: cleanBody });

      if (categories && Array.isArray(categories)) {
        const existing = await supabaseQuery("event_categories", { params: { event_id: `eq.${id}` }, select: "id" }).catch(() => []);
        const existingIds = new Set((Array.isArray(existing) ? existing : []).map((c: any) => c.id));

        for (const cat of categories) {
          if (cat.id && existingIds.has(cat.id)) {
            const { id: catId, event_id, created_at: _, ...catBody } = cat;
            await supabaseQuery(`event_categories?id=eq.${catId}`, { method: "PATCH", body: { ...catBody, price: Number(catBody.price), total_seats: Number(catBody.total_seats), available_seats: Number(catBody.available_seats) } });
            existingIds.delete(catId);
          } else {
            const { id: _, ...catBody } = cat;
            await supabaseQuery("event_categories", { method: "POST", body: { event_id: id, ...catBody, price: Number(catBody.price), total_seats: Number(catBody.total_seats), available_seats: Number(catBody.available_seats) } });
          }
        }

        for (const removeId of existingIds) {
          await supabaseQuery(`event_categories?id=eq.${removeId}`, { method: "DELETE" }).catch(() => {});
        }
      }

      setEvents((prev) => prev.map((e) => (e.id === id ? { ...editing, categories: editing.categories } : e)));
      toast.success("Event updated");
      setEditing(null);
    } catch { toast.error("Failed to update event") }
    finally { setSaving(false) }
  };

  const handleCreate = async () => {
    if (!newEvent.title) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const { categories, ...eventData } = newEvent;
      const cleanEvent = { ...eventData };
      for (const k of Object.keys(cleanEvent)) { if (cleanEvent[k] === "" || cleanEvent[k] === null) delete cleanEvent[k]; }
      const data = await supabaseQuery("events", { method: "POST", body: cleanEvent, select: "*" });
      const created = Array.isArray(data) ? data[0] : data;

      if (created && categories && Array.isArray(categories)) {
        for (const cat of categories) {
          if (cat.name) {
            const { id: _, ...catBody } = cat;
            await supabaseQuery("event_categories", { method: "POST", body: { event_id: created.id, ...catBody, price: Number(catBody.price), total_seats: Number(catBody.total_seats), available_seats: Number(catBody.available_seats) } });
          }
        }
      }

      const full = await supabaseQuery(`events?id=eq.${created.id}`, { select: "*,categories:event_categories(*)" }).catch(() => created);
      setEvents((prev) => [Array.isArray(full) ? full[0] : full || created, ...prev]);
      toast.success("Event created!");
      setCreating(false);
      setNewEvent({ ...emptyEvent, categories: [{ ...emptyCategory }] });
    } catch { toast.error("Failed to create event") }
    finally { setSaving(false) }
  };

  const updateCat = (idx: number, field: string, value: string, data: any, setData: Function) => {
    const cats = [...(data.categories || [])];
    cats[idx] = { ...cats[idx], [field]: value };
    setData({ ...data, categories: cats });
  };

  const addCat = (data: any, setData: Function) => {
    const cats = [...(data.categories || [])];
    cats.push({ ...emptyCategory });
    setData({ ...data, categories: cats });
  };

  const removeCat = (idx: number, data: any, setData: Function) => {
    const cats = [...(data.categories || [])];
    cats.splice(idx, 1);
    setData({ ...data, categories: cats.length ? cats : [{ ...emptyCategory }] });
  };

  const renderForm = (data: any, setData: Function) => (
    <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Event Details</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-white text-xs">Title *</Label>
          <Input value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} className="h-9 text-sm bg-white/5 text-white border-white/10" />
        </div>
        <div className="col-span-2">
          <Label className="text-white text-xs">Description</Label>
          <textarea value={data.description || ""} onChange={(e) => setData({ ...data, description: e.target.value })} className="w-full rounded-lg bg-white/5 text-white border border-white/10 p-2 text-sm resize-none h-16" />
        </div>
        <div>
          <Label className="text-white text-xs">Artist Name</Label>
          <Input value={data.artist_name || ""} onChange={(e) => setData({ ...data, artist_name: e.target.value })} className="h-9 text-sm bg-white/5 text-white border-white/10" />
        </div>
        <div>
          <Label className="text-white text-xs">Featured</Label>
          <Select value={data.is_featured ? "true" : "false"} onValueChange={(v) => setData({ ...data, is_featured: v === "true" })}>
            <SelectTrigger className="h-9 text-sm bg-white/5 text-white border-white/10"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-charcoal-800 border-white/10">
              <SelectItem value="true" className="text-white">Featured</SelectItem>
              <SelectItem value="false" className="text-white">Not Featured</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-white text-xs">Venue</Label>
          <Input value={data.venue || ""} onChange={(e) => setData({ ...data, venue: e.target.value })} className="h-9 text-sm bg-white/5 text-white border-white/10" />
        </div>
        <div>
          <Label className="text-white text-xs">Venue Address</Label>
          <Input value={data.venue_address || ""} onChange={(e) => setData({ ...data, venue_address: e.target.value })} className="h-9 text-sm bg-white/5 text-white border-white/10" />
        </div>
        <div>
          <Label className="text-white text-xs">Date</Label>
          <Input type="date" value={data.date?.split("T")[0] || data.date || ""} onChange={(e) => setData({ ...data, date: e.target.value })} className="h-9 text-sm bg-white/5 text-white border-white/10" />
        </div>
        <div>
          <Label className="text-white text-xs">Time</Label>
          <Input type="time" value={data.time || "18:00"} onChange={(e) => setData({ ...data, time: e.target.value })} className="h-9 text-sm bg-white/5 text-white border-white/10" />
        </div>
        <div>
          <Label className="text-white text-xs">Image URL</Label>
          <Input value={data.image_url || ""} onChange={(e) => setData({ ...data, image_url: e.target.value })} className="h-9 text-sm bg-white/5 text-white border-white/10" />
        </div>
        <div>
          <Label className="text-white text-xs">Thumbnail URL</Label>
          <Input value={data.thumbnail_url || ""} onChange={(e) => setData({ ...data, thumbnail_url: e.target.value })} className="h-9 text-sm bg-white/5 text-white border-white/10" />
        </div>
        <div className="col-span-2">
          <Label className="text-white text-xs">Venue Plan / Layout</Label>
          <div
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith("image/")) uploadFile(f, (url) => setData({ ...data, venue_plan: url })); }}
            onDragOver={(e) => e.preventDefault()}
            className="relative border-2 border-dashed border-white/10 rounded-lg p-4 text-center cursor-pointer hover:border-crimson-500/50 transition-colors"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = () => { const f = input.files?.[0]; if (f) uploadFile(f, (url) => setData({ ...data, venue_plan: url })); };
              input.click();
            }}
          >
            {data.venue_plan ? (
              <div className="flex items-center gap-3">
                <img src={data.venue_plan} alt="Venue plan" className="h-12 w-20 object-cover rounded" />
                <span className="text-xs text-gray-400 truncate flex-1">{data.venue_plan}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); setData({ ...data, venue_plan: "" }); }} className="text-crimson-500 text-xs">Remove</button>
              </div>
            ) : (
              <div className="text-gray-400 text-sm flex flex-col items-center gap-1">
                <CloudUpload className="w-5 h-5" />
                <span>Drop an image or click to upload</span>
                <span className="text-[10px] text-gray-500">or paste a URL below</span>
              </div>
            )}
          </div>
          <Input value={data.venue_plan || ""} onChange={(e) => setData({ ...data, venue_plan: e.target.value })} placeholder="https://example.com/venue-layout.png" className="h-9 text-sm bg-white/5 text-white border-white/10 mt-2" />
        </div>
        <div>
          <Label className="text-white text-xs">Total Tickets</Label>
          <Input type="number" value={data.total_tickets || "1000"} onChange={(e) => setData({ ...data, total_tickets: e.target.value })} className="h-9 text-sm bg-white/5 text-white border-white/10" />
        </div>
        <div>
          <Label className="text-white text-xs">Users Attending</Label>
          <Input type="number" value={data.users_attending ?? 0} onChange={(e) => setData({ ...data, users_attending: Number(e.target.value) })} className="h-9 text-sm bg-white/5 text-white border-white/10" />
        </div>
        <div>
          <Label className="text-white text-xs">Trending</Label>
          <Select value={data.is_trending ? "true" : "false"} onValueChange={(v) => setData({ ...data, is_trending: v === "true" })}>
            <SelectTrigger className="h-9 text-sm bg-white/5 text-white border-white/10"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-charcoal-800 border-white/10">
              <SelectItem value="true" className="text-white">Trending</SelectItem>
              <SelectItem value="false" className="text-white">Not Trending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <hr className="border-white/10" />
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ticket Categories</p>
      <p className="text-[10px] text-gray-500">Each category gets its own pricing and seat inventory</p>

      {(data.categories || []).map((cat: any, idx: number) => (
        <Card key={idx} className="p-3 bg-white/5 border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-medium">Category {idx + 1}</span>
            <button onClick={() => removeCat(idx, data, setData)} className="text-crimson-500 hover:text-crimson-400"><X className="w-3 h-3" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-white text-[10px]">Name</Label>
              <Input value={cat.name} onChange={(e) => updateCat(idx, "name", e.target.value, data, setData)} placeholder="e.g. VIP" className="h-8 text-xs bg-white/5 text-white border-white/10" />
            </div>
            <div>
              <Label className="text-white text-[10px]">Price (₹)</Label>
              <Input type="number" value={cat.price} onChange={(e) => updateCat(idx, "price", e.target.value, data, setData)} placeholder="1999" className="h-8 text-xs bg-white/5 text-white border-white/10" />
            </div>
            <div>
              <Label className="text-white text-[10px]">Total Seats</Label>
              <Input type="number" value={cat.total_seats} onChange={(e) => updateCat(idx, "total_seats", e.target.value, data, setData)} className="h-8 text-xs bg-white/5 text-white border-white/10" />
            </div>
            <div>
              <Label className="text-white text-[10px]">Available Seats</Label>
              <Input type="number" value={cat.available_seats} onChange={(e) => updateCat(idx, "available_seats", e.target.value, data, setData)} className="h-8 text-xs bg-white/5 text-white border-white/10" />
            </div>
            <div className="col-span-2">
              <Label className="text-white text-[10px]">Description</Label>
              <Input value={cat.description || ""} onChange={(e) => updateCat(idx, "description", e.target.value, data, setData)} placeholder="e.g. Front row seats with premium access" className="h-8 text-xs bg-white/5 text-white border-white/10" />
            </div>
            <div>
              <Label className="text-white text-[10px]">Color</Label>
              <div className="flex gap-1.5 mt-1">
                {COLORS.map((c) => (
                  <button key={c.value} type="button" onClick={() => updateCat(idx, "color", c.value, data, setData)} className={cn("w-5 h-5 rounded-full border-2", cat.color === c.value ? "border-white" : "border-transparent")} style={{ backgroundColor: c.value }} title={c.label} />
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}

      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => addCat(data, setData)}>
        <Plus className="w-3 h-3 mr-1" /> Add Category
      </Button>
    </div>
  );

  const filtered = events.filter((e) => !search || e.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Live Events</h1>
          <p className="text-gray-400 mt-1">{events.length} total events</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Event
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-charcoal-800 border-white/5 text-white" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 bg-charcoal-800 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center bg-charcoal-800 border-white/5">
          <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No events found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((event, i) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="overflow-hidden bg-charcoal-800 border-white/5">
                <div className="relative h-40 bg-gradient-to-br from-crimson-900/50 to-charcoal-900">
                  {event.image_url && <img src={event.image_url} alt={event.title} className="w-full h-full object-cover opacity-50" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <button onClick={() => toggleLive(event.id, event.is_live)} className={cn("p-2 rounded-lg transition-colors", event.is_live ? "bg-green-500/20 text-green-500" : "bg-gray-500/20 text-gray-400")}>
                      {event.is_live ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className={cn("px-2 py-1 rounded text-xs font-semibold", event.is_live ? "bg-green-500 text-white" : "bg-gray-500 text-white")}>{event.is_live ? "LIVE" : "Disabled"}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold truncate">{event.title}</h3>
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">{event.description}</p>
                  <div className="mt-3 space-y-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(event.date)}</div>
                    <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.venue}</div>
                    <div className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {event.categories?.length || 0} categories</div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() =>
                      setEditing({ ...event, categories: (event.categories || []).map((c: any) => ({ ...c })) })
                    }>
                      <Edit3 className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" className="flex-1" onClick={() => deleteEvent(event.id, event.title)}>
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setCreating(false)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-charcoal-800 rounded-xl p-5 w-full max-w-2xl border border-white/10 mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Create Event</h2>
              <button onClick={() => setCreating(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            {renderForm(newEvent, setNewEvent)}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setCreating(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleCreate} disabled={saving}>{saving ? "Creating..." : "Create Event"}</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setEditing(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-charcoal-800 rounded-xl p-5 w-full max-w-2xl border border-white/10 mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Edit Event</h2>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            {renderForm(editing, setEditing)}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setEditing(null)}>Cancel</Button>
              <Button className="flex-1" onClick={saveEdit} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
