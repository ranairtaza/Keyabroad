import { getPublishedCountries } from '@/lib/data/countries';
import { CountryCard } from '@/components/shared/CountryCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Study Destinations | KeyAbroad',
  description: 'Explore world-class study destinations and find the perfect country for your international education.',
};

export default async function DestinationsPage() {
  const countries = await getPublishedCountries();

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

      {/* Grid Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {countries.length === 0 ? (
          <EmptyState 
            title="Destinations are being updated."
            description="We are actively reviewing and verifying our partner countries. Check back soon!"
            iconType="destination"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {countries.map((country: any) => (
              <CountryCard key={country.id} country={country} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
