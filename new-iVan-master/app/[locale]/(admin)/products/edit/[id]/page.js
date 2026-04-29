"use client";
import { useTranslations } from 'next-intl';
import ProductForm from '@/components/ProductForm';
import { useParams } from 'next/navigation';

export default function EditProductPage() {
    const t = useTranslations("AdminPages.products");
    const params = useParams();
    const productId = params.id;

    return (
        <>
            <div className="pagetitle">
                <h1>Edit Product</h1>
                <nav>
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                            <a href="/admin-dashboard">Home</a>
                        </li>
                        <li className="breadcrumb-item">
                            <a href="/products">Products</a>
                        </li>
                        <li className="breadcrumb-item active">Edit Product</li>
                    </ol>
                </nav>
            </div>

            <section className="section">
                <div className="row">
                    <div className="col-lg-12">
                        <ProductForm 
                            productId={productId}
                            redirectPath="/products"
                        />
                    </div>
                </div>
            </section>
        </>
    );
}
