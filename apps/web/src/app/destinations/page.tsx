import { destinations } from '@/data/destinations';
import { CountryCard } from '@/components/shared/CountryCard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Study Destinations | KeyAbroad',
  description: 'Explore world-class study destinations and find the perfect country for your international education.',
  alternates: {
    canonical: '/destinations',
  },
};

export default function DestinationsPage() {
  const mappedCountries = destinations.map(dest => ({
    id: dest.id,
    name: dest.name,
    slug: dest.id,
    description: dest.about,
    image_url: dest.image,
    flag_code: dest.flagCode,
    universities: [{ count: dest.universities.length }]
  }));

  return (
    <div className="flex flex-col w-full min-h-screen bg-slate-50">
      {/* Header Banner */}
      <section className="relative py-32 bg-slate-900 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0 opacity-60 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524850011238-e3d235c7d4c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')" }}
        />
        {/* Blur Overlay */}
        <div className="absolute inset-0 z-0 bg-blue-900/40 backdrop-blur-[2px]" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Explore Destinations</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Discover world-class universities in top educational hubs across the globe.
          </p>
        </div>
      </section>

      {/* Grid Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mappedCountries.map((country) => (
            <CountryCard key={country.id} country={country} />
          ))}
        </div>
      </section>
    </div>
  );
}
