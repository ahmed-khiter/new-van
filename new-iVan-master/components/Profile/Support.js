"use client";
import SupportPage from "@/components/SupportPage";

export default function Support() {
    return (
        <SupportPage 
            translationNamespace="ProviderPages.support"
            showPageTitle={false}
            chatPath="/provider/chats"
        />
    );
}
