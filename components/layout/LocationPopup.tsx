"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store";
import { MUMBAI_CITIES } from "@/types";
import { cn } from "@/lib/utils";

export function LocationPopup() {
  const { user, location, setLocation, showLocationPopup, setShowLocationPopup } = useAppStore();
  const [selectedCity, setSelectedCity] = useState("");
  const [step, setStep] = useState<"state" | "city">("state");

  useEffect(() => {
    if (user && !location) {
      const timer = setTimeout(() => {
        setShowLocationPopup(true);
      }, 60000); // 1 minute
      return () => clearTimeout(timer);
    }
  }, [user, location, setShowLocationPopup]);

  const handleSelectState = () => {
    setStep("city");
  };

  const handleConfirm = () => {
    if (!selectedCity) return;
    setLocation({ state: "Maharashtra", city: selectedCity, display: `${selectedCity}, Mumbai` });
    setShowLocationPopup(false);
    setSelectedCity("");
    setStep("state");
  };

  const handleSkip = () => {
    setShowLocationPopup(false);
    setSelectedCity("");
    setStep("state");
  };

  return (
    <AnimatePresence>
      {showLocationPopup && user && !location && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-charcoal-800 border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-crimson-600/20 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-crimson-500" />
              </div>
              <h2 className="text-2xl font-bold text-white">Choose Your Location</h2>
              <p className="text-gray-400 text-sm mt-2">
                Select your city to find events near you
              </p>
            </div>

            {step === "state" ? (
              <div className="space-y-3">
                <button
                  onClick={handleSelectState}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-crimson-500" />
                    <div className="text-left">
                      <p className="text-white font-medium">Mumbai</p>
                      <p className="text-gray-400 text-xs">Maharashtra</p>
                    </div>
                  </div>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </button>

                <Button
                  variant="ghost"
                  className="w-full text-gray-400"
                  onClick={handleSkip}
                >
                  Skip for now
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-400 mb-2">Select your area in Mumbai:</p>
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                  {MUMBAI_CITIES.map((city) => (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(city)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg text-sm transition-colors",
                        selectedCity === city
                          ? "bg-crimson-600/20 text-crimson-500 border border-crimson-500/30"
                          : "text-gray-300 hover:bg-white/5 border border-transparent"
                      )}
                    >
                      <span>{city}</span>
                      {selectedCity === city && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="ghost"
                    className="flex-1 text-gray-400"
                    onClick={handleSkip}
                  >
                    Skip
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleConfirm}
                    disabled={!selectedCity}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
