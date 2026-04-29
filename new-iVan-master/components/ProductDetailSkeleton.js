"use client";

const ProductDetailSkeleton = () => {
  return (
      <div className="container !py-5">
        {/* Back Button Skeleton */}
        <div className="mb-4">
          <div className="bg-gray-200 rounded h-10 w-24 opacity-30 animate-pulse"></div>
        </div>

        <div className="row">
          {/* Product Image Skeleton */}
          <div className="col-lg-6 mb-4">
            <div className="position-relative">
              <div className="bg-gray-200 rounded-lg animate-pulse" style={{ height: "400px" }}></div>
            </div>
          </div>

          {/* Product Info Skeleton */}
          <div className="col-lg-6">
            <div className="ps-lg-4">
              {/* Product Name Skeleton */}
              <div className="bg-gray-200 rounded h-12 w-3/4 opacity-30 animate-pulse mb-3"></div>

              {/* Category Skeleton */}
              <div className="bg-gray-200 rounded h-6 w-24 opacity-30 animate-pulse mb-3"></div>

              {/* Price Skeleton */}
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="bg-gray-200 rounded h-8 w-32 opacity-30 animate-pulse"></div>
                <div className="bg-gray-200 rounded h-6 w-16 opacity-30 animate-pulse"></div>
              </div>

              {/* Description Skeleton */}
              <div className="mb-4">
                <div className="bg-gray-200 rounded h-5 w-24 opacity-30 animate-pulse mb-2"></div>
                <div className="bg-gray-200 rounded h-4 w-full opacity-30 animate-pulse mb-2"></div>
                <div className="bg-gray-200 rounded h-4 w-3/4 opacity-30 animate-pulse mb-2"></div>
                <div className="bg-gray-200 rounded h-4 w-1/2 opacity-30 animate-pulse"></div>
              </div>

              {/* Product Details Skeleton */}
              <div className="mb-4">
                <div className="bg-gray-200 rounded h-5 w-32 opacity-30 animate-pulse mb-3"></div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="bg-gray-200 rounded h-4 w-full opacity-30 animate-pulse"></div>
                  </div>
                  <div className="col-md-6">
                    <div className="bg-gray-200 rounded h-4 w-full opacity-30 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Cart Buttons Skeleton */}
              <div className="d-grid gap-2">
                <div className="bg-gray-200 rounded h-12 w-full opacity-30 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ProductDetailSkeleton;
