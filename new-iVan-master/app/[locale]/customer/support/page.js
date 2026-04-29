"use client";
import SupportPage from "@/components/SupportPage";

export default function CustomerSupport() {
    return (
        <SupportPage 
            translationNamespace="VisitorPages.support"
            showPageTitle={true}
            chatPath="/customer/chats"
        />
    );
}
