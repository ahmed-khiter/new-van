"use client";
import { getFileUrl, formatAmountToCurrency, isNewItem } from "@/utils/helper";
import FavoriteToggle from "@/components/FavoriteToggle";

export default function MenuItemCard({ menuItem, onAddToCart, isInCart, onViewDetail }) {
    return (
        <div className="service_card">
            <div
                className="cursor-pointer"
                onClick={onViewDetail}
            >
                <div className="service_img_box">
                    {menuItem.image ? (
                        <img
                            src={getFileUrl(menuItem.image)}
                            alt={menuItem.name}
                            className="service_img object-cover"
                            onLoad={(e) => {
                                e.target.style.display = "block";
                                if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = "none";
                                }
                            }}
                            onError={(e) => {
                                e.target.style.display = "none";
                                if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = "flex";
                                }
                            }}
                        />
                    ) : null}
                    <div
                        className="service_img_box w-full h-full bg-gray-300 flex items-center justify-center service_img"
                        style={{
                            display: menuItem.image ? "none" : "flex",
                        }}
                    >
                        <i className="bi bi-image text-muted text-5xl"></i>
                    </div>
                </div>
            </div>

            {/* Availability Badge */}
            <div className="position-absolute top-0 end-0 m-2">
                <span
                    className={`badge ${menuItem.isAvailable ? "bg-success" : "bg-danger"}`}
                >
                    {menuItem.isAvailable ? "Available" : "Unavailable"}
                </span>
            </div>

            {/* Favorite Toggle */}
            <div className="position-absolute top-0 start-0 m-2">
                <FavoriteToggle
                    menuItem={menuItem}
                    className=""
                    buttonClassName="!text-white"
                    onToggle={(itemId, isFavorite) => {
                        // Handle favorite toggle
                    }}
                />
            </div>

            <div className="service_overlay">
                <div className="icon_box">
                    <img src={"/assets/img/icon/box.svg"} alt="" />
                </div>
                <div className="d-flex align-items-center justify-content-between gap-2">
                    <h5 className="font-semibold text-lg mb-1 mt-2 truncate mb-0">
                        {menuItem.name}
                    </h5>
                    {isNewItem(menuItem?.createdAt) && (
                        <span className="new-badge new-badge-light-green">New</span>
                    )}
                </div>
                {/* {menuItem.category && (
                    <span className="service_price">
                        {menuItem.category}
                    </span>
                )} */}
                {menuItem.description && (
                    <p className="text-white text-sm mt-1 mb-2" style={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {menuItem.description}
                    </p>
                )}

                {/* Price + Icons Row */}
                <div className="flex items-center justify-between mt-2">
                    {/* Price */}
                    <span className="service_price text-base font-semibold">
                        {formatAmountToCurrency(Number(menuItem.price))}
                    </span>

                    {/* Icons */}
                    <div className="flex items-center gap-3">
                        {/* Cart Toggle Icon */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddToCart(menuItem);
                            }}
                            disabled={!menuItem.isAvailable}
                            className="text-xl transition"
                            style={{
                                color: 'white',
                                opacity: !menuItem.isAvailable ? 0.5 : 1
                            }}
                            title={isInCart ? "Remove from cart" : "Add to cart"}
                        >
                            <i className={`bi ${isInCart ? 'bi-cart-fill' : 'bi-cart'}`}></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

