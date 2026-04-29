'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import AddressInput from '@/components/Fields/AddressInput';
import MapComponent from '@/components/MapComponent';

export default function AddressOnboarding() {
    const t = useTranslations('OnBoardPages.addressOnboarding');
    const router = useRouter();
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState('');
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        // Get user role from session or API
        const getUserRole = async () => {
            try {
                const response = await fetch('/api/profile');
                if (response.ok) {
                    const data = await response.json();
                    setUserRole(data.profile.role);
                }
            } catch (error) {
                console.error('Error fetching user role:', error);
            }
        };
        getUserRole();
    }, []);

    const handleAddressSelect = (location) => {
        setSelectedLocation(location);
        setAddress(location.address || '');
    };

    const handleSubmit = async () => {
        if (!selectedLocation || !address.trim()) {
            toast.error(t('toast_address_required'));
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('address1', address);
            formData.append('city', selectedLocation.city || '');
            formData.append('postCode', selectedLocation.postCode || '');
            formData.append('latitude', selectedLocation.lat.toString());
            formData.append('longitude', selectedLocation.lng.toString());
            formData.append('country', selectedLocation.country || '');
            formData.append('isFirstTime', 'false'); // Mark user as no longer first-time

            const response = await fetch('/api/profile', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                toast.success(t('success_address_saved'));
                
                // Redirect based on user role
                if (userRole === 'provider') {
                    router.push('/looking-to-provide');
                } else if (userRole === 'shop-owner') {
                    router.push('/shop/dashboard');
                } else {
                    router.push('/customer/jobs');
                }
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || t('toast_save_error'));
            }
        } catch (error) {
            console.error('Error saving address:', error);
            toast.error(t('toast_save_error'));
        } finally {
            setLoading(false);
        }
    };

    const getRoleSpecificText = () => {
        switch (userRole) {
            case 'provider':
                return {
                    title: t('provider_title'),
                    description: t('provider_description'),
                    addressLabel: t('provider_address_label'),
                    addressPlaceholder: t('provider_address_placeholder')
                };
            case 'shop-owner':
                return {
                    title: t('shop_owner_title'),
                    description: t('shop_owner_description'),
                    addressLabel: t('shop_owner_address_label'),
                    addressPlaceholder: t('shop_owner_address_placeholder')
                };
            default:
                return {
                    title: t('customer_title'),
                    description: t('customer_description'),
                    addressLabel: t('customer_address_label'),
                    addressPlaceholder: t('customer_address_placeholder')
                };
        }
    };

    const roleText = getRoleSpecificText();

    return (
        <div className="min-h-[calc(100dvh-108px)] flex items-center justify-center">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-6">
                {/* Progress Indicator */}
                <div className="mb-8">
                    {userRole === 'provider' ? (
                        // Two steps for service providers
                        <div className="flex items-center justify-center space-x-4 mb-4">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                    1
                                </div>
                                <span className="ml-2 text-sm font-medium text-blue-600">Address Setup</span>
                            </div>
                            <div className="w-8 h-0.5 bg-gray-300"></div>
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                                    2
                                </div>
                                <span className="ml-2 text-sm font-medium text-gray-500">Service Selection</span>
                            </div>
                        </div>
                    ) : (
                        // Single step for shop owners and customers
                        <div className="flex items-center justify-center mb-4">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                    1
                                </div>
                                <span className="ml-2 text-sm font-medium text-blue-600">Complete Setup</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {roleText.title}
                    </h2>
                    <p className="text-gray-600">
                        {roleText.description}
                    </p>
                </div>

                <div className="space-y-6">
                    <div>
                        <AddressInput
                            value={address}
                            onChange={setAddress}
                            onLocationSelect={handleAddressSelect}
                            placeholder={roleText.addressPlaceholder}
                            label={roleText.addressLabel}
                        />
                    </div>

                    {selectedLocation && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {t('selected_location')}
                            </h3>
                            <div className="border rounded-lg overflow-hidden">
                                <MapComponent
                                    pickupLocation={{
                                        address: address,
                                        city: selectedLocation.city,
                                        postCode: selectedLocation.postCode,
                                        lat: selectedLocation.lat,
                                        lng: selectedLocation.lng
                                    }}
                                    hide={{ dropoff: true, clear: true, tip: true, pickup: true }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center pt-6">
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !selectedLocation}
                            className="btn btn-primary px-8 py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    {t('button_saving')}
                                </>
                            ) : (
                                t('button_continue')
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
