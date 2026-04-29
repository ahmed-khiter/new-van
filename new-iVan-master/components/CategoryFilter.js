"use client";
import { useCategories } from "@/hooks/useCategories";

const CategoryFilter = ({
  selectedCategory = "",
  onCategoryChange,
  showAllOption = true,
  className = "",
  variant = "cards",
  type = null,
}) => {
  const { categories, loading } = useCategories(type);

  if (variant === "dropdown") {
    return (
      <div className={className}>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="h-[44px] w-full rounded-[12px] border border-[#d1d5db] bg-white px-3 text-[14px] text-[#1a1a2e] outline-none focus:border-[#1a1a2e]"
          disabled={loading}
        >
          {showAllOption && <option value="">All Categories</option>}
          {loading ? (
            <option value="" disabled>Loading...</option>
          ) : (
            categories.map((cat, i) => (
              <option key={cat.id || i} value={String(cat.id)}>
                {cat.name}
              </option>
            ))
          )}
        </select>
      </div>
    );
  }

  // Cards variant — filter out any API "All" category when we're adding our own
  const filteredCategories = loading
    ? []
    : showAllOption
      ? categories.filter((c) => c.name?.toLowerCase() !== "all")
      : categories;

  const allItems = [
    ...(showAllOption
      ? [{ id: "", name: "All", image: "/assets/img/categories/all.png" }]
      : []),
    ...filteredCategories,
  ];

  return (
    <div className={`flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden ${className}`}>
      {loading && !showAllOption ? (
        Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex shrink-0 flex-col items-center gap-1.5">
            <div className="h-[62px] w-[62px] animate-pulse rounded-[16px] bg-[#f0f0f0]" />
            <div className="h-2.5 w-10 animate-pulse rounded bg-[#f0f0f0]" />
          </div>
        ))
      ) : (
        allItems.map((cat, i) => {
          const isActive = String(selectedCategory) === String(cat.id);
          return (
            <button
              key={cat.id ?? i}
              type="button"
              onClick={() => onCategoryChange(String(cat.id))}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <div
                className={`flex h-[62px] w-[62px] items-center justify-center overflow-hidden rounded-[16px] transition ${
                  isActive
                    ? "ring-2 ring-[#1a1a2e] ring-offset-1"
                    : "border border-[#e5e7eb]"
                }`}
              >
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#f5f5f5] text-[22px]">
                    🛍
                  </div>
                )}
              </div>
              <span
                className={`max-w-[68px] truncate text-center text-[10.5px] leading-tight ${
                  isActive ? "font-bold text-[#1a1a2e]" : "font-medium text-[#6b7280]"
                }`}
              >
                {cat.name}
              </span>
            </button>
          );
        })
      )}
    </div>
  );
};

export default CategoryFilter;
