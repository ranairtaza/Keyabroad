"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@keyabroad/auth/legacy";

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Only track actual page loads
    if (!pathname) return;

    const trackVisit = async () => {
      try {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        await fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page_url: pathname,
            referrer: document.referrer || "direct",
            device_type: isMobile ? "mobile" : "desktop"
          })
        });
      } catch (err) {
        // Silently fail if network error
        console.error("Failed to track visit", err);
      }
    };

    trackVisit();
  }, [pathname]);

  return null; // This component doesn't render anything
}
