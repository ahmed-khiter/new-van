'use client';

import { useState, useEffect } from 'react';
import AddressInput from '@/components/Fields/AddressInput';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { calculateDistance } from '@/utils/helper';
import Loader from '@/components/Loader';

export default function LocationSelectionForm({
    locations,
    isLoadingLocations,
    customerLocation,
    selectedLocationId,
    deliveryMethod,
    onLocationChange,
    onLocationSelect,
    onDeliveryMethodChange,
    errors,
    serviceType = 'luggage',
}) {
    const isCleaning = serviceType === 'cleaning';
    const { isGoogleMapsLoaded } = useGoogleMaps();
    const [location, setLocation] = useState(customerLocation);
    const [inputValue, setInputValue] = useState(customerLocation?.address || '');
    const [locationsWithDistance, setLocationsWithDistance] = useState([]);

    useEffect(() => {
        if (customerLocation) {
            setLocation(customerLocation);
            setInputValue(customerLocation.address || '');
        }
    }, [customerLocation]);

    // Calculate distances when customer location or locations change
    useEffect(() => {
        if (location?.lat && location?.lng && locations.length > 0) {
            const locationsWithDist = locations.map(loc => {
                const distance = calculateDistance(
                    location.lat,
                    location.lng,
                    loc.latitude,
                    loc.longitude
                );
                return {
                    ...loc,
                    distance: distance !== null ? distance : Infinity
                };
            }).sort((a, b) => a.distance - b.distance); // Sort by distance (closest first)

            setLocationsWithDistance(locationsWithDist);
        } else {
            setLocationsWithDistance(locations.map(loc => ({ ...loc, distance: null })));
        }
    }, [location, locations]);

    const handleLocationSelect = (locationData) => {
        setLocation(locationData);
        setInputValue(locationData.address || '');
        onLocationChange({
            lat: locationData.lat,
            lng: locationData.lng,
            address: locationData.address,
            city: locationData.city || '',
            postCode: locationData.postcode || '',
        });
    };

    return (
        <div className="space-y-6">
            {/* Customer Location Input */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Your Location</h2>
                <p className="text-gray-600 mb-4">Enter your address to find the nearest {isCleaning ? 'cleaning' : 'storage'} location.</p>

                {!isGoogleMapsLoaded && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">🔄 Loading maps...</p>
                    </div>
                )}

                <AddressInput
                    value={inputValue}
                    onChange={(val) => {
                        setInputValue(val);
                    }}
                    onLocationSelect={handleLocationSelect}
                    placeholder="Enter your address"
                    label="Your Address"
                />

                {errors.customerLocation && (
                    <p className="mt-2 text-sm text-red-500">{errors.customerLocation}</p>
                )}

                {location && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                            ✓ Location set: {location.address}
                        </p>
                    </div>
                )}
            </div>

            {/* Location Selection */}
            {location && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Select {isCleaning ? 'Cleaning' : 'Storage'} Location</h2>
                    <p className="text-gray-600 mb-4">Choose the location closest to you.</p>

                    {errors.selectedLocationId && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{errors.selectedLocationId}</p>
                        </div>
                    )}

                    {isLoadingLocations ? (
                        <div className="flex justify-center py-8">
                            <Loader />
                        </div>
                    ) : locationsWithDistance.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No locations available. Please contact support.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {locationsWithDistance.map((loc) => (
                                <div
                                    key={loc.id}
                                    onClick={() => onLocationSelect(loc.id)}
                                    className={`p-2 border-2 rounded-lg cursor-pointer transition-all ${
                                        selectedLocationId === loc.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-sm text-gray-900">{loc.name}</h3>
                                            <p className="text-xs text-gray-600 mt-0.5">
                                                {loc.address1}
                                                {loc.city && `, ${loc.city}`}
                                                {loc.postCode && ` ${loc.postCode}`}
                                            </p>
                                        </div>
                                        <div className="ml-2 flex items-center gap-2">
                                            {loc.distance !== null && loc.distance !== Infinity && (
                                                <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded whitespace-nowrap">
                                                    {loc.distance.toFixed(1)} miles away
                                                </span>
                                            )}
                                            {selectedLocationId === loc.id && (
                                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Delivery Options */}
            {selectedLocationId && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Delivery Options</h2>
                    <p className="text-gray-600 mb-4">How would you like to handle your items?</p>

                    {errors.deliveryMethod && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{errors.deliveryMethod}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <div 
                            onClick={() => onDeliveryMethodChange('dropoff')}
                            className={`flex items-start space-x-2 p-2 border-2 rounded-lg cursor-pointer transition-all ${
                                deliveryMethod === 'dropoff' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <input
                                type="radio"
                                id="dropoff"
                                name="deliveryMethod"
                                checked={deliveryMethod === 'dropoff'}
                                onChange={() => onDeliveryMethodChange('dropoff')}
                                className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor="dropoff" className="flex-1 cursor-pointer">
                                <h3 className="font-semibold text-sm text-gray-900">Drop Off at Location</h3>
                                <p className="text-xs text-gray-600 mt-0.5">
                                    You will drop off your items at the selected location and collect them when ready
                                </p>
                            </label>
                            {deliveryMethod === 'dropoff' && (
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center ml-2">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        <div 
                            onClick={() => onDeliveryMethodChange('collection')}
                            className={`flex items-start space-x-2 p-2 border-2 rounded-lg cursor-pointer transition-all ${
                                deliveryMethod === 'collection' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <input
                                type="radio"
                                id="collection"
                                name="deliveryMethod"
                                checked={deliveryMethod === 'collection'}
                                onChange={() => onDeliveryMethodChange('collection')}
                                className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <label htmlFor="collection" className="flex-1 cursor-pointer">
                                <h3 className="font-semibold text-sm text-gray-900">Home Collection & Delivery</h3>
                                <p className="text-xs text-gray-600 mt-0.5">
                                    We will arrange a driver to collect your items from your location and deliver them back when ready
                                </p>
                            </label>
                            {deliveryMethod === 'collection' && (
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center ml-2">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

