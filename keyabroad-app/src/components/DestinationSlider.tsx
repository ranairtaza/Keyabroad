"use client";

import { useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { destinations } from "@/data/destinations";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Hover3DWrapper from "@/components/Hover3DWrapper";

export default function DestinationSlider() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 2000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  const scrollLeft = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollRight = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
          <div className="max-w-2xl">
            <span className="text-primary font-semibold uppercase tracking-wider text-sm mb-2 block">
              Where to next?
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
              Explore Our Top Study Destinations
            </h2>
          </div>
          <p className="text-slate-600 max-w-xl text-lg border-l-4 border-primary pl-4">
            Whether you're looking for cutting-edge research facilities, vibrant campus life, or incredible post-graduation work opportunities, we'll help you find the perfect country to call your new home.
          </p>
        </div>

        <div className="relative group">
          {/* Left Button */}
          <button
            onClick={scrollLeft}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-blue-600"
            aria-label="Previous destination"
          >
            <ArrowLeft size={24} />
          </button>

          {/* Slider Container */}
          <div className="overflow-hidden pb-8 pt-4 -mx-4 px-4 sm:mx-0 sm:px-0" ref={emblaRef}>
            <div className="flex -ml-6">
              {destinations.map((destination, index) => (
                <div 
                  key={`${destination.id}-${index}`}
                  className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333333%] pl-6"
                >
                  <Hover3DWrapper intensity="subtle" className="w-full">
                    <Link
                      href={`/destinations/${destination.id}`}
                      className="relative block w-full h-[300px] rounded-2xl overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-all"
                      style={{ transform: "translateZ(20px)" }}
                    >
                    <Image
                      src={destination.image}
                      alt={destination.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      priority={index < 3}
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6" style={{ transform: "translateZ(30px)" }}>
                      <div className="flex items-center gap-3 mb-2">
                        {destination.flagCode && (
                          <img 
                            src={`https://flagcdn.com/w40/${destination.flagCode.toLowerCase()}.png`} 
                            srcSet={`https://flagcdn.com/w80/${destination.flagCode.toLowerCase()}.png 2x`}
                            width="32" 
                            alt={`${destination.name} flag`}
                            className="rounded shadow-sm"
                          />
                        )}
                        <h3 className="text-2xl font-bold text-white drop-shadow-md">
                          Study in {destination.name}
                        </h3>
                      </div>
                      {/* Small preview of universities */}
                      <div className="opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                        <p className="text-slate-200 text-sm mb-2 font-medium">Top Universities:</p>
                        <ul className="text-white/90 text-sm space-y-1">
                          {destination.universities.slice(0, 3).map((uni, idx) => (
                            <li key={idx} className="truncate drop-shadow-md">• {uni.name}</li>
                          ))}
                          {destination.universities.length > 3 && (
                            <li className="text-white/70 italic text-xs mt-1 drop-shadow-md">
                              +{destination.universities.length - 3} more...
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                    </Link>
                  </Hover3DWrapper>
                </div>
              ))}
            </div>
          </div>

          {/* Right Button */}
          <button
            onClick={scrollRight}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-blue-600"
            aria-label="Next destination"
          >
            <ArrowRight size={24} />
          </button>
        </div>
      </div>
    </section>
  );
}
