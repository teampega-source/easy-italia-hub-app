import { GlowCard } from "@/components/ui/spotlight-card";
import { MapPin, Star, ArrowRight } from "lucide-react";

const destinations = [
  {
    name: "Roma",
    region: "Lazio",
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=300&fit=crop",
    glowColor: "blue" as const,
  },
  {
    name: "Amalfi",
    region: "Campania",
    rating: 4.8,
    image: "https://images.unsplash.com/photo-1533606688076-b6683a5f59f1?w=400&h=300&fit=crop",
    glowColor: "purple" as const,
  },
  {
    name: "Venezia",
    region: "Veneto",
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=400&h=300&fit=crop",
    glowColor: "orange" as const,
  },
];

export function Default() {
  return (
    <div className="w-screen min-h-screen flex flex-row items-center justify-center gap-10 bg-neutral-950 p-8">
      {destinations.map((dest) => (
        <GlowCard key={dest.name} glowColor={dest.glowColor} size="md">
          {/* Immagine */}
          <div className="overflow-hidden rounded-xl">
            <img
              src={dest.image}
              alt={dest.name}
              className="w-full h-40 object-cover"
            />
          </div>

          {/* Contenuto */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold text-lg">{dest.name}</h3>
              <span className="flex items-center gap-1 text-yellow-400 text-sm">
                <Star className="w-3 h-3 fill-yellow-400" />
                {dest.rating}
              </span>
            </div>

            <div className="flex items-center gap-1 text-neutral-400 text-sm">
              <MapPin className="w-3 h-3" />
              {dest.region}
            </div>

            <button className="mt-2 flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Scopri <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </GlowCard>
      ))}
    </div>
  );
}
