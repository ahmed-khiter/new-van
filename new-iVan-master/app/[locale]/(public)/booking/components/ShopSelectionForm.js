'use client';

import { useState, useEffect } from 'react';
import AddressInput from '@/components/Fields/AddressInput';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import Loader from '@/components/Loader';

export default function ShopSelectionForm({
    shops,
    isLoadingShops,
    customerLocation,
    selectedShopId,
    deliveryMethod,
    onLocationChange,
    onShopSelect,
    onDeliveryMethodChange,
    errors,
}) {
    const { isGoogleMapsLoaded } = useGoogleMaps();
    const [location, setLocation] = useState(customerLocation);

    useEffect(() => {
        if (customerLocation) {
            setLocation(customerLocation);
        }
    }, [customerLocation]);

    const handleLocationSelect = (locationData) => {
        setLocation(locationData);
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
                <p className="text-gray-600 mb-4">Enter your location to find nearby cleaning shops.</p>

                {!isGoogleMapsLoaded && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">🔄 Loading maps...</p>
                    </div>
                )}

                <AddressInput
                    value={location?.address || ''}
                    onChange={(val) => {
                        // Handle text input if needed
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

            {/* Shop Selection */}
            {location && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Select Cleaning Shop</h2>
                    <p className="text-gray-600 mb-4">Choose a shop near you for cleaning your items.</p>

                    {errors.selectedShopId && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{errors.selectedShopId}</p>
                        </div>
                    )}

                    {isLoadingShops ? (
                        <div className="flex justify-center py-8">
                            <Loader />
                        </div>
                    ) : shops.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No shops found near your location. Please try a different address.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {shops.map((shop) => (
                                <div
                                    key={shop.id}
                                    onClick={() => onShopSelect(shop.id)}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                        selectedShopId === shop.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{shop.name}</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {shop.address1}
                                                {shop.city && `, ${shop.city}`}
                                                {shop.postCode && ` ${shop.postCode}`}
                                            </p>
                                            {shop.distance !== undefined && (
                                                <p className="text-sm text-blue-600 mt-1">
                                                    {shop.distance.toFixed(1)} miles away
                                                </p>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            {selectedShopId === shop.id && (
                                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* Delivery Method Selection */}
            {selectedShopId && (
                <div className="bg-white rounded-lg p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Delivery Method</h2>
                    <p className="text-gray-600 mb-4">How would you like to get your items to the shop?</p>

                    {errors.deliveryMethod && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{errors.deliveryMethod}</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div
                            onClick={() => onDeliveryMethodChange('dropoff')}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                deliveryMethod === 'dropoff'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900">Drop Off at Shop</h3>
                                    <p className="text-sm text-gray-600 mt-1">You will drop off your items at the selected shop</p>
                                </div>
                                {deliveryMethod === 'dropoff' && (
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div
                            onClick={() => onDeliveryMethodChange('collection')}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                deliveryMethod === 'collection'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900">Collection from Home</h3>
                                    <p className="text-sm text-gray-600 mt-1">We will arrange a driver to collect your items from your location</p>
                                </div>
                                {deliveryMethod === 'collection' && (
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

