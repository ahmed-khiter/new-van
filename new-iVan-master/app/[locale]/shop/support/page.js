"use client";
import SupportPage from "@/components/SupportPage";

export default function ShopSupport() {
    return (
        <SupportPage 
            translationNamespace="ShopOwnerPages.support"
            showPageTitle={true}
            chatPath="/shop/chats"
        />
    );
}
