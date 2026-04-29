"use client";
import { useState, useEffect } from "react";
import { getFileUrl, fullDateFormate } from "@/utils/helper";
import toast from "react-hot-toast";

function RestaurantViewDetailModal({ restaurantId, isOpen, onClose }) {
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && restaurantId) {
            fetchRestaurantDetails();
        }
    }, [isOpen, restaurantId]);

    const fetchRestaurantDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/shops/${restaurantId}`);
            
            if (response.ok) {
                const data = await response.json();
                setRestaurant(data.shop);
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to fetch restaurant details");
                onClose?.();
            }
        } catch (error) {
            console.error("Error fetching restaurant details:", error);
            toast.error("Failed to fetch restaurant details");
            onClose?.();
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">Restaurant Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : restaurant ? (
                        <div className="p-6 space-y-6">
                            {/* Restaurant Image and Basic Info */}
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Restaurant Image */}
                                <div className="flex-shrink-0">
                                    <div className="w-48 h-48 mx-auto lg:mx-0 rounded-xl overflow-hidden bg-gray-100">
                                        {restaurant.image ? (
                                            <img
                                                src={getFileUrl(restaurant.image)}
                                                alt={restaurant.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className={`w-full h-full flex items-center justify-center ${
                                                restaurant.image ? 'hidden' : 'flex'
                                            }`}
                                        >
                                            <i className="bi bi-shop text-6xl text-gray-400"></i>
                                        </div>
                                    </div>
                                </div>

                                {/* Basic Information */}
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h3 className="text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h3>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className={`badge badge-custom-sm p-2 text-[14px] text-center text-white ${
                                                restaurant.status === 'active' ? 'bg-success' : 'bg-secondary'
                                            }`}>
                                                {restaurant.status}
                                            </span>
                                            {restaurant.category && (
                                                <span className="badge badge-custom-sm bg-primary p-2 text-[14px] text-center text-white">
                                                    {restaurant.category}
                                                </span>
                                            )}
                                            {restaurant.cuisine && (
                                                <span className="badge badge-custom-sm bg-info p-2 text-[14px] text-center text-white">
                                                    {restaurant.cuisine}
                                                </span>
                                            )}
                                            <span className="badge badge-custom-sm bg-primary capitalize p-2 text-[14px] text-center text-white">
                                                {restaurant._count?.menuItems || 0} menu items
                                            </span>
                                        </div>
                                    </div>

                                    {/* Owner Information */}
                                    <div className="bg-gray-100 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2">Restaurant Owner</h4>
                                        <div className="space-y-1">
                                            <p className="text-gray-700 mb-0">
                                                <span className="font-medium">Name:</span> {restaurant.createdBy?.firstName} {restaurant.createdBy?.lastName}
                                            </p>
                                            <p className="text-gray-700 mb-0">
                                                <span className="font-medium">Email:</span> {restaurant.createdBy?.email}
                                            </p>
                                            {restaurant?.phone && (
                                                <p className="text-gray-700 mb-0">
                                                    <span className="font-medium">Phone:</span> {restaurant.phone}
                                                </p>
                                            )}
                                            <p className="text-gray-700 mb-0">
                                                <span className="font-medium">Restaurant Created At:</span> {fullDateFormate(restaurant.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Restaurant Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {restaurant.rating && (
                                    <div className="bg-blue-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                            <i className="bi bi-star-fill text-warning mr-2"></i>
                                            Rating
                                        </h4>
                                        <p className="text-2xl font-bold text-gray-800">{restaurant.rating.toFixed(1)}</p>
                                    </div>
                                )}
                                {restaurant.deliveryTime && (
                                    <div className="bg-green-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                            <i className="bi bi-clock text-success mr-2"></i>
                                            Delivery Time
                                        </h4>
                                        <p className="text-xl font-bold text-gray-800">{restaurant.deliveryTime}</p>
                                    </div>
                                )}
                                {restaurant.minimumOrder && (
                                    <div className="bg-yellow-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                            <i className="bi bi-currency-pound text-warning mr-2"></i>
                                            Minimum Order
                                        </h4>
                                        <p className="text-xl font-bold text-gray-800">£{Number(restaurant.minimumOrder).toFixed(2)}</p>
                                    </div>
                                )}
                                {restaurant.acceptsReservations && (
                                    <div className="bg-purple-50 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                            <i className="bi bi-calendar-check text-purple mr-2"></i>
                                            Reservations
                                        </h4>
                                        <p className="text-lg font-bold text-gray-800">Accepts Reservations</p>
                                    </div>
                                )}
                            </div>


                            {/* Address Information */}
                            {(restaurant.address1 || restaurant.address2 || restaurant.city || restaurant.postCode || restaurant.country) && (
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <span className="mr-2">📍</span>
                                        Address Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {restaurant.address1 && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-600">Address Line 1:</span>
                                                <p className="text-gray-800">{restaurant.address1}</p>
                                            </div>
                                        )}
                                        {restaurant.address2 && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-600">Address Line 2:</span>
                                                <p className="text-gray-800">{restaurant.address2}</p>
                                            </div>
                                        )}
                                        {restaurant.city && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-600">City:</span>
                                                <p className="text-gray-800">{restaurant.city}</p>
                                            </div>
                                        )}
                                        {restaurant.postCode && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-600">Postal Code:</span>
                                                <p className="text-gray-800">{restaurant.postCode}</p>
                                            </div>
                                        )}
                                        {restaurant.country && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-600">Country:</span>
                                                <p className="text-gray-800">{restaurant.country}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex justify-center items-center py-20">
                            <div className="text-center">
                                <i className="bi bi-exclamation-triangle text-4xl text-gray-400 mb-2"></i>
                                <p className="text-gray-500">Failed to load restaurant details</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RestaurantViewDetailModal;

