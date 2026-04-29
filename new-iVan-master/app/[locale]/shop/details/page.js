"use client";
import { useContext } from "react";
import ProfilePage from "@/components/Profile/ProfilePage";
import { AppContext } from "@/lib/contexts/context";
import { getServiceConfig } from "@/utils/serviceConfig";

const ShopDetailsPage = () => {
  const { shopType, serviceConfig: contextConfig } = useContext(AppContext);
  const serviceConfig = contextConfig || getServiceConfig(shopType || "shop");
console.log('shopType', shopType);
  return (
    <>
      <div className="pagetitle">
        <h1>{serviceConfig.detailsTitle}</h1>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a href="/shop/dashboard">Home</a>
            </li>
            <li className="breadcrumb-item active">{serviceConfig.detailsTitle}</li>
          </ol>
        </nav>
      </div>
      <ProfilePage userRole={shopType} />
    </>
  );
};

export default ShopDetailsPage;

