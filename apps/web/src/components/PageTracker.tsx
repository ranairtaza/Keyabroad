"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Only track actual page loads
    if (!pathname) return;

    const trackVisit = async () => {
      try {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        await supabase.from("website_visits").insert([{
          page_url: pathname,
          referrer: document.referrer || "direct",
          device_type: isMobile ? "mobile" : "desktop"
        }]);
      } catch (err) {
        // Silently fail if table isn't created yet or network error
        console.error("Failed to track visit", err);
      }
    };

    trackVisit();
  }, [pathname]);

  return null; // This component doesn't render anything
}
