import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink } from "lucide-react";

interface AddressDisplayProps {
  address: string;
  className?: string;
  showMapLink?: boolean;
}

export function AddressDisplay({ address, className = "", showMapLink = true }: AddressDisplayProps) {
  const handleOpenInMaps = () => {
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
  };

  const handleGetDirections = () => {
    const encodedAddress = encodeURIComponent(address);
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(directionsUrl, '_blank');
  };

  if (!showMapLink) {
    return (
      <div className={`flex items-center text-gray-600 ${className}`}>
        <MapPin className="h-4 w-4 mr-2 text-western-brown" />
        <span>{address}</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center text-gray-600">
        <MapPin className="h-4 w-4 mr-2 text-western-brown" />
        <span>{address}</span>
      </div>
      
      <div className="flex items-center">
        <Button
          onClick={handleGetDirections}
          variant="outline"
          size="sm"
          className="text-xs border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
        >
          <MapPin className="h-3 w-3 mr-1" />
          Itinéraire
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}