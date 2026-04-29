'use client'
import { usePathname, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { jobCategories } from '../../utils/helper';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

function LookingToProvideTabsForm({ services = [] }) {
    const t = useTranslations('OnBoardPages.lookingToProvide');
    const [loading, setLoading] = useState(false);
    const [selectedOption, setSelectedOption] = useState("");
    const router = useRouter();
    const pathname = usePathname();
    const isOnBoard = pathname.includes('/looking');
    const pendingService = services?.find(s => s.status === "Pending");

    useEffect(() => {
        if (pendingService) {
            setSelectedOption(pendingService.name);
        }
    }, [pendingService]);

    const handleOptionClick = (value) => {

        if (pendingService && pendingService.name !== value) {
            toast.error(t('toast_pending_exists'));
            return;
        }

        const matchedService = services?.find(s => s.name === value);
        if (matchedService?.status === "Approved") {
            toast.error(t('toast_already_approved'));
            return;
        }

        setSelectedOption(value);
    };

    const handleContinue = async () => {
        if (!selectedOption) {
            toast.error(t('toast_select_service'));
            return;
        }


        if (pendingService && pendingService.name === selectedOption) {
            router.push(
                `/provider/settings?verifications=true&category=${encodeURIComponent(selectedOption)}`
            );
            return;
        }


        try {
            setLoading(true);

            const res = await fetch('/api/provider-onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service: selectedOption , 
                    isOnBoard: isOnBoard
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || t('toast_generic_error'));
                return;
            }

            // Handle auto-approval case - documents already verified from another service
            if (data.autoApproved) {
                toast.success(t('success_auto_approved') || 'Service approved! Your documents are already verified.');
                router.push('/provider/dashboard');
                return;
            }

            toast.success(isOnBoard ? t('success_added') : t('success_updated'));
            router.push(
                isOnBoard
                    ? `/service-verification?category=${encodeURIComponent(selectedOption)}`
                    : `/provider/settings?verifications=true&category=${encodeURIComponent(selectedOption)}`
            );
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card mb-0">
            <div className="card-body" style={{ padding: '20px 20px 20px 20px' }}>
                <div className="looking-to-use-form-box custom-form-box-height d-flex flex-column align-items-center justify-content-center w-fit-content m-auto">
                    <h3 className="fw-bold text-center">
                        {t('title')}
                    </h3>

                    <div className="mt-3 d-flex flex-wrap justify-center gap-3">
                        {jobCategories?.map(({ label, icon: Icon , value }, idx) => {
                            const matchedService = services?.find(s => s.name === value);
                            const status = matchedService?.status || "";

                            return (
                                <span
                                    key={idx}
                                    className={`option flex items-center gap-3 px-3 py-2 rounded border cursor-pointer ${selectedOption === value ? "bg-blue-100 border-blue-500" : ""
                                        }`}
                                    onClick={() => handleOptionClick(value)}
                                >
                                    {Icon && <Icon className="w-4 h-4" />}
                                    {label}
                                    {status && (
                                        <span
                                            className={`ml-2 text-sm ${status === "Approved"
                                                ? "text-green-600"
                                                : status === "Pending"
                                                    ? "text-yellow-600"
                                                    : status === "Rejected"
                                                        ? "text-red-600"
                                                        : "text-gray-500"
                                                }`}
                                        >
                                            ({t(`status_${status}`)})
                                        </span>
                                    )}
                                </span>
                            );
                        })}
                    </div>

                    <button
                        className="btn btn-primary mt-24 w-1/2"
                        disabled={loading}
                        onClick={handleContinue}
                    >
                        {loading ? t('button_saving') : t('button_continue')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LookingToProvideTabsForm;
