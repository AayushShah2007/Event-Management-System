"use client";
import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];

    setVisible(true);
    setProgress(20);

    timerRef.current.push(setTimeout(() => setProgress(50), 200));
    timerRef.current.push(setTimeout(() => setProgress(80), 500));
    timerRef.current.push(setTimeout(() => {
      setProgress(100);
      timerRef.current.push(setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300));
    }, 900));

    return () => timerRef.current.forEach(clearTimeout);
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px]">
      <div
        className="h-full bg-gradient-to-r from-crimson-500 via-purple-500 to-gold-500 transition-all duration-300 ease-out shadow-lg shadow-crimson-500/50"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
