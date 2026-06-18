"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export function ReviewModal({ open, onClose, onSubmitted }: ReviewModalProps) {
  const { user, theme, settings } = useAppStore();
  const isDark = theme === "dark";
  const needsApproval = settings.review_approval_required === true;
  const autoPublish = settings.auto_publish_reviews !== false;
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) { toast.error("Please select a rating"); return; }
    if (!comment.trim()) { toast.error("Please write a review"); return; }
    if (!user) { toast.error("Please sign in to review"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          user_name: user.email?.split("@")[0] || "Anonymous",
          rating,
          comment: comment.trim(),
        }),
      });
      if (!res.ok) { const errBody = await res.json().catch(() => ({ error: res.statusText })); throw new Error(errBody.error || "Failed to submit"); }
      toast.success("Review submitted!");
      setRating(0);
      setComment("");
      onSubmitted();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={cn(
              "relative w-full max-w-md rounded-2xl p-6 shadow-2xl",
              isDark ? "bg-charcoal-800 border border-white/10" : "bg-white"
            )}
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Write a Review</h3>
            <p className="text-gray-400 text-sm mb-6">Share your experience with our platform</p>

            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      (hovered || rating) >= star
                        ? "fill-gold-500 text-gold-500"
                        : "text-gray-600"
                    )}
                  />
                </button>
              ))}
            </div>

            <textarea
              placeholder="Tell us about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className={cn(
                "w-full rounded-lg border px-4 py-3 text-sm outline-none resize-none transition-colors",
                isDark
                  ? "bg-charcoal-900 border-white/10 text-white placeholder:text-gray-600 focus:border-crimson-500"
                  : "bg-gray-50 border-gray-200 text-gray-900 focus:border-crimson-500"
              )}
            />

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </div>
            {needsApproval && !autoPublish && (
              <p className="text-xs text-gray-500 text-center mt-3">Reviews require admin approval before going live.</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
