"use client";
import { useMemo } from "react";
import { useCategories } from "@/hooks/useCategories";

export default function MenuCategoryFilter({
    menuItems = [],
    selectedCategory = "",
    onCategoryChange,
    showAllOption = true,
    variant = "cards", // "cards" or "dropdown"
    className = "",
    type = "restaurant" // "shop" or "restaurant" to fetch appropriate categories
}) {
    const { categories: allCategories, loading } = useCategories(type);

    // Extract unique category IDs from menu items and map them to category objects
    const categories = useMemo(() => {
        if (!menuItems || menuItems.length === 0) return [];
        
        const uniqueCategoryIds = new Set();
        menuItems.forEach(item => {
            if (item.category) {
                // Handle both ID (number/string) and name cases
                const categoryId = typeof item.category === 'object' 
                    ? item.category.id 
                    : item.category;
                if (categoryId) {
                    uniqueCategoryIds.add(String(categoryId));
                }
            }
        });

        // Map category IDs to category objects with names
        const categoryMap = new Map();
        allCategories.forEach(cat => {
            categoryMap.set(String(cat.id), cat);
        });

        // Return categories that exist in menu items, sorted by name
        return Array.from(uniqueCategoryIds)
            .map(id => categoryMap.get(id))
            .filter(Boolean) // Remove any undefined entries
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [menuItems, allCategories]);

    if (variant === "dropdown") {
        return (
            <select
                className={`form-select ${className}`}
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                disabled={loading}
            >
                {showAllOption && (
                    <option value="">All Categories</option>
                )}
                {loading ? (
                    <option value="" disabled>Loading categories...</option>
                ) : (
                    categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))
                )}
            </select>
        );
    }

    return (
        <div className={`d-flex flex-wrap gap-2 ${className}`}>
            {showAllOption && (
                <button
                    className={`btn btn-sm rounded-pill ${
                        selectedCategory === ""
                            ? "custom_btn_solid"
                            : "custom_btn_outline--small"
                    }`}
                    onClick={() => onCategoryChange("")}
                >
                    All
                </button>
            )}
            {loading ? (
                <div className="text-muted">Loading categories...</div>
            ) : (
                categories.map((category) => (
                    <button
                        key={category.id}
                        className={`btn btn-sm rounded-pill ${
                            selectedCategory === String(category.id)
                                ? "custom_btn_solid"
                                : "custom_btn_outline--small"
                        }`}
                        onClick={() => onCategoryChange(String(category.id))}
                    >
                        {category.name}
                    </button>
                ))
            )}
        </div>
    );
}

