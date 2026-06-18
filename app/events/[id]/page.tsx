"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { Calendar, Clock, MapPin, Users, Share2, Heart, ArrowLeft, Ticket, Star } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/layout/Navbar";
import { EventCard } from "@/components/event/EventCard";
import { useAppStore } from "@/store";
import { supabase } from "@/lib/supabase";
import { supabaseQuery } from "@/lib/supabase-rest";
import type { Event, EventCategory } from "@/types";
import { formatDate, formatTime, formatPrice, cn, calculateTimeRemaining } from "@/lib/utils";

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { theme, user, settings } = useAppStore();
  const isDark = theme === "dark";
  const curr = settings.currency || "INR";
  const rate = curr !== "INR" ? settings.exchange_rates?.[curr] : undefined;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const [eventArr, catData, relatedData] = await Promise.all([
          supabaseQuery(`events?id=eq.${params.id}`, { select: "*" }),
          supabaseQuery(`event_categories`, { select: "*", params: { "event_id": `eq.${params.id}` } }),
          supabaseQuery("events", { select: "*", params: { "is_live": "eq.true", "id": `neq.${params.id}`, limit: "4" } }),
        ]);

        const eventData = Array.isArray(eventArr) ? eventArr[0] : eventArr;
        if (!eventData) {
          router.push("/");
          return;
        }

        setEvent(eventData);
        setCategories(catData || []);
        setRelatedEvents(relatedData || []);

        const tick = () => {
          setTimeLeft(calculateTimeRemaining(eventData.date));
        };
        tick();
        const timer = setInterval(tick, 1000);

        return () => clearInterval(timer);
      } catch (error) {
        console.error("Error fetching event:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchEvent();
  }, [params.id, router]);

  const handleBookNow = () => {
    if (!user) {
      router.push("/");
      return;
    }
    router.push(`/events/${params.id}/select`);
  };

  if (loading) {
    return (
      <div className={cn("min-h-screen", isDark ? "bg-charcoal-900" : "bg-gray-50")}>
        <Navbar onAuthClick={() => {}} />
        <div className="pt-24">
          <Skeleton className="h-96 w-full" />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <Skeleton className="h-12 w-2/3 mb-4" />
            <Skeleton className="h-6 w-1/3 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className={cn("min-h-screen", isDark ? "bg-charcoal-900" : "bg-gray-50")}>
      <Navbar onAuthClick={() => {}} />

       {/* Hero Section */}
       <div className="relative h-[60vh] md:h-[70vh]">
         <Image
           src={event.image_url}
           alt={event.title}
           fill
           sizes="100vw"
           priority
         />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/50 to-transparent" />
        
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-24 left-4 md:left-8 p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Event Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-4">
              {event.is_trending && (
                <Badge className="bg-gold-500 text-charcoal-900">
                  <Star className="w-3 h-3 mr-1" />
                  Trending
                </Badge>
              )}
              {event.is_featured && (
                <Badge variant="premium">Featured</Badge>
              )}
              {event.is_sold_out && (
                <Badge variant="soldout">Sold Out</Badge>
              )}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              {event.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 md:gap-8 text-gray-300">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-crimson-500" />
                {formatDate(event.date)}
              </div>
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-crimson-500" />
                {formatTime(event.time)}
              </div>
              <div className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-crimson-500" />
                {event.venue}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Artist Info */}
            <Card className={cn("p-6", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
              <h2 className="text-2xl font-bold text-white mb-4">Artist / Performer</h2>
              <p className="text-xl text-crimson-500 font-semibold">{event.artist_name}</p>
            </Card>

            {/* About */}
            <Card className={cn("p-6", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
              <h2 className="text-2xl font-bold text-white mb-4">About This Event</h2>
              <p className="text-gray-400 leading-relaxed">{event.description}</p>
            </Card>

            {/* Venue */}
            <Card className={cn("p-6", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
              <h2 className="text-2xl font-bold text-white mb-4">Venue</h2>
              <div className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 text-crimson-500 mt-1" />
                <div>
                  <p className="text-white font-semibold">{event.venue}</p>
                  <p className="text-gray-400">{event.venue_address}</p>
                </div>
              </div>
            </Card>

            {/* Venue Plan / Layout */}
            {event.venue_plan && (
              <Card className={cn("p-6", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
                <h2 className="text-2xl font-bold text-white mb-4">Venue Layout</h2>
                <img src={event.venue_plan} alt="Venue layout" className="w-full rounded-lg" />
              </Card>
            )}

            {/* Ticket Categories */}
              <Card className={cn("p-6", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
                <h2 className="text-2xl font-bold text-white mb-6">Ticket Categories</h2>
                {categories.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No categories found for this event</p>
                    <p className="text-xs text-gray-500">Please check database or contact admin</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[...categories].sort((a, b) => a.price - b.price).map((category, index) => (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "p-4 rounded-lg border flex items-center justify-between",
                          isDark
                            ? "bg-white/5 border-white/10 hover:border-crimson-500/30"
                            : "bg-gray-50 border-gray-200 hover:border-crimson-500"
                        )}
                      >
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-4"
                            style={{ backgroundColor: category.color || "#dc2626" }}
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
                          <p className="text-2xl font-bold text-gold-500">
                            {formatPrice(category.price, curr, rate)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
          </div>

          {/* Right Column - Booking */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Countdown Timer */}
              {!event.is_sold_out && !timeLeft.isExpired && (
                <Card className="p-6 bg-gradient-to-br from-crimson-900 to-charcoal-900 border-crimson-500/30">
                  <h3 className="text-white font-semibold mb-4">Event Starts In</h3>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: "Days", value: timeLeft.days },
                      { label: "Hours", value: timeLeft.hours },
                      { label: "Mins", value: timeLeft.minutes },
                      { label: "Secs", value: timeLeft.seconds },
                    ].map((item) => (
                      <div key={item.label} className="bg-white/10 rounded-lg p-2">
                        <div className="text-2xl font-bold text-white">
                          {String(item.value).padStart(2, "0")}
                        </div>
                        <div className="text-xs text-gray-400">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Booking Card */}
              <Card className={cn("p-6", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
                <div className="mb-4">
                  <span className="text-sm text-gray-400">Starting from</span>
                  <p className="text-3xl font-bold text-gold-500">
                    {categories.length ? formatPrice(Math.min(...categories.map((c) => c.price)), curr, rate) : "—"}
                  </p>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Tickets</span>
                    <span className="text-white">{event.total_tickets - event.sold_tickets} available</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Users Attending</span>
                    <span className="text-white">{event.users_attending ?? event.sold_tickets ?? 0}</span>
                  </div>
                </div>

                <Button
                  onClick={handleBookNow}
                  disabled={event.is_sold_out}
                  size="lg"
                  className="w-full"
                >
                  <Ticket className="w-5 h-5 mr-2" />
                  {event.is_sold_out ? "Sold Out" : "Book Now"}
                </Button>

                <div className="mt-4 flex justify-center gap-4">
                  <button 
                    onClick={() => {
                      setIsFavorited(!isFavorited);
                      toast.success(isFavorited ? "Removed from favorites" : "Added to favorites!");
                    }}
                    className={cn(
                      "p-2 rounded-full transition-colors",
                      isFavorited ? "bg-crimson-500/20" : "hover:bg-white/10"
                    )}
                  >
                    <Heart 
                      className={cn(
                        "w-5 h-5 transition-colors",
                        isFavorited ? "text-crimson-500" : "text-gray-400"
                      )}
                    />
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success("Link copied!");
                    }}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <Share2 className="w-5 h-5 text-gray-400 hover:text-crimson-500" />
                  </button>
                </div>
              </Card>

              {/* Tags */}
              <Card className={cn("p-4", isDark ? "bg-charcoal-800/50 border-white/5" : "bg-gray-50")}>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-white/10 text-white border-white/20">Instant Booking</Badge>
                  <Badge className="bg-white/10 text-white border-white/20">Secure Payment</Badge>
                  <Badge className="bg-white/10 text-white border-white/20">E-Ticket</Badge>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-white mb-8">Related Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedEvents.map((evt, index) => (
                <EventCard key={evt.id} event={evt} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}