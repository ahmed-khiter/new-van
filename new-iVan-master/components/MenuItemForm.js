"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { getFileUrl } from '@/utils/helper';
import { useCategories } from '@/hooks/useCategories';
import { FaTimes, FaPlus } from 'react-icons/fa';

const MenuItemForm = ({ 
    menuItemId = "create", 
    redirectPath = "/menu-items",
    onSuccess = null
}) => {
    const t = useTranslations("MenuItemForm");
    const router = useRouter();
    const isUpdating = menuItemId !== "create";
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMenuItem, setIsLoadingMenuItem] = useState(isUpdating);
    const { categories, loading: categoriesLoading } = useCategories('restaurant');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        cuisine: '',
        menuCategory: '',
        image: null,
        existingImage: null,
        isActive: true,
        isAvailable: true,
        preparationTime: '',
        allergens: '',
        dietaryInfo: '',
        calories: ''
    });
    const [menuItemData, setMenuItemData] = useState(null);

    // Multi-image state
    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const imageInputRef = useRef(null);
    const MAX_IMAGES = 8;
    const totalImages = existingImages.length + newImages.length;

    useEffect(() => {
        if (isUpdating && menuItemId) {
            fetchMenuItem();
        }
    }, [menuItemId, isUpdating]);

    useEffect(() => {
        if (menuItemData && !categoriesLoading && categories.length > 0) {
            const item = menuItemData;
            let categoryId = '';
            if (item.category) {
                const categoryIdNum = parseInt(item.category);
                if (!isNaN(categoryIdNum)) {
                    categoryId = item.category;
                } else {
                    const categoryMatch = categories.find(cat => cat.name === item.category);
                    if (categoryMatch) {
                        categoryId = categoryMatch.id.toString();
                    } else {
                        categoryId = item.category;
                    }
                }
            }
            
            setFormData(prev => {
                if (prev.category !== categoryId) {
                    return {
                        ...prev,
                        category: categoryId
                    };
                }
                return prev;
            });
        }
    }, [categories, categoriesLoading, menuItemData]);

    const fetchMenuItem = async () => {
        try {
            setIsLoadingMenuItem(true);
            const response = await fetch(`/api/products/${menuItemId}`);
            if (response.ok) {
                const data = await response.json();
                const item = data.product;
                
                setMenuItemData(item);
                
                setFormData({
                    name: item.name || '',
                    description: item.description || '',
                    price: item.price?.toString() || '',
                    category: item.category || '',
                    cuisine: item.cuisine || '',
                    menuCategory: item.menuCategory || '',
                    image: null,
                    existingImage: item.image,
                    isActive: item.isActive !== undefined ? item.isActive : true,
                    isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
                    preparationTime: item.preparationTime?.toString() || '',
                    allergens: item.allergens ? JSON.stringify(item.allergens) : '',
                    dietaryInfo: item.dietaryInfo ? JSON.stringify(item.dietaryInfo) : '',
                    calories: item.calories?.toString() || ''
                });

                // Load existing images array
                const imgs = Array.isArray(item.images) ? item.images :
                    (item.image ? [item.image] : []);
                setExistingImages(imgs);
            } else {
                toast.error('Failed to fetch menu item');
                router.push('/menu-items');
            }
        } catch (error) {
            console.error('Error fetching menu item:', error);
            toast.error('Failed to fetch menu item');
            router.push('/menu-items');
        } finally {
            setIsLoadingMenuItem(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, files, checked } = e.target;
        if (type === 'file') {
            setFormData(prev => ({
                ...prev,
                [name]: files[0] || null
            }));
        } else if (type === 'checkbox') {
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!formData.name || !formData.price) {
                toast.error('Name and price are required');
                setIsLoading(false);
                return;
            }

            if (!isUpdating && existingImages.length === 0 && newImages.length === 0) {
                toast.error('Menu item photo is required');
                setIsLoading(false);
                return;
            }

            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('description', formData.description || '');
            submitData.append('price', formData.price);
            submitData.append('category', formData.category || '');
            submitData.append('cuisine', formData.cuisine || '');
            submitData.append('menuCategory', formData.menuCategory || '');
            submitData.append('isActive', formData.isActive.toString());
            submitData.append('isAvailable', formData.isAvailable.toString());
            submitData.append('preparationTime', formData.preparationTime || '');
            submitData.append('calories', formData.calories || '');
            
            if (formData.allergens) {
                try {
                    const allergensArray = JSON.parse(formData.allergens);
                    submitData.append('allergens', JSON.stringify(allergensArray));
                } catch (e) {
                    const allergensArray = formData.allergens.split(',').map(a => a.trim()).filter(Boolean);
                    submitData.append('allergens', JSON.stringify(allergensArray));
                }
            }
            
            if (formData.dietaryInfo) {
                try {
                    const dietaryArray = JSON.parse(formData.dietaryInfo);
                    submitData.append('dietaryInfo', JSON.stringify(dietaryArray));
                } catch (e) {
                    const dietaryArray = formData.dietaryInfo.split(',').map(d => d.trim()).filter(Boolean);
                    submitData.append('dietaryInfo', JSON.stringify(dietaryArray));
                }
            }
            
            // Send existing images that were kept
            submitData.append('existingImages', JSON.stringify(existingImages));

            // Send new image files
            for (const file of newImages) {
                submitData.append('images', file);
            }

            const url = isUpdating ? `/api/products/${menuItemId}` : '/api/products';
            const method = isUpdating ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method: method,
                body: submitData
            });

            if (response.ok) {
                const action = isUpdating ? 'updated' : 'created';
                toast.success(`Menu item ${action} successfully`);
                
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.push(redirectPath);
                }
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || `Failed to ${isUpdating ? 'update' : 'create'} menu item`);
            }
        } catch (error) {
            console.error('Error saving menu item:', error);
            toast.error(`Failed to ${isUpdating ? 'update' : 'create'} menu item`);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingMenuItem) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">
                    {isUpdating ? 'Edit Menu Item' : 'Menu Item Information'}
                </h5>

                <form onSubmit={handleSubmit}>
                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label htmlFor="name" className="form-label">Menu Item Name *</label>
                            <input
                                type="text"
                                className="form-control"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="col-md-3">
                            <label htmlFor="category" className="form-label">Category</label>
                            <select
                                className="form-control"
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleInputChange}
                                disabled={categoriesLoading}
                            >
                                <option value="">Select Category</option>
                                {categoriesLoading ? (
                                    <option value="" disabled>Loading categories...</option>
                                ) : (
                                    <>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                        {/* Show existing category if it's not in the list (for backward compatibility with old name-based data) */}
                                        {formData.category && 
                                         !categoriesLoading && 
                                         !categories.find(cat => cat.id.toString() === formData.category) &&
                                         !categories.find(cat => cat.name === formData.category) && (
                                            <option value={formData.category} disabled>
                                                {formData.category} (not in list)
                                            </option>
                                        )}
                                    </>
                                )}
                            </select>
                            {!categoriesLoading && categories.length === 0 && (
                                <small className="text-muted">No categories available. Please add categories in admin panel.</small>
                            )}
                        </div>
                        <div className="col-md-3">
                            <label htmlFor="menuCategory" className="form-label">Menu Category</label>
                            <select
                                className="form-control"
                                id="menuCategory"
                                name="menuCategory"
                                value={formData.menuCategory}
                                onChange={handleInputChange}
                            >
                                <option value="">Select Menu Category</option>
                                <option value="Starters">Starters</option>
                                <option value="Main Dishes">Main Dishes</option>
                                <option value="Desserts">Desserts</option>
                                <option value="Drinks">Drinks</option>
                            </select>
                        </div>
                    </div>

                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label htmlFor="cuisine" className="form-label">Cuisine</label>
                            <input
                                type="text"
                                className="form-control"
                                id="cuisine"
                                name="cuisine"
                                value={formData.cuisine}
                                onChange={handleInputChange}
                                placeholder="e.g., Italian, Chinese"
                            />
                        </div>
                    </div>

                    <div className="row mb-3">
                        <div className="col-md-4">
                            <label htmlFor="price" className="form-label">Price *</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                id="price"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="col-md-4">
                            <label htmlFor="preparationTime" className="form-label">Preparation Time (minutes)</label>
                            <input
                                type="number"
                                className="form-control"
                                id="preparationTime"
                                name="preparationTime"
                                value={formData.preparationTime}
                                onChange={handleInputChange}
                                min="0"
                            />
                        </div>
                        <div className="col-md-4">
                            <label htmlFor="calories" className="form-label">Calories</label>
                            <input
                                type="number"
                                className="form-control"
                                id="calories"
                                name="calories"
                                value={formData.calories}
                                onChange={handleInputChange}
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="description" className="form-label">Description</label>
                        <textarea
                            className="form-control"
                            id="description"
                            name="description"
                            rows="4"
                            value={formData.description}
                            onChange={handleInputChange}
                            placeholder="Enter a detailed description of the menu item..."
                        />
                    </div>

                    <div className="row mb-3">
                        <div className="col-md-6">
                            <label htmlFor="allergens" className="form-label">Allergens</label>
                            <input
                                type="text"
                                className="form-control"
                                id="allergens"
                                name="allergens"
                                value={formData.allergens}
                                onChange={handleInputChange}
                                placeholder='peanuts, dairy'
                            />
                            
                        </div>
                        <div className="col-md-6">
                            <label htmlFor="dietaryInfo" className="form-label">Dietary Info</label>
                            <input
                                type="text"
                                className="form-control"
                                id="dietaryInfo"
                                name="dietaryInfo"
                                value={formData.dietaryInfo}
                                onChange={handleInputChange}
                                placeholder='vegetarian, vegan'
                            />
                           
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Menu Item Images {!isUpdating ? '*' : ''} <small className="text-muted">({totalImages}/{MAX_IMAGES})</small>
                        </label>
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="d-none"
                            onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                const remaining = MAX_IMAGES - totalImages;
                                if (remaining <= 0) {
                                    toast.error(`Maximum ${MAX_IMAGES} images allowed`);
                                    return;
                                }
                                const toAdd = files.slice(0, remaining);
                                setNewImages(prev => [...prev, ...toAdd]);
                                e.target.value = '';
                            }}
                        />
                        <div className="d-flex flex-wrap gap-2 mt-2">
                            {existingImages.map((key, idx) => (
                                <div key={`existing-${idx}`} className="position-relative" style={{ width: '120px', height: '120px' }}>
                                    <img
                                        src={getFileUrl(key)}
                                        alt={`Item ${idx + 1}`}
                                        className="rounded"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', border: idx === 0 ? '2px solid #198754' : '1px solid #dee2e6' }}
                                    />
                                    {idx === 0 && (
                                        <span className="position-absolute top-0 start-0 badge bg-success" style={{ fontSize: '10px', borderRadius: '0 0 4px 0' }}>Main</span>
                                    )}
                                    <button
                                        type="button"
                                        className="position-absolute top-0 end-0 btn btn-sm btn-danger rounded-circle d-flex align-items-center justify-content-center"
                                        style={{ width: '22px', height: '22px', padding: 0, transform: 'translate(30%, -30%)' }}
                                        onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))}
                                    >
                                        <FaTimes style={{ fontSize: '10px' }} />
                                    </button>
                                </div>
                            ))}
                            {newImages.map((file, idx) => (
                                <div key={`new-${idx}`} className="position-relative" style={{ width: '120px', height: '120px' }}>
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`New ${idx + 1}`}
                                        className="rounded"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', border: existingImages.length === 0 && idx === 0 ? '2px solid #198754' : '1px solid #dee2e6' }}
                                    />
                                    {existingImages.length === 0 && idx === 0 && (
                                        <span className="position-absolute top-0 start-0 badge bg-success" style={{ fontSize: '10px', borderRadius: '0 0 4px 0' }}>Main</span>
                                    )}
                                    <button
                                        type="button"
                                        className="position-absolute top-0 end-0 btn btn-sm btn-danger rounded-circle d-flex align-items-center justify-content-center"
                                        style={{ width: '22px', height: '22px', padding: 0, transform: 'translate(30%, -30%)' }}
                                        onClick={() => setNewImages(prev => prev.filter((_, i) => i !== idx))}
                                    >
                                        <FaTimes style={{ fontSize: '10px' }} />
                                    </button>
                                </div>
                            ))}
                            {totalImages < MAX_IMAGES && (
                                <button
                                    type="button"
                                    className="rounded d-flex flex-column align-items-center justify-content-center"
                                    style={{ width: '120px', height: '120px', border: '2px dashed #adb5bd', background: '#f8f9fa', cursor: 'pointer' }}
                                    onClick={() => imageInputRef.current?.click()}
                                >
                                    <FaPlus className="text-muted mb-1" />
                                    <small className="text-muted">Add Photo</small>
                                </button>
                            )}
                        </div>
                        {totalImages === 0 && (
                            <small className="text-muted d-block mt-1">Upload up to {MAX_IMAGES} images. First image will be the main photo.</small>
                        )}
                    </div>

                    <div className="row mb-3">
                        <div className="col-md-6">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="isActive"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="isActive">
                                    Active
                                </label>
                            </div>
                            <small className="text-muted">Active items will be visible to customers</small>
                        </div>
                        <div className="col-md-6">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="isAvailable"
                                    name="isAvailable"
                                    checked={formData.isAvailable}
                                    onChange={handleInputChange}
                                />
                                <label className="form-check-label" htmlFor="isAvailable">
                                    Available
                                </label>
                            </div>
                            <small className="text-muted">Available items can be added to cart</small>
                        </div>
                    </div>

                    <div className="text-end">
                        <button
                            type="button"
                            className="btn btn-secondary me-2"
                            onClick={() => router.push(redirectPath)}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    {isUpdating ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                `${isUpdating ? 'Update' : 'Create'} Menu Item`
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MenuItemForm;

