"use client";
import { useEffect, useState } from "react";
import ProductForm from "@/components/ProductForm";
import { getInventoryLabels } from "@/utils/serviceConfig";

export default function ShopOwnerAddProductPage() {
  const [itemLabels, setItemLabels] = useState(getInventoryLabels("shop"));

  useEffect(() => {
    const fetchShopType = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const data = await res.json();
        setItemLabels(getInventoryLabels(data?.shop?.type || "shop"));
      } catch (error) {
        console.error("Error fetching shop type:", error);
      }
    };

    fetchShopType();
  }, []);

  return (
    <>
      <div className="pagetitle">
        <h1>Add {itemLabels.singular}</h1>
        <nav>
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <a href="/shop/dashboard">Home</a>
            </li>
            <li className="breadcrumb-item">
              <a href="/shop/products">{itemLabels.plural}</a>
            </li>
            <li className="breadcrumb-item active">Add {itemLabels.singular}</li>
          </ol>
        </nav>
      </div>
      <section className="section">
        <div className="row">
          <div className="col-lg-12">
            <ProductForm productId="create" redirectPath="/shop/products" hidePickupAddress={true} />
          </div>
        </div>
      </section>
    </>
  );
}

