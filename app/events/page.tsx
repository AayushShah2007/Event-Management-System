"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EventCard } from "@/components/event/EventCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabaseQuery } from "@/lib/supabase-rest";
import type { Event } from "@/types";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await supabaseQuery("events", {
          params: { is_live: "eq.true", order: "date.asc", limit: "50" },
          select: "*,categories:event_categories(*)",
        });
        setEvents(data || []);
      } catch (err) {
        console.log("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filtered = events.filter((e) =>
    !search || e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.artist_name.toLowerCase().includes(search.toLowerCase()) ||
    e.venue.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-charcoal-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-2">All Events</h1>
          <p className="text-gray-400">Discover amazing events near you</p>
        </motion.div>

        <div className="relative max-w-md mb-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search events by name, artist or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-12"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl text-white font-semibold mb-2">No events found</h2>
            <p className="text-gray-400">Try adjusting your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
