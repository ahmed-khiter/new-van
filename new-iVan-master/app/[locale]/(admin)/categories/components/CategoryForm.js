"use client";
import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import toast from 'react-hot-toast';
import { getFileUrl } from '@/utils/helper';

export default function CategoryForm({ categoryId = null, initialData = null }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        image: null,
        currentImage: null,
        type: ''
    });
    const [subcategories, setSubcategories] = useState([]);
    const [newSubcategory, setNewSubcategory] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [removeImage, setRemoveImage] = useState(false);

    const isEditMode = !!categoryId;

    useEffect(() => {
        if (isEditMode && initialData) {
            setFormData({
                name: initialData.name || '',
                image: null,
                currentImage: initialData.image,
                type: initialData.type || ''
            });
            if (initialData.subcategories) {
                const subs = Array.isArray(initialData.subcategories) 
                    ? initialData.subcategories 
                    : [];
                setSubcategories(subs);
            }
            if (initialData.image) {
                setImagePreview(getFileUrl(initialData.image));
            }
        }
    }, [isEditMode, initialData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Only PNG, JPG, JPEG, and WEBP images are allowed');
                e.target.value = '';
                return;
            }

            setFormData(prev => ({
                ...prev,
                image: file
            }));
            setRemoveImage(false);

            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({
            ...prev,
            image: null,
            currentImage: null
        }));
        setImagePreview(null);
        setRemoveImage(true);
        // Reset file input
        const fileInput = document.getElementById('image');
        if (fileInput) fileInput.value = '';
    };

    const handleAddSubcategory = () => {
        const trimmed = newSubcategory.trim();
        if (!trimmed) return;
        if (subcategories.includes(trimmed)) {
            toast.error('This subcategory already exists');
            return;
        }
        setSubcategories(prev => [...prev, trimmed]);
        setNewSubcategory('');
    };

    const handleRemoveSubcategory = (index) => {
        setSubcategories(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubcategoryKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSubcategory();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            toast.error('Category name is required');
            return;
        }

        setIsLoading(true);

        try {
            const data = new FormData();
            data.append('name', formData.name);
            if (formData.type) {
                data.append('type', formData.type);
            }
            if (subcategories.length > 0) {
                data.append('subcategories', JSON.stringify(subcategories));
            }
            if (formData.image) {
                data.append('image', formData.image);
            }
            if (removeImage) {
                data.append('removeImage', 'true');
            }

            const url = isEditMode ? `/api/categories/${categoryId}` : '/api/categories';
            const method = isEditMode ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                body: data
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(isEditMode ? 'Category updated successfully' : 'Category created successfully');
                router.push('/categories');
            } else {
                toast.error(result.error || `Failed to ${isEditMode ? 'update' : 'create'} category`);
            }
        } catch (error) {
            console.error(`Error ${isEditMode ? 'updating' : 'creating'} category:`, error);
            toast.error(`Failed to ${isEditMode ? 'update' : 'create'} category`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="row">
            <div className="col-lg-8">
                <div className="card">
                    <div className="card-body">
                        <h5 className="card-title">
                            {isEditMode ? 'Edit Category' : 'Category Details'}
                        </h5>

                        <form onSubmit={handleSubmit}>
                            <div className="row mb-3">
                                <label htmlFor="name" className="col-sm-3 col-form-label">
                                    Category Name <span className="text-danger">*</span>
                                </label>
                                <div className="col-sm-9">
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter category name"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row mb-3">
                                <label htmlFor="type" className="col-sm-3 col-form-label">
                                    Type
                                </label>
                                <div className="col-sm-9">
                                    <select
                                        className="form-control"
                                        id="type"
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">All Types</option>
                                        <option value="shop">Shop</option>
                                        <option value="restaurant">Restaurant</option>
                                        <option value="mot">MOT Center</option>
                                        <option value="shisha">Shisha lounges</option>
                                        <option value="spa">Spa</option>
                                        <option value="beauty">Beauty Salon</option>
                                        <option value="healthcare">Healthcare Provider</option>
                                        <option value="events">Events Provider</option>
                                        <option value="entertainment">Entertainment Venue</option>
                                    </select>
                                    <small className="text-muted">Select the type of category (optional)</small>
                                </div>
                            </div>

                            <div className="row mb-3">
                                <label className="col-sm-3 col-form-label">Subcategories</label>
                                <div className="col-sm-9">
                                    <div className="input-group mb-2">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Enter subcategory name"
                                            value={newSubcategory}
                                            onChange={(e) => setNewSubcategory(e.target.value)}
                                            onKeyDown={handleSubcategoryKeyDown}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary"
                                            onClick={handleAddSubcategory}
                                        >
                                            <i className="bi bi-plus-lg"></i> Add
                                        </button>
                                    </div>
                                    {subcategories.length > 0 && (
                                        <div className="d-flex flex-wrap gap-2">
                                            {subcategories.map((sub, index) => (
                                                <span
                                                    key={index}
                                                    className="badge bg-light text-dark border d-flex align-items-center gap-1"
                                                    style={{ fontSize: '0.9rem', padding: '6px 10px' }}
                                                >
                                                    {sub}
                                                    <button
                                                        type="button"
                                                        className="btn-close btn-close-sm ms-1"
                                                        style={{ fontSize: '0.6rem' }}
                                                        onClick={() => handleRemoveSubcategory(index)}
                                                        aria-label="Remove"
                                                    ></button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <small className="text-muted">Press Enter or click Add to add a subcategory</small>
                                </div>
                            </div>

                            <div className="row mb-3">
                                <label htmlFor="image" className="col-sm-3 col-form-label">
                                    Category Image <small className="text-muted">(PNG, JPG, JPEG, WEBP)</small>
                                </label>
                                <div className="col-sm-9">
                                    <input
                                        type="file"
                                        className="form-control"
                                        id="image"
                                        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/jpg,image/webp"
                                        onChange={handleImageChange}
                                    />
                                    <small className="text-muted">Only PNG, JPG, JPEG, and WEBP images are allowed</small>
                                </div>
                            </div>

                            {imagePreview && (
                                <div className="row mb-3">
                                    <label className="col-sm-3 col-form-label">Preview</label>
                                    <div className="col-sm-9">
                                        <div className="position-relative d-inline-block">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="rounded"
                                                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm position-absolute top-0 end-0"
                                                onClick={handleRemoveImage}
                                                style={{ transform: 'translate(25%, -25%)' }}
                                            >
                                                <i className="bi bi-x"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="row mb-3">
                                <div className="col-sm-9 offset-sm-3">
                                    <button
                                        type="submit"
                                        className="btn btn-primary me-2"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                {isEditMode ? 'Updating...' : 'Creating...'}
                                            </>
                                        ) : (
                                            isEditMode ? 'Update Category' : 'Create Category'
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => router.push('/categories')}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
