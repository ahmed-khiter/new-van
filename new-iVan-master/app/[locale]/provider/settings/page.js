"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import LookingToProvideTabsForm from "@/components/onboard/LookingToProvideTabsForm";
import ProviderAddress from "@/components/Profile/Address";
import ServiceVerification from "@/components/Profile/Verifications";
import Support from "@/components/Profile/Support";
import Wallet from "@/components/Profile/Wallet";

const ProviderSettings = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState(null);

    const searchParams = useSearchParams();
    const activeTab = searchParams.get("services")
        ? "services" :
        searchParams.get("payments")
            ? "Wallet Management" :
            searchParams.get("address")
                ? "address"
                : searchParams.get("verifications")
                    ? "verifications"
                    : searchParams.get("support")
                        ? "support"
                        : null;
    const shouldFetchProfile = activeTab === "services" || activeTab === "address";

    useEffect(() => {
        if (!shouldFetchProfile) return;
        const fetchUserData = async () => {
            try {
                setIsLoading(true);
                const response = await fetch("/api/profile");
                if (!response.ok) throw new Error("Failed to fetch user data");
                const data = await response.json();
                setUserData(data.profile);
            } catch (error) {
                toast.error("Failed to fetch user data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [searchParams]);

    const renderActiveTab = () => {
        switch (activeTab) {
            case "services":
                return <LookingToProvideTabsForm services={userData?.settings?.services} />;
            case "verifications":
                return <ServiceVerification />;
            case "address":
                return <ProviderAddress userData={userData} />;
            case "Wallet Management":
                return <Wallet />;
            case "support":
                return <Support />;
            default:
                return <div>Please select a settings section from the menu.</div>;
        }
    };

    return (
        <>
            <div className="pagetitle">
                <h1 className="capitalize">
                    {activeTab || "Provider Settings"}
                </h1>
            </div>
            {isLoading ? (
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                renderActiveTab()
            )}
        </>
    );
};

export default ProviderSettings;

