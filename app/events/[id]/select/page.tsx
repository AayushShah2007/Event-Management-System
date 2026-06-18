"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Minus, Plus, ArrowLeft, Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store";
import { supabase } from "@/lib/supabase";
import { supabaseQuery } from "@/lib/supabase-rest";
import type { Event, EventCategory } from "@/types";
import { formatPrice, cn } from "@/lib/utils";

export default function CategorySelectionPage() {
  const params = useParams();
  const router = useRouter();
  const { theme, addToCart, settings } = useAppStore();
  const isDark = theme === "dark";
  const curr = settings.currency || "INR";
  const rate = curr !== "INR" ? settings.exchange_rates?.[curr] : undefined;
  const maxTickets = settings.max_tickets_per_order || 10;

  const [event, setEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const [data, catData] = await Promise.all([
          supabaseQuery(`events?id=eq.${params.id}`).then((r) => Array.isArray(r) ? r[0] : r),
          supabaseQuery("event_categories", { params: { event_id: `eq.${params.id}` }, select: "*" }),
        ]);

        if (!data) throw new Error("Event not found");
        setEvent(data);
        const cats = Array.isArray(catData) ? catData : [];
        setCategories(cats);
        
        if (cats.length) {
          setSelectedCategory(cats[0]);
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchEvent();
  }, [params.id, router]);

  const handleProceed = () => {
    if (!selectedCategory || !event) return;
    router.push(`/checkout/details?event=${event.id}&category=${selectedCategory.id}&qty=${quantity}`);
  };

  const totalPrice = selectedCategory ? selectedCategory.price * quantity : 0;

  if (loading) {
    return (
      <div className={cn("min-h-screen", isDark ? "bg-charcoal-900" : "bg-gray-50")}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className={cn("min-h-screen", isDark ? "bg-charcoal-900" : "bg-gray-50")}>
      {/* Header */}
      <div className={cn("border-b", isDark ? "border-white/5 bg-charcoal-800" : "border-gray-200 bg-white")}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Event
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Event Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4 mb-8"
        >
          <div className="w-24 h-24 rounded-lg overflow-hidden relative flex-shrink-0">
            <Image
              src={event.thumbnail_url || event.image_url}
              alt={event.title}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{event.title}</h1>
            <p className="text-gray-400 mb-2">{event.artist_name}</p>
            <p className="text-sm text-gray-500">{event.venue}</p>
          </div>
        </motion.div>

        {/* Venue Layout */}
        {event.venue_plan && (
          <Card className={cn("mb-6 p-6", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
            <h2 className="text-xl font-bold text-white mb-4">Venue Layout</h2>
            <img src={event.venue_plan} alt="Venue layout" className="w-full rounded-lg" />
          </Card>
        )}

        {/* Stage Layout */}
        <Card className={cn("mb-8 p-6", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
          <h2 className="text-xl font-bold text-white mb-6">Select Your Category</h2>
          
          {!event.venue_plan && categories.length > 0 && (
            <div className="mb-8 relative">
              <div className="h-16 bg-gradient-to-b from-crimson-600/30 to-transparent rounded-t-lg flex items-end justify-center">
                <div className="text-crimson-500 text-sm font-medium mb-2">STAGE</div>
              </div>
              
              {/* Dynamic Category Tiers */}
              <div className="relative mt-4" style={{ height: Math.max(categories.length * 56, 48) }}>
                {[...categories].sort((a, b) => a.price - b.price).map((cat, idx) => {
                  const top = idx * 56;
                  const width = Math.min(80 + idx * 48, 320);
                  return (
                    <motion.div
                      key={cat.id}
                      className={cn(
                        "absolute left-1/2 -translate-x-1/2 h-12 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all",
                        selectedCategory?.id === cat.id
                          ? "border-crimson-500 bg-crimson-500/20"
                          : "border-white/10 bg-white/5"
                      )}
                      style={{ top, width }}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      <span className="font-bold text-sm" style={{ color: cat.color || "#fff" }}>{cat.name.toUpperCase()}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Category Cards */}
          <div className="space-y-3">
            {[...categories].sort((a, b) => a.price - b.price).map((category) => (
              <motion.div
                key={category.id}
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "p-4 rounded-lg border cursor-pointer transition-all",
                  selectedCategory?.id === category.id
                    ? isDark
                      ? "border-crimson-500 bg-crimson-500/10"
                      : "border-crimson-500 bg-crimson-50"
                    : isDark
                    ? "border-white/10 hover:border-white/20"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <h3 className="text-white font-semibold">{category.name}</h3>
                      <p className="text-sm text-gray-400">{category.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {category.available_seats} seats available
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gold-500">{formatPrice(category.price, curr, rate)}</p>
                    {selectedCategory?.id === category.id && (
                      <Check className="w-5 h-5 text-crimson-500 ml-auto" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Quantity Selection */}
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={cn("p-6", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
              <h2 className="text-xl font-bold text-white mb-4">Number of Tickets</h2>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="text-2xl font-bold text-white w-16 text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(selectedCategory.available_seats, maxTickets, quantity + 1))}
                    disabled={quantity >= Math.min(selectedCategory.available_seats, maxTickets)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-400">Total</p>
                  <p className="text-3xl font-bold text-gold-500">{formatPrice(totalPrice, curr, rate)}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Max {maxTickets} tickets per order</p>
            </Card>

            {/* Proceed Button */}
            <Button
              size="lg"
              className="w-full mt-6"
              onClick={handleProceed}
            >
              <Zap className="w-5 h-5 mr-2" />
              Proceed to Checkout
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}