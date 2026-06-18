"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Ticket, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime, formatPrice, cn } from "@/lib/utils";
import type { Event, EventCategory } from "@/types";
import { useAppStore } from "@/store";

interface EventCardProps {
  event: Event;
  index?: number;
}

export function EventCard({ event, index = 0 }: EventCardProps) {
  const { theme, settings } = useAppStore();
  const curr = settings.currency || "INR";
  const rate = curr !== "INR" ? settings.exchange_rates?.[curr] : undefined;
  const isDark = theme === "dark";

  const minPrice = event.categories?.length
    ? Math.min(...event.categories.map((c) => c.price))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/events/${event.id}`}>
        <Card
          className={cn(
            "group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-crimson-600/10",
            isDark
              ? "bg-charcoal-800 border-white/5 hover:border-crimson-500/30"
              : "bg-white border-gray-200"
          )}
        >
          {/* Image Container */}
           <div className="relative aspect-[16/10] overflow-hidden">
             <Image
               src={event.thumbnail_url || event.image_url}
               alt={event.title}
               fill
               sizes="100vw"
               className="object-cover transition-transform duration-500 group-hover:scale-110"
             />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              {event.is_trending && (
                <Badge variant="default" className="bg-gold-500 text-charcoal-900">
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

            {/* Live Badge */}
            {event.is_live && (
              <div className="absolute top-3 right-3">
                <Badge className="bg-crimson-600 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white mr-1.5 animate-pulse" />
                  LIVE
                </Badge>
              </div>
            )}

            {/* Date Badge */}
            <div className="absolute bottom-3 left-3">
              <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 text-center">
                <div className="text-xs text-gray-300 uppercase">
                  {new Date(event.date).toLocaleDateString("en-US", { month: "short" })}
                </div>
                <div className="text-xl font-bold text-white">
                  {new Date(event.date).getDate()}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-crimson-500 transition-colors">
              {event.title}
            </h3>
            
            <p className="text-sm text-gray-400 mb-3 line-clamp-1">
              {event.artist_name}
            </p>

            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-400">
                <Calendar className="w-4 h-4 mr-2 text-crimson-500" />
                <span>{formatDate(event.date)} • {formatTime(event.time)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-400">
                <MapPin className="w-4 h-4 mr-2 text-crimson-500" />
                <span className="line-clamp-1">{event.venue}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500">Starting from</span>
                <p className="text-lg font-bold text-gold-500">
                  {formatPrice(minPrice, curr, rate)}
                </p>
              </div>
              <Button
                size="sm"
                disabled={event.is_sold_out}
                className={cn(
                  event.is_sold_out && "opacity-50 cursor-not-allowed"
                )}
              >
                <Ticket className="w-4 h-4 mr-2" />
                {event.is_sold_out ? "Sold Out" : "Book Now"}
              </Button>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}