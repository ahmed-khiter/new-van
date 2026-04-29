"use client";
import SupportPage from "@/components/SupportPage";

export default function RestaurantSupport() {
    return (
        <SupportPage 
            translationNamespace="RestaurantPages.support"
            showPageTitle={true}
            chatPath="/restaurant/chats"
        />
    );
}
