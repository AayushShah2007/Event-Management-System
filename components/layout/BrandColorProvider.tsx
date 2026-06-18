"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store";

export function BrandColorProvider({ children }: { children: React.ReactNode }) {
  const brandColor = useAppStore((s) => s.settings.brand_color);

  useEffect(() => {
    if (brandColor) {
      document.documentElement.style.setProperty("--brand-color", brandColor);
    }
  }, [brandColor]);

  return <>{children}</>;
}
