"use client";
import { useState, useEffect } from "react";
import { getFileUrl, fullDateFormate, getShopStatusBadge } from "@/utils/helper";
import toast from "react-hot-toast";

function ShopViewDetailModal({ shopId, isOpen, onClose }) {
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && shopId) {
            fetchShopDetails();
        }
    }, [isOpen, shopId]);

    const fetchShopDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/shops/${shopId}`);
            
            if (response.ok) {
                const data = await response.json();
                setShop(data.shop);
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to fetch shop details");
                onClose?.();
            }
        } catch (error) {
            console.error("Error fetching shop details:", error);
            toast.error("Failed to fetch shop details");
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
                    <h2 className="text-2xl font-bold text-gray-900">Shop Details</h2>
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
                    ) : shop ? (
                        <div className="p-6 space-y-6">
                            {/* Shop Image and Basic Info */}
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Shop Image */}
                                <div className="flex-shrink-0">
                                    <div className="w-48 h-48 mx-auto lg:mx-0 rounded-xl overflow-hidden bg-gray-100">
                                        {shop.image ? (
                                            <img
                                                src={getFileUrl(shop.image)}
                                                alt={shop.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className={`w-full h-full flex items-center justify-center ${
                                                shop.image ? 'hidden' : 'flex'
                                            }`}
                                        >
                                            <i className="bi bi-shop text-6xl text-gray-400"></i>
                                        </div>
                                    </div>
                                </div>

                                {/* Basic Information */}
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h3 className="text-3xl font-bold text-gray-900 mb-2">{shop.name}</h3>
                                        <div className="flex items-center gap-3">
                                            {getShopStatusBadge(shop.status)}
                                            <span className="badge badge-custom-sm bg-primary capitalize p-2 text-[14px] text-center text-white">
                                                {shop._count?.products || 0} products
                                            </span>
                                        </div>
                                    </div>

                                    {/* Owner Information */}
                                    <div className="bg-gray-100 rounded-lg p-4">
                                        <h4 className="font-semibold text-gray-900 mb-2">Shop Owner</h4>
                                        <div className="space-y-1">
                                            <p className="text-gray-700 mb-0">
                                                <span className="font-medium">Name:</span> {shop.createdBy?.firstName} {shop.createdBy?.lastName}
                                            </p>
                                            <p className="text-gray-700 mb-0">
                                                <span className="font-medium">Email:</span> {shop.createdBy?.email}
                                            </p>
                                            {shop?.phone && (
                                                <p className="text-gray-700 mb-0">
                                                    <span className="font-medium">Phone:</span> {shop.phone}
                                                </p>
                                            )}
                                            <p className="text-gray-700 mb-0">
                                                <span className="font-medium">Shop Created At:</span> {fullDateFormate(shop.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Address Information */}
                            {(shop.address1 || shop.address2 || shop.city || shop.postCode || shop.country) && (
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <span className="mr-2">📍</span>
                                        Address Information
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {shop.address1 && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-600">Address Line 1:</span>
                                                <p className="text-gray-800">{shop.address1}</p>
                                            </div>
                                        )}
                                        {shop.address2 && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-600">Address Line 2:</span>
                                                <p className="text-gray-800">{shop.address2}</p>
                                            </div>
                                        )}
                                        {shop.city && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-600">City:</span>
                                                <p className="text-gray-800">{shop.city}</p>
                                            </div>
                                        )}
                                        {shop.postCode && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-600">Postal Code:</span>
                                                <p className="text-gray-800">{shop.postCode}</p>
                                            </div>
                                        )}
                                        {shop.country && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-600">Country:</span>
                                                <p className="text-gray-800">{shop.country}</p>
                                            </div>
                                        )}
                                        {/* {(shop.latitude && shop.longitude) && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-600">Coordinates:</span>
                                                <p className="text-gray-800">
                                                    {shop.latitude}, {shop.longitude}
                                                </p>
                                            </div>
                                        )} */}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex justify-center items-center py-20">
                            <div className="text-center">
                                <i className="bi bi-exclamation-triangle text-4xl text-gray-400 mb-2"></i>
                                <p className="text-gray-500">Failed to load shop details</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ShopViewDetailModal;
