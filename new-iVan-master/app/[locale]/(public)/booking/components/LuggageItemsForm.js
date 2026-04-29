'use client';

import { FaPlus, FaMinus } from 'react-icons/fa';
import { getCurrencyByLocation, getCurrencySymbol } from '@/utils/helper';

export default function LuggageItemsForm({ luggageItems, selectedItems, onItemQuantityChange, errors, serviceType = 'luggage', location = null }) {
    const getQuantity = (itemId) => selectedItems[itemId] || 0;
    const isCleaning = serviceType === 'cleaning';
    
    // Get currency based on location
    const currency = getCurrencyByLocation(location);
    const currencySymbol = getCurrencySymbol(currency);

    return (
        <div className="bg-white rounded-lg p-2 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Select Items {isCleaning ? 'for Cleaning' : 'for Storage'}</h2>
                {luggageItems.length > 0 && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        isCleaning 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                    }`}>
                        {isCleaning ? 'Dry Cleaning' : 'Luggage'}
                    </span>
                )}
            </div>
            <p className="text-gray-600 mb-6">Choose the items you want to have {isCleaning ? 'cleaned' : 'stored'} and specify quantities.</p>

            {errors.items && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{errors.items}</p>
                </div>
            )}

            <div className="space-y-2">
                {luggageItems.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No {isCleaning ? 'cleaning' : 'luggage'} items available. Please contact support.</p>
                    </div>
                ) : (
                    luggageItems.map((item) => {
                        const quantity = getQuantity(item.id);
                        return (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                            >
                                <div className="flex-1">
                                    <h3 className="font-medium text-sm text-gray-900">{item.name}</h3>
                                    <p className="text-xs text-gray-600">
                                        {currencySymbol}{parseFloat(item.price).toFixed(2)} {item.type === 'Dry cleaning' ? 'per item' : 'per day'}
                                    </p>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-1">
                                        <button
                                            type="button"
                                            onClick={() => onItemQuantityChange(item.id, Math.max(0, quantity - 1))}
                                            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={quantity === 0}
                                        >
                                            <FaMinus className="h-2.5 w-2.5" />
                                        </button>
                                        
                                        <span className="w-10 text-center font-semibold text-base">
                                            {quantity}
                                        </span>
                                        
                                        <button
                                            type="button"
                                            onClick={() => onItemQuantityChange(item.id, quantity + 1)}
                                            className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-100"
                                        >
                                            <FaPlus className="h-2.5 w-2.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {Object.keys(selectedItems).length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Total:</span>
                        <span className="text-xl font-bold text-blue-600">
                            {currencySymbol}{Object.entries(selectedItems).reduce((sum, [itemId, qty]) => {
                                const item = luggageItems.find(i => i.id === itemId);
                                return sum + (item ? parseFloat(item.price) * qty : 0);
                            }, 0).toFixed(2)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

