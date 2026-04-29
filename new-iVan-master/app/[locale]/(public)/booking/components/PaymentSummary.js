'use client';

import { getCurrencyByLocation, getCurrencySymbol } from '@/utils/helper';

export default function PaymentSummary({ items, luggageItems, selectedLocation, deliveryMethod, totalPrice, serviceType = 'luggage', location = null }) {
    // Get currency based on location
    const currency = getCurrencyByLocation(location);
    const currencySymbol = getCurrencySymbol(currency);
    const getItemDetails = (itemId, quantity) => {
        const item = luggageItems.find(i => i.id === itemId);
        if (!item) return null;
        return {
            name: item.name,
            price: parseFloat(item.price),
            quantity,
            subtotal: parseFloat(item.price) * quantity,
        };
    };

    const itemDetails = Object.entries(items)
        .map(([itemId, quantity]) => getItemDetails(itemId, quantity))
        .filter(Boolean);

    return (
        <div className="bg-white rounded-lg p-4 mb-8 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            <div className="space-y-3">
                {/* Items */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <h3 className="font-medium text-sm text-gray-700 mb-2">Items</h3>
                    <div className="space-y-1.5">
                        {itemDetails.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">
                                    {item.name} × {item.quantity}
                                </span>
                                <span className="font-medium text-gray-900">{currencySymbol}{item.subtotal.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Location Information */}
                {selectedLocation && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <h3 className="font-medium text-sm text-gray-700 mb-1.5">Selected Location</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            {selectedLocation.address1}
                            {selectedLocation.city && `, ${selectedLocation.city}`}
                            {selectedLocation.postCode && ` ${selectedLocation.postCode}`}
                        </p>
                    </div>
                )}

                {/* Delivery Options */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <h3 className="font-medium text-sm text-gray-700 mb-1.5">Delivery Method</h3>
                    <div className="space-y-1">
                        {deliveryMethod === 'dropoff' && (
                            <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                <span className="text-green-600">✓</span> Drop Off at Location
                            </p>
                        )}
                        {deliveryMethod === 'collection' && (
                            <p className="text-xs text-gray-600 flex items-center gap-1.5">
                                <span className="text-green-600">✓</span> Home Collection & Delivery
                            </p>
                        )}
                        {!deliveryMethod && (
                            <p className="text-xs text-gray-500 italic">No delivery method selected</p>
                        )}
                    </div>
                </div>

                {/* Total */}
                <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-200">
                    <div className="flex justify-between items-center">
                        <span className="text-base font-semibold text-gray-900">Total Amount</span>
                        <span className="text-xl font-bold text-blue-600">{currencySymbol}{totalPrice.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

