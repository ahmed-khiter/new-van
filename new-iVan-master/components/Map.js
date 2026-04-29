export default function Maps({ 
    pickupPostCode, pickupLat, pickupLng, pickupAddress, pickupCity,
    dropOffPostCode, dropOffLat, dropOffLng, dropOffAddress, dropOffCity,
    showBoth = false 
}) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    // If we have both pickup and dropoff coordinates, show route between them
    if (showBoth && pickupLat && pickupLng && dropOffLat && dropOffLng) {
        const mapSrc = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${pickupLat},${pickupLng}&destination=${dropOffLat},${dropOffLng}&mode=driving`;
        
        return (
            <div className="h-80 w-full mx-auto my-3 rounded-md overflow-hidden">
                <iframe
                    title="Google Map - Route from Pickup to Dropoff"
                    src={mapSrc}
                    className="h-full w-full border-0 rounded-md"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
            </div>
        );
    }

    // If we have pickup coordinates, show pickup location
    if (pickupLat && pickupLng) {
        const mapSrc = `https://www.google.com/maps?q=${pickupLat},${pickupLng}&output=embed&z=15&key=${apiKey}`;
        
        return (
            <div className="h-80 w-full mx-auto my-3 rounded-md overflow-hidden">
                <iframe
                    title="Google Map - Pickup Location"
                    src={mapSrc}
                    className="h-full w-full border-0 rounded-md"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
            </div>
        );
    }

    // Fallback to pickup postcode if coordinates are not available
    if (pickupPostCode) {
        const encoded = encodeURIComponent(pickupPostCode);
        const mapSrc = `https://www.google.com/maps?q=${encoded}&output=embed&key=${apiKey}`;

        return (
            <div className="h-80 w-full mx-auto my-3 rounded-md overflow-hidden">
                <iframe
                    title="Google Map - Pickup Location"
                    src={mapSrc}
                    className="h-full w-full border-0 rounded-md"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
            </div>
        );
    }

    return null;
}
