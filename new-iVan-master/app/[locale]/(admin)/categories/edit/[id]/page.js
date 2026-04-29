"use client";
import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import toast from 'react-hot-toast';
import CategoryForm from '../../components/CategoryForm';

export default function EditCategoryPage({ params }) {
    const router = useRouter();
    const { id } = params;
    const [isLoading, setIsLoading] = useState(true);
    const [categoryData, setCategoryData] = useState(null);

    useEffect(() => {
        fetchCategory();
    }, [id]);

    const fetchCategory = async () => {
        try {
            const response = await fetch(`/api/categories/${id}`);
            if (response.ok) {
                const data = await response.json();
                setCategoryData(data.category);
            } else {
                toast.error('Failed to fetch category');
                router.push('/categories');
            }
        } catch (error) {
            console.error('Error fetching category:', error);
            toast.error('Failed to fetch category');
            router.push('/categories');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="pagetitle">
                <h1>Edit Category</h1>
                <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="pagetitle">
                <h1>Edit Category</h1>
                <nav>
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                            <Link href="/admin-dashboard">Home</Link>
                        </li>
                        <li className="breadcrumb-item">
                            <Link href="/categories">Categories</Link>
                        </li>
                        <li className="breadcrumb-item active">Edit Category</li>
                    </ol>
                </nav>
            </div>

            <section className="section">
                <CategoryForm 
                    categoryId={id} 
                    initialData={categoryData} 
                />
            </section>
        </>
    );
}

