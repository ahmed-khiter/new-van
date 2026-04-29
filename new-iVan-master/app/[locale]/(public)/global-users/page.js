"use client";
import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { FaSearch, FaArrowLeft } from "react-icons/fa";
import { getLocationOptions } from "@/utils/helper";

export default function GlobalUsersPage() {
  const router = useRouter();
  const t = useTranslations("PublicPages");
  const [countries, setCountries] = useState([]);
  const [globalUserCount, setGlobalUserCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("count"); // "count" or "name"
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    const fetchCountryStats = async () => {
      try {
        const response = await fetch("/api/stats/countries");
        const data = await response.json();
        if (data.countries) {
          setCountries(data.countries);
        }
        if (data.globalUserCount !== undefined) {
          setGlobalUserCount(data.globalUserCount);
        }
      } catch (error) {
        console.error("Error fetching country stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCountryStats();
  }, []);

  // Filter and sort countries
  const filteredAndSortedCountries = countries
    .filter((country) =>
      country.country?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "count") {
        return b.count - a.count;
      } else {
        return a.country.localeCompare(b.country);
      }
    });

  // Get location options once for flag lookup
  const locations = getLocationOptions();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white text_black p-4 flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text_black"
        >
          <FaArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text_black">Global Users</h1>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <FaSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00403f] focus:border-[#00403f]"
            />
          </div>
        </div>

        {/* Global Stats */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-bold text_black">Global</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setSortBy(sortBy === "count" ? "name" : "count")}
                className="text_orange text-sm font-medium hover:opacity-80 transition-opacity"
              >
                Sort
              </button>
              <button
                onClick={() => setShowFilter(!showFilter)}
                className="text_orange text-sm font-medium hover:opacity-80 transition-opacity"
              >
                Filter
              </button>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-500">
            {loading ? "0" : globalUserCount.toLocaleString()}
          </p>
        </div>

        {/* Filter Options (if needed) */}
        {showFilter && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text_gray">
              Filter options can be added here
            </p>
          </div>
        )}

        {/* Countries List */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-8 text_gray">Loading...</div>
          ) : filteredAndSortedCountries.length === 0 ? (
            <div className="text-center py-8 text_gray">
              {searchQuery ? "No countries found" : "No country data available"}
            </div>
          ) : (
            filteredAndSortedCountries.map((country, index) => {
              // Get flag from location options (like LocationBadge)
              const location = locations.find(loc => 
                loc.country?.toLowerCase() === country.country?.toLowerCase() || 
                loc.name?.toLowerCase() === country.country?.toLowerCase()
              );
              const flag = location?.flag || "";
              
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{flag}</span>
                    <span className="text-base font-medium text_black">
                      {country.country}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-medium text_black">
                      {country.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}

