"use client";

import DestinationSlider from "@/components/DestinationSlider";

export default function DestinationsPage() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50">
      {/* Header Banner */}
      <section className="relative py-24 bg-[#0a1930] overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Explore Destinations</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Discover world-class universities in top educational hubs across the globe.
          </p>
        </div>
      </section>

      {/* Slider Section */}
      <div className="py-12">
        <DestinationSlider />
      </div>
    </div>
  );
}
