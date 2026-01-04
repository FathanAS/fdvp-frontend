"use client";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";

const containerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "0.5rem",
};

// Lokasi Default: Monas, Jakarta
const defaultCenter = {
  lat: -6.1754,
  lng: 106.8272,
};

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

export default function MapPicker({ onLocationSelect }: MapPickerProps) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Handle Klik Peta
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      onLocationSelect(lat, lng);
      
      // Animasi geser ke titik yang diklik
      map?.panTo({ lat, lng });
    }
  };

  if (!isLoaded) {
    return (
      <div className="h-64 w-full bg-fdvp-card animate-pulse rounded-lg flex items-center justify-center text-fdvp-text gap-2">
        <Loader2 className="animate-spin" /> Loading Google Maps...
      </div>
    );
  }

  return (
    <div className="h-64 w-full rounded-lg border-2 border-fdvp-text/20 relative z-0">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          disableDefaultUI: false, // Tampilkan kontrol zoom/street view
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          styles: [ // Opsional: Dark Mode Google Maps Style
            { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
            {
              featureType: "road",
              elementType: "geometry",
              stylers: [{ color: "#38414e" }],
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }],
            },
          ]
        }}
      >
        {markerPosition && <Marker position={markerPosition} />}
      </GoogleMap>
      <p className="text-[10px] text-fdvp-text mt-1 text-center">*Klik peta untuk menandai lokasi</p>
    </div>
  );
}