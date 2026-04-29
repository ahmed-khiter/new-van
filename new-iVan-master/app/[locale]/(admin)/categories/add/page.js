"use client";
import { Link } from '@/i18n/routing';
import CategoryForm from '../components/CategoryForm';

export default function AddCategoryPage() {
    return (
        <>
            <div className="pagetitle">
                <h1>Add Category</h1>
                <nav>
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                            <Link href="/admin-dashboard">Home</Link>
                        </li>
                        <li className="breadcrumb-item">
                            <Link href="/categories">Categories</Link>
                        </li>
                        <li className="breadcrumb-item active">Add Category</li>
                    </ol>
                </nav>
            </div>

            <section className="section">
                <CategoryForm />
            </section>
        </>
    );
}

