"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, Marker, useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { Loader2, MapPin, Search, X } from "lucide-react";

const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const libraries: ("places")[] = ["places"];

const containerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "0.75rem", // rounded-xl
};

const defaultCenter = {
    lat: -6.1754,
    lng: 106.8272,
};

interface LocationSelectorProps {
    initialAddress?: string;
    initialLat?: number;
    initialLng?: number;
    onLocationChange: (data: { address: string; lat: number; lng: number }) => void;
}

export default function LocationSelector({ initialAddress = "", initialLat = 0, initialLng = 0, onLocationChange }: LocationSelectorProps) {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey,
        libraries,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral | null>(null);
    const [address, setAddress] = useState(initialAddress);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Initialize state from props
    useEffect(() => {
        setAddress(initialAddress);
        if (initialLat && initialLng) {
            setMarkerPos({ lat: initialLat, lng: initialLng });
        }
    }, [initialAddress, initialLat, initialLng]);

    // FIX: Close dropdown on scroll to prevent it from sticking
    useEffect(() => {
        const handleScroll = () => {
            if (document.activeElement === inputRef.current) {
                inputRef.current?.blur();
            }
        };
        // Listen to scroll on window (capture phase to catch all scrolling)
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, []);

    const onLoadMap = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmountMap = useCallback(() => {
        setMap(null);
    }, []);

    const onLoadAutocomplete = (autocomplete: google.maps.places.Autocomplete) => {
        autocompleteRef.current = autocomplete;
    };

    const onPlaceChanged = () => {
        if (autocompleteRef.current !== null) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const formattedAddress = place.formatted_address || place.name || "";

                setAddress(formattedAddress);
                setMarkerPos({ lat, lng });
                map?.panTo({ lat, lng });
                map?.setZoom(17);

                onLocationChange({ address: formattedAddress, lat, lng });
            }
        }
    };

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setMarkerPos({ lat, lng });

            // Note: Reverse geocoding requires Geocoding API enabled. 
            // For now, we keep the address asking user to refining or we just return coords.
            // But optimal UX: We should try to update address if possible, but let's stick to coords update + address fallback.
            // Since User asked for "Venue name integrated", typing is primary. Clicking map is refining pin.

            onLocationChange({ address, lat, lng });
            map?.panTo({ lat, lng });
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setAddress(val);
        // We defer sending up change until selection or valid input? 
        // Or just send everything. Let's send everything to keep sync.
        // But invalid address with old coords might be weird. 
        // Let's just update local address state, actual sync happens on selection or manual entry if needed (but standard is selection).
        // Actually, if user types manually, we might want to pass it up.
        onLocationChange({ address: val, lat: markerPos?.lat || 0, lng: markerPos?.lng || 0 });
    };

    const handleClear = () => {
        setAddress("");
        onLocationChange({ address: "", lat: 0, lng: 0 });
        inputRef.current?.focus();
    };

    if (!isLoaded) {
        return (
            <div className="h-96 w-full bg-fdvp-text/5 animate-pulse rounded-xl flex items-center justify-center text-fdvp-text gap-2 border border-fdvp-text/10">
                <Loader2 className="animate-spin" /> Loading Google Maps...
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* INPUT VENUE NAME (AUTOCOMPLETE) */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-fdvp-text/40 uppercase tracking-widest pl-1 flex items-center gap-2">
                    <MapPin size={14} /> Venue Name / Location
                </label>
                <div className="relative group">
                    <Autocomplete
                        onLoad={onLoadAutocomplete}
                        onPlaceChanged={onPlaceChanged}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search Google Maps location..."
                            className="w-full bg-fdvp-text/5 border border-fdvp-text/10 rounded-xl px-5 py-4 pl-12 pr-12 text-fdvp-text-light placeholder:text-fdvp-text/20 focus:outline-none focus:border-fdvp-primary/50 transition-all"
                            value={address}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                                // Prevent form submit on Enter during autocomplete
                                if (e.key === 'Enter') e.preventDefault();
                            }}
                        />
                    </Autocomplete>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-fdvp-text/30" size={20} />

                    {address && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-fdvp-text/30 hover:text-fdvp-primary transition-colors p-1"
                            aria-label="Clear location"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* MAP */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-fdvp-text/40 uppercase tracking-widest pl-1">Pin Point Validation</label>
                <div className="h-[400px] w-full rounded-xl border border-fdvp-text/10 overflow-hidden relative">
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={markerPos || defaultCenter}
                        zoom={markerPos ? 17 : 13} // Closer zoom if marker sets
                        onLoad={onLoadMap}
                        onUnmount={onUnmountMap}
                        onClick={handleMapClick}
                        options={{
                            disableDefaultUI: false,
                            streetViewControl: false,
                            mapTypeControl: false,
                            fullscreenControl: true, // Allow fullscreen
                            styles: [
                                { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                                { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                                { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                                { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                            ]
                        }}
                    >
                        {markerPos && <Marker position={markerPos} />}
                    </GoogleMap>

                    {/* OVERLAY INFO */}
                    <div className="absolute top-4 left-4 right-4 pointer-events-none">
                        <div className="bg-fdvp-card/90 backdrop-blur-md text-fdvp-text-light text-xs font-mono p-2 rounded-lg border border-fdvp-text/10 shadow-lg inline-block">
                            {markerPos ? `${markerPos.lat.toFixed(6)}, ${markerPos.lng.toFixed(6)}` : "Click map to pin location"}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
