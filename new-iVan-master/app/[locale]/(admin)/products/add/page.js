"use client";
import { useTranslations } from 'next-intl';
import ProductForm from '@/components/ProductForm';

export default function AddProductPage() {
    const t = useTranslations("AdminPages.products");

    return (
        <>
            <div className="pagetitle">
                <h1>Add Product</h1>
                <nav>
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                            <a href="/admin-dashboard">Home</a>
                        </li>
                        <li className="breadcrumb-item">
                            <a href="/products">Products</a>
                        </li>
                        <li className="breadcrumb-item active">Add Product</li>
                    </ol>
                </nav>
            </div>

            <section className="section">
                <div className="row">
                    <div className="col-lg-12">
                        <ProductForm 
                            productId="create"
                            redirectPath="/products"
                        />
                    </div>
                </div>
            </section>
        </>
    );
}
