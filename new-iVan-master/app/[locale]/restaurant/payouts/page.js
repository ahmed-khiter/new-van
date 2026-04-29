"use client";
import CustomIllustration from "@/components/CustomIllustration";
import Pagination from "@/components/Pagination";
import { useRouter } from "@/i18n/routing";
import { formatAmountToCurrency, formatCompletionDate } from "@/utils/helper";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const DEFAULT_PAGINATION = {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
};

export default function RestaurantPayoutPage() {
    const t = useTranslations("RestaurantPages.payouts");
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [payouts, setPayouts] = useState([]);
    const [activeTab, setActiveTab] = useState("pending");
    const [totals, setTotals] = useState({ pending: 0, completed: 0 });
    const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
    const [currentPage, setCurrentPage] = useState(1);

    const pageSize = DEFAULT_PAGINATION.pageSize;

    const fetchPayouts = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/payouts?status=${activeTab}&page=${currentPage}&pageSize=${pageSize}`);
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
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, currentPage, pageSize]);

    useEffect(() => {
        fetchPayouts();
    }, [fetchPayouts]);

    const handlePayoutClick = (id, type) => {
        if (!id) return;
        if (type === "order") {
            router.push(`/restaurant/orders`);
            return;
        }

        router.push(`/restaurant/orders`);
    };

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

    const hasPayouts = payouts.length > 0;

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
                    className={`flex-1 text-center py-2 rounded-[10px] font-medium cursor-pointer transition-all duration-200 ${activeTab === "completed"
                        ? "bg-green-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-green-100"
                        }`}
                    onClick={() => handleTabChange("completed")}
                >
                    {t("completed_label", { amount: formatAmountToCurrency(totals.completed) })}
                </div>
            </div>

            {/* Payout Cards */}
            {isLoading ? (
                <div className="text-center mt-4">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">{t("loading")}</span>
                    </div>
                </div>
            ) : hasPayouts ? (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 transition-all duration-300">
                        {payouts.map(({ title, price, id, completedAt, updatedAt, type, payTo }) => {
                            const completedDate = formatCompletionDate(completedAt) || formatCompletionDate(updatedAt) || "N/A";

                            return (
                                <div
                                    key={id}
                                    className="bg-white rounded-xl shadow-md p-4 w-full hover:shadow-lg transition-shadow"
                                >
                                    <h4
                                        className={`font-semibold text-[20px] line-clamp-2 ${type === "order" ? "cursor-pointer" : ""}`}
                                        onClick={() => type === "order" && handlePayoutClick(id, type)}
                                    >
                                        {title}
                                    </h4>
                                    <p className="text-gray-700 font-bold mt-2 mb-0">
                                        {t("price_label", { amount: formatAmountToCurrency(price) })}
                                    </p>
                                    {activeTab === "completed" && (
                                        <p className="text-gray-500 text-xs mt-1 mb-0">
                                            {t("completed_at", { date: completedDate })}
                                        </p>
                                    )}
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
        </div>
    );
}

