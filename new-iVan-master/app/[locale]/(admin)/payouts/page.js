"use client";
import CustomIllustration from "@/components/CustomIllustration";
import Pagination from "@/components/Pagination";
import { useRouter } from "@/i18n/routing";
import { formatAmountToCurrency, formatCompletionDate } from "@/utils/helper";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import toast from "react-hot-toast";
import { DEFAULT_PAGINATION } from "@/utils/helper";
export default function AdminPayoutPage() {
    const t = useTranslations("AdminPages.payouts");
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [payouts, setPayouts] = useState([]);
    const [activeTab, setActiveTab] = useState("pending");
    const [totals, setTotals] = useState({ pending: 0, completed: 0 });
    const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedPayout, setSelectedPayout] = useState(null);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);

    const pageSize = DEFAULT_PAGINATION.pageSize;

    const fetchPayouts = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                status: activeTab,
                page: currentPage.toString(),
                pageSize: pageSize.toString(),
            });

            const response = await fetch(`/api/payouts?${params.toString()}`);

            if (!response.ok) {
                throw new Error("Failed to fetch payouts");
            }

            const data = await response.json();

            setPayouts(data?.payouts || []);
            setTotals({
                pending: parseFloat(data?.pendingTotalPayout) || 0,
                completed: parseFloat(data?.completedTotalPayout) || 0,
            });
            setPagination({
                ...DEFAULT_PAGINATION,
                ...(data?.pagination || {}),
            });
        } catch (error) {
            console.error("Error fetching payouts:", error);
            toast.error(t("toast_fetch_failed"));
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, currentPage, pageSize, t]);

    useEffect(() => {
        fetchPayouts();
    }, [fetchPayouts]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
        setPagination({ ...DEFAULT_PAGINATION });
    };

    const handlePageChange = (page) => {
        if (page === currentPage || page < 1 || page > pagination.totalPages) return;
        setPagination((prev) => ({ ...prev, page }));
        setCurrentPage(page);
    };

    const handlePayoutClick = (payout) => {
        if (!payout?.id) return;
        if (payout.type === "job") {
            router.push(`/jobs/view/${payout.id}`);
            return;
        }
        if (payout.type === "affiliate") {
            router.push(`/affiliate-businesses`);
            return;
        }

        router.push(`/orders`);
    };

    const handleOpenWalletModal = (payout) => {
        setSelectedPayout(payout);
        setShowWalletModal(true);
    };

    const handleCloseWalletModal = () => {
        setShowWalletModal(false);
        setSelectedPayout(null);
        setIsConfirming(false);
    };

    const handleConfirmPayment = async () => {
        if (!selectedPayout) return;

        setIsConfirming(true);
        try {
            const response = await fetch("/api/payouts/pay", {
                method: "POST",
                body: JSON.stringify({
                    id: selectedPayout.id,
                    type: selectedPayout.type,
                    price: selectedPayout.price,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error?.error || "Failed to process payout");
            }
            setPayouts((prevPayouts) =>
                prevPayouts.filter((p) => p.id !== selectedPayout.id)
            );
            toast.success(t("wallet_success_toast"));
            handleCloseWalletModal();
        } catch (error) {
            console.error("Error confirming payout:", error);
            toast.error(error?.message || t("wallet_error_toast"));
            setIsConfirming(false);
        }
    };

    const hasPayouts = payouts.length > 0;
    const skeletonItems = Array.from({ length: 6 });

    return (
        <div className="w-full">
            {/* Tabs */}
            <div className="flex bg-white p-2 rounded-[8px] gap-2 mb-4 shadow-sm">
                <div
                    className={`flex-1 text-center py-2 rounded-[10px] font-medium cursor-pointer transition-all duration-200 ${activeTab === "pending"
                        ? "bg-yellow-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-yellow-100"
                        }`}
                    onClick={() => handleTabChange("pending")}
                >
                    {t("pending_label", { amount: formatAmountToCurrency(totals.pending) })}
                </div>

                <div
                    className={`flex-1 text-center py-2 rounded-[10px] font-medium cursor-pointer transition-all duration-200 ${activeTab === "paid"
                        ? "bg-green-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-green-100"
                        }`}
                    onClick={() => handleTabChange("paid")}
                >
                    {t("completed_label", { amount: formatAmountToCurrency(totals.completed) })}
                </div>
            </div>

            {/* Payout Cards */}
            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 transition-all duration-300">
                    {skeletonItems.map((_, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl shadow-md p-4 w-full animate-pulse"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="h-6 w-24 bg-gray-200 rounded-full" />
                                <div className="h-4 w-32 bg-gray-200 rounded" />
                            </div>
                            <div className="h-6 w-3/4 bg-gray-200 rounded mb-3" />
                            <div className="h-4 w-1/2 bg-gray-200 rounded mb-2" />
                            <div className="h-4 w-1/3 bg-gray-200 rounded" />
                            <div className="mt-4 flex gap-2">
                                <div className="h-8 w-24 bg-gray-200 rounded-full" />
                                <div className="h-8 w-24 bg-gray-200 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : hasPayouts ? (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 transition-all duration-300">
                        {payouts.map((payout) => {
                            const { id, title, price, completedAt, updatedAt, type, payTo } = payout;
                            const typeLabel =
                                type === "order"
                                    ? t("type_order")
                                    : type === "affiliate"
                                    ? "Affiliate Commission"
                                    : t("type_job");
                            const completedDate = formatCompletionDate(completedAt) || formatCompletionDate(updatedAt) || "N/A";
                            const isJob = type === "job";

                            return (
                                <div
                                    key={id}
                                    className="bg-white rounded-xl shadow-md p-4 w-full hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-full bg-gray-100 text-gray-600">
                                            {typeLabel}
                                        </span>
                                        <span className="text-xs text-gray-500 font-medium max-w-[60%] text-right truncate">
                                            {t("pay_to_label", { name: payTo || t("recipient_unknown") })}
                                        </span>
                                    </div>
                                    <h4
                                        className={`font-semibold text-[20px] line-clamp-2 ${isJob ? "cursor-pointer" : ""}`}
                                        onClick={() => isJob && handlePayoutClick(payout)}
                                    >
                                        {title}
                                    </h4>
                                    <p className="text-gray-700 font-bold mt-2 mb-0">
                                        {t("price_label", { amount: formatAmountToCurrency(price) })}
                                    </p>
                                    {activeTab === "paid" && (
                                        <p className="text-gray-500 text-xs mt-1 mb-0">
                                            {t("completed_at", { date: completedDate })}
                                        </p>
                                    )}
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <button
                                            className="custom_btn_outline--small btn-sm rounded-pill px-3 py-2"
                                            onClick={() => handlePayoutClick(payout)}
                                        >
                                            {t("view_details")}
                                        </button>
                                        {activeTab === "pending" && (
                                            <button
                                                className="custom_btn_solid btn-sm rounded-pill px-3 py-2"
                                                onClick={() => handleOpenWalletModal(payout)}
                                            >
                                                {type === "order"
                                                    ? t("pay_shop_owner")
                                                    : type === "affiliate"
                                                    ? "Pay Affiliate"
                                                    : t("pay_provider")}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-6">
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.totalPages}
                            hasNextPage={pagination.page < pagination.totalPages}
                            hasPrevPage={pagination.page > 1}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </>
            ) : (
                <CustomIllustration
                    page="payouts"
                    illustrationHelperText={
                        activeTab === "pending"
                            ? t("empty_pending")
                            : t("empty_completed")
                    }
                />
            )}

            <Modal show={showWalletModal} onHide={handleCloseWalletModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{t("wallet_modal_title")}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPayout && (
                        <div className="space-y-3">
                            <div className="border rounded p-3 bg-light">
                                <p className="mb-1 text-sm text-muted">
                                    {t("wallet_pay_to", { name: selectedPayout.payTo || t("recipient_unknown") })}
                                </p>
                                <p className="mb-0 fw-semibold">
                                    {t("wallet_amount_label", { amount: formatAmountToCurrency(selectedPayout.price) })}
                                </p>
                            </div>
                            <div className="alert alert-info mb-0" role="alert">
                                {t("wallet_transfer_info")}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={handleCloseWalletModal} disabled={isConfirming}>
                        {t("wallet_cancel")}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirmPayment}
                        disabled={isConfirming}
                    >
                        {isConfirming ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                {t("wallet_processing")}
                            </>
                        ) : (
                            t("wallet_confirm_button")
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
