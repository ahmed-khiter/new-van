"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import StarRatingModal from "@/components/Modals/StarRatingModal";
import {
  getFileUrl,
  isNewItem,
} from "@/utils/helper";
import toast from "react-hot-toast";
import { FaStar } from 'react-icons/fa';
import { PiMapPinLight } from 'react-icons/pi';

export default function TopRatedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("ReservationsPage");
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  
  const city = searchParams?.get('city') || 'London';

  const fetchTopRatedRestaurants = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        type: "restaurant",
        status: "active",
        acceptsReservations: "true",
        city: city,
        limit: "100",
      });

      const response = await fetch(`/api/shops/public?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        let restaurantsData = data.shops || [];
        
        restaurantsData = restaurantsData.filter(restaurant => restaurant.acceptsReservations === true);
        
        restaurantsData = restaurantsData
          .sort((a, b) => {
            const ratingA = parseFloat(a.rating) || 0;
            const ratingB = parseFloat(b.rating) || 0;
            return ratingB - ratingA;
          })
          .slice(0, 10);
        
        setRestaurants(restaurantsData);
      } else {
        toast.error(data.error || t("failed_fetch_restaurants") || "Failed to fetch restaurants");
      }
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      toast.error(error.message || t("error_fetching_restaurants") || "Error fetching restaurants");
    } finally {
      setIsLoading(false);
    }
  }, [city, t]);

  useEffect(() => {
    fetchTopRatedRestaurants();
  }, [fetchTopRatedRestaurants]);

  const handleReserve = (restaurantId) => {
    const params = new URLSearchParams();
    searchParams?.forEach((value, key) => {
      params.set(key, value);
    });
    const queryString = params.toString();
    router.push(`/reservations/${restaurantId}${queryString ? `?${queryString}` : ''}`);
  };

  const handleOpenGoogleMaps = (address1, city, country) => {
    const address = [address1, city, country]
      .filter(Boolean)
      .join(", ");
    if (address) {
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container pt-[20px] sm:pt-[40px]">
        <div className="">
          {(() => {
            const params = new URLSearchParams();
            searchParams?.forEach((value, key) => {
              params.set(key, value);
            });
            const queryString = params.toString();

            return (
              <Link
                href={`/reservations/restaurants${
                  queryString ? `?${queryString}` : ""
                }`}
                className="text-gray-600 hover:text-gray-800 mb-4 inline-block"
              >
                ← Back to Restaurants
              </Link>
            );
          })()}
        </div>
        <h1 className="text-2xl font-bold text-black mb-2">
          <FaStar className="inline-block text-yellow-400 fill-current mr-2" />
          Top 10 Rated in {city}
        </h1>
        <div className="bg-white shadow-sm p-4 rounded-4 mb-4">
          <p className="text-gray-600 max-w-3xl mb-0">
            From iconic fine dining to local hidden gems, Swipped showcases the
            Top 10 restaurants people can't stop talking about. View ratings,
            explore menus, and secure your table instantly. Your next perfect
            meal starts here.
          </p>
        </div>
        <div className="row g-4">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="col-md-12 col-lg-6">
                <div className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : restaurants?.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <svg
                  className="w-16 h-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 0 0 3-.75 2.25 2.25 0 0 1 1.5-.75 2.25 2.25 0 0 1 1.5.75 3.001 3.001 0 0 0 3 .75m0 0h.008v.008H12V20.5z"
                  />
                </svg>
              </div>
              <p className="mt-3 text-gray-600 text-lg">
                No restaurants nearby yet — more are coming soon.
              </p>
              <div className="mt-6">
                <h4 className="text-gray-700 font-semibold mb-3">
                  List your restaurant
                </h4>
                <Link
                  href="/partner-with-us#restaurants"
                  className="inline-block px-6 py-2.5 bg_red text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </div>
          ) : (
            restaurants?.map((restaurant, idx) => {
              const rating = parseFloat(restaurant?.rating) || 0;
              const ratingDisplay = rating > 0 ? rating.toFixed(1) : "0.0";
              const reviewCount = Number(restaurant?.reviewCount || 0);

              return (
                <div key={restaurant.id || idx} className="col-md-12 col-lg-6">
                  <p className="text-base text-gray-500 mb-2 fw-bold">
                    Ranked #{idx + 1}
                  </p>

                  <div className="bg-white rounded-xl !p-2 shadow-sm flex !gap-2 sm:!p-4 sm:!gap-4 relative">
                    <div className="flex-shrink-0">
                      <div className="w-[110px] h-[130px] rounded-lg overflow-hidden">
                        {restaurant?.image ? (
                          <img
                            src={getFileUrl(restaurant?.image)}
                            alt={restaurant?.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <i className="bi bi-image text-gray-400 text-2xl"></i>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex gap-1 items-start justify-between">
                          <div>
                            <h3 className="text-[17px] sm:text-lg font-bold text-black !mb-0 sm:!mb-2 break-words">
                              {restaurant?.name}
                            </h3>
                          </div>
                          {/* Badges Container */}
                          
                        </div>

                        <div
                          className="flex items-center gap-1 mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            setSelectedRestaurant(restaurant);
                            setIsRatingModalOpen(true);
                          }}
                        >
                          <span className="text-base font-semibold text-black underline">
                            {ratingDisplay}
                          </span>
                          <span className="text-sm text-gray-600">({reviewCount})</span>
                          <div className="flex items-center gap-0.5">
                            <FaStar className="text-yellow-400 fill-current text-sm" />
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {isNewItem(restaurant?.createdAt, 30) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                {t("new_badge") || "New"}
                              </span>
                            )}
                            {restaurant?.shop_metadata?.halal && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                Halal
                              </span>
                            )}
                          </div>
                        </div>

                        {(restaurant.address1 ||
                          restaurant.city ||
                          restaurant.country) && (
                          <div className="flex items-center gap-1.5 mb-2 text-gray-600">
                            {/* <PiMapPinLight className="text-sm flex-shrink-0" /> */}
                            <span
                              className="text-sm text-gray-600  cursor-pointer"
                              onClick={() =>
                                handleOpenGoogleMaps(
                                  restaurant.address1,
                                  restaurant.city,
                                  restaurant.country
                                )
                              }
                            >
                              {[
                                restaurant.address1,
                                restaurant.city,
                                restaurant.country,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 justify-between items-center">
                        <div className="inline-block px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md mb-1">
                          No Deposit Required
                        </div>

                        <button
                          onClick={() => handleReserve(restaurant.id)}
                          className="px-3 py-1.5 bg_red text-white rounded-4 text-sm font-medium hover:bg-orange-600 transition-colors"
                        >
                          {t("reserve") || "Reserve"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <StarRatingModal
        isOpen={isRatingModalOpen}
        onClose={() => {
          setIsRatingModalOpen(false);
          setSelectedRestaurant(null);
        }}
        title="Rating"
        subtitle={selectedRestaurant ? selectedRestaurant.name : "Restaurant"}
        rating={
          selectedRestaurant?.rating
            ? parseFloat(selectedRestaurant.rating)
            : 0
        }
        isStatic={true}
      />
    </div>
  );
}
