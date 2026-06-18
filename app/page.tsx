"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sparkles, Zap, Ticket, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/layout/Navbar";
import { AuthModal } from "@/components/layout/AuthModal";
import { LocationPopup } from "@/components/layout/LocationPopup";
import { Footer } from "@/components/layout/Footer";
import { EventCard } from "@/components/event/EventCard";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/store";
import { supabase } from "@/lib/supabase";
import { supabaseQuery } from "@/lib/supabase-rest";
import type { Event, Review } from "@/types";
import { cn, calculateTimeRemaining, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ReviewModal } from "@/components/shared/ReviewModal";

export default function HomePage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroEvent, setHeroEvent] = useState<Event | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const { theme, user } = useAppStore();
  const isDark = theme === "dark";

  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        setShowAuthModal(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await Promise.race([
          supabaseQuery("events", { params: { "is_live": "eq.true", order: "date.asc", limit: "20" }, select: "*,categories:event_categories(*)" }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 10000))
        ]);

        setEvents(data || []);
        
        if (data?.length) {
          const featured = data.find((e: Event) => e.is_featured);
          setHeroEvent(featured || data[0]);
        }
      } catch (err) {
        console.log("Events fetch timeout - database not set up yet");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    fetch("/api/reviews?limit=3")
      .then((r) => r.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const featuredEvents = events.filter((e) => e.is_featured).slice(0, 6);
  const trendingEvents = events.filter((e) => e.is_trending).slice(0, 4);
  const upcomingEvents = events.slice(0, 8);

  return (
    <div className={cn("min-h-screen", isDark ? "bg-charcoal-900" : "bg-gray-50")}>
      {/* Navbar */}
      <Navbar onAuthClick={() => setShowAuthModal(true)} />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
           {/* Background */}
           <div className="absolute inset-0">
             {heroEvent ? (
               <div className="absolute inset-0">
                 <Image
                   src={heroEvent.image_url}
                   alt={heroEvent.title}
                   fill
                   sizes="100vw"
                   style={{ 
                     objectPosition: 'center',
                     objectFit: 'cover'
                   }}
                 />
                 <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/70 via-charcoal-900/50 to-charcoal-900" />
                 <div className="absolute inset-0 bg-gradient-to-r from-crimson-900/30 via-transparent to-purple-900/30" />
               </div>
             ) : (
               <>
                 <div className="absolute inset-0 bg-gradient-to-br from-charcoal-900 via-charcoal-800 to-charcoal-900" />
                 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(220,38,38,0.15),_transparent_50%)]" />
                 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(147,51,234,0.1),_transparent_50%)]" />
               </>
             )}
          
          {/* Animated Particles - Static positions to avoid hydration error */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute w-1 h-1 bg-crimson-500/30 rounded-full animate-pulse" style={{ left: "10%", top: "110%", animationDelay: "0s", animationDuration: "15s" }} />
            <div className="absolute w-1 h-1 bg-crimson-500/30 rounded-full animate-pulse" style={{ left: "25%", top: "110%", animationDelay: "2s", animationDuration: "12s" }} />
            <div className="absolute w-1 h-1 bg-crimson-500/30 rounded-full animate-pulse" style={{ left: "40%", top: "110%", animationDelay: "4s", animationDuration: "18s" }} />
            <div className="absolute w-1 h-1 bg-crimson-500/30 rounded-full animate-pulse" style={{ left: "55%", top: "110%", animationDelay: "1s", animationDuration: "14s" }} />
            <div className="absolute w-1 h-1 bg-crimson-500/30 rounded-full animate-pulse" style={{ left: "70%", top: "110%", animationDelay: "3s", animationDuration: "16s" }} />
            <div className="absolute w-1 h-1 bg-crimson-500/30 rounded-full animate-pulse" style={{ left: "85%", top: "110%", animationDelay: "5s", animationDuration: "13s" }} />
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm text-white mb-8"
            >
              <Sparkles className="w-4 h-4 mr-2 text-gold-500" />
              Premium Event Experience
            </motion.div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Discover & Book
              <br />
              <span className="text-gradient">Amazing Events</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-10">
              Your gateway to unforgettable experiences. Concerts, shows, sports and more at your fingertips.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={user ? "#events" : "/#events"}>
                <Button size="xl" className="group">
                  <Ticket className="w-5 h-5 mr-2" />
                  Browse Events
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              {!user && (
                <Button 
                  size="xl" 
                  variant="glass" 
                  onClick={() => setShowAuthModal(true)}
                >
                  Sign In
                </Button>
              )}
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-16"
            >
              {[
                { icon: Users, label: "Users", value: "50K+" },
                { icon: Ticket, label: "Events", value: "1000+" },
                { icon: TrendingUp, label: "Sold", value: "1M+" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <stat.icon className="w-8 h-8 mx-auto mb-2 text-crimson-500" />
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-2 bg-white rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Events Section */}
      <section id="events" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Upcoming Events
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Explore the hottest events happening near you
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {upcomingEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* Trending Section */}
      {trendingEvents.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-12"
          >
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">
                Trending Now
              </h2>
              <p className="text-gray-400">Most popular events this month</p>
            </div>
            <Button variant="ghost" className="text-crimson-500">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* Featured Section */}
      {featuredEvents.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-white mb-4">
              Featured Events
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Handpicked events for an unforgettable experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">What Our Users Say</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Join thousands of happy event-goers</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-xl bg-charcoal-800 border border-white/5 hover:border-white/10 transition-all flex flex-col"
            >
              <div className="flex-1">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-gold-500 fill-current" viewBox="0 0 20 20"><path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.33L10 13.07l-4.77 2.65.91-5.33L2.27 6.62l5.34-.78L10 1z"/></svg>
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">&ldquo;{t.comment}&rdquo;</p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-crimson-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{t.user_name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{t.user_name}</p>
                  <p className="text-gray-500 text-xs">{formatDate(t.created_at)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-4 mt-10"
        >
          {!showAllReviews && reviews.length >= 3 && (
            <Button variant="glass" onClick={() => {
              setShowAllReviews(true);
              fetch("/api/reviews?limit=8")
                .then((r) => r.json())
                .then((data) => setReviews(Array.isArray(data) ? data : []))
                .catch(() => {});
            }} className="px-8">
              See More Reviews
            </Button>
          )}
          {showAllReviews && (
            <Button variant="glass" onClick={() => {
              setShowAllReviews(false);
              fetch("/api/reviews?limit=3")
                .then((r) => r.json())
                .then((data) => setReviews(Array.isArray(data) ? data : []))
                .catch(() => {});
            }} className="px-8">
              Show Less
            </Button>
          )}
          <Button onClick={() => setShowReviewModal(true)} className="px-8">
            Write a Review
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Review Modal */}
      <ReviewModal
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmitted={() => {
          fetch("/api/reviews?limit=3")
            .then((r) => r.json())
            .then((data) => setReviews(Array.isArray(data) ? data : []))
            .catch(() => {});
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Location Popup */}
      <LocationPopup />
    </div>
  );
}