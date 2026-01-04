"use client";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";

const containerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "0.75rem", // rounded-xl
};

interface MapViewerProps {
  lat: number;
  lng: number;
}

export default function MapViewer({ lat, lng }: MapViewerProps) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [map, setMap] = useState(null);

  const onLoad = useCallback((map: any) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (!lat || !lng) return null;

  if (!isLoaded) {
    return (
      <div className="h-64 w-full bg-fdvp-card flex items-center justify-center text-fdvp-text">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border border-fdvp-text/20 z-0 relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{ lat, lng }}
        zoom={15}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: true, // Bersih tanpa tombol kontrol
          draggable: false,       // Tidak bisa digeser (statis)
          zoomControl: false,
          scrollwheel: false,
          disableDoubleClickZoom: true,
          styles: [ // Dark Mode Style
             { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
             { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
             { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
             { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
             { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
          ]
        }}
      >
        <Marker position={{ lat, lng }} />
      </GoogleMap>

      {/* Tombol Open in Google Maps */}
      <a 
        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`} 
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 bg-white text-black px-3 py-1 text-xs font-bold rounded shadow hover:bg-gray-100 transition-colors z-10"
      >
        Buka di Google Maps ↗
      </a>
    </div>
  );
}