'use client';

import { useEffect, useState } from 'react';

export default function GoogleMapsDebug() {
    const [status, setStatus] = useState('Checking...');
    const [details, setDetails] = useState({});

    useEffect(() => {
        const checkGoogleMaps = () => {
            const details = {
                windowGoogle: !!window.google,
                windowGoogleMaps: !!window.google?.maps,
                windowGoogleMapsPlaces: !!window.google?.maps?.places,
                windowGoogleMapsGeocoder: !!window.google?.maps?.Geocoder,
                windowGoogleMapsAutocomplete: !!window.google?.maps?.places?.Autocomplete
            };

            setDetails(details);

            if (details.windowGoogleMapsPlaces) {
                setStatus('✅ Google Maps Places API loaded successfully');
            } else if (details.windowGoogleMaps) {
                setStatus('⚠️ Google Maps loaded but Places API not available');
            } else if (details.windowGoogle) {
                setStatus('⚠️ Google object exists but Maps not loaded');
            } else {
                setStatus('❌ Google Maps not loaded');
            }
        };

        // Check immediately
        checkGoogleMaps();

        // Check periodically
        const interval = setInterval(checkGoogleMaps, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border text-xs max-w-sm z-50">
            <h3 className="font-bold mb-2">Google Maps Debug</h3>
            <p className="mb-2">{status}</p>
            <div className="space-y-1">
                {Object.entries(details).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                        <span>{key}:</span>
                        <span className={value ? 'text-green-600' : 'text-red-600'}>
                            {value ? '✅' : '❌'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
