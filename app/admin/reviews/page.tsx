"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, Star, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { formatDate, cn } from "@/lib/utils";
import type { Review } from "@/types";
import toast from "react-hot-toast";

export default function AdminReviewsPage() {
  const { theme } = useAppStore();
  const isDark = theme === "dark";
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    try {
      const res = await fetch("/api/reviews");
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReviews(); }, []);

  const deleteReview = async (id: string) => {
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setReviews((prev) => prev.filter((r) => r.id !== id));
      toast.success("Review deleted");
    } catch {
      toast.error("Failed to delete review");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-crimson-500 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Reviews</h1>
          <p className="text-gray-400 text-sm mt-1">{reviews.length} review{reviews.length !== 1 ? "s" : ""} total</p>
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((review, i) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className={cn("p-5 flex items-start gap-4", isDark ? "bg-charcoal-800 border-white/5" : "bg-white")}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-crimson-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5">
                {review.user_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-white font-medium text-sm">{review.user_name}</span>
                  <span className="text-gray-500 text-xs">{formatDate(review.created_at)}</span>
                </div>
                <div className="flex gap-0.5 mb-2">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className={cn("w-3.5 h-3.5", j < review.rating ? "fill-gold-500 text-gold-500" : "text-gray-600")}
                    />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteReview(review.id)}
                className="shrink-0 text-gray-500 hover:text-red-500 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          </motion.div>
        ))}
        {reviews.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500">No reviews yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
