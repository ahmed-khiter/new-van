import { randomBytes } from "crypto";
import { formatDistanceToNow as dateFnsFormatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { FaBroom, FaKey, FaLock, FaShoppingBag, FaStore, FaSuitcase, FaTrash, FaTruck, FaTruckPickup, FaUtensils } from "react-icons/fa";
import { MdDryCleaning } from "react-icons/md";

// Locale: no "about", singular "1 hour" / "1 minute" etc.
const localeNoAbout = {
  ...enUS,
  formatDistance: (token, count, options) => {
    const result = enUS.formatDistance(token, count, options);
    return result
      .replace(/^about /i, "")
      .replace(/\b1 hours\b/, "1 hour")
      .replace(/\b1 minutes\b/, "1 minute")
      .replace(/\b1 seconds\b/, "1 second")
      .replace(/\b1 days\b/, "1 day")
      .replace(/\b1 months\b/, "1 month")
      .replace(/\b1 years\b/, "1 year")
      .replace(/\b1 weeks\b/, "1 week");
  },
};

/**
 * Format a date as relative time (e.g. "2 hours ago"). No "about", singular for 1 unit.
 * @param {Date|string|number} date
 * @param {{ addSuffix?: boolean }} [options]
 * @returns {string}
 */
export const formatDistanceToNow = (date, options = { addSuffix: true }) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return "";
  return dateFnsFormatDistanceToNow(dateObj, { ...options, locale: localeNoAbout });
};


// Get participant profile image based on user role
export const getParticipantProfileImage = (participants, currentUserRole, currentUserId) => {
    if (!participants || participants.length === 0) return null;
    
    // For visitor/admin: show provider image
    if (currentUserRole === "visitor" || currentUserRole === "admin") {
        const provider = participants.find(p => p.user.role === "provider");
        return provider?.user || null;
    }
    
    // For provider: show visitor image if exists, otherwise admin
    if (currentUserRole === "provider") {
        const visitor = participants.find(p => p.user.role === "visitor");
        if (visitor) return visitor.user;
        
        const admin = participants.find(p => p.user.role === "admin");      
        return admin?.user || null;
    }
    return null;
};

// Format date to readable format (e.g., "Oct 23, 2025, 10:30 PM")
export const formatCompletionDate = (date) => {
    if (!date) return null;
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    
    return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

/**
 * Returns job date badge info if createdAt is today or tomorrow (date-only comparison).
 * @param {string|Date} createdAt - Job created date
 * @returns {null|{ type: 'today'|'tomorrow', label: string }} - Badge config or null
 */
export const getJobDateBadge = (createdAt) => {
    if (!createdAt) return null;
    const jobDate = new Date(createdAt);
    if (isNaN(jobDate.getTime())) return null;
    const today = new Date();
    const jobDateOnly = new Date(jobDate.getFullYear(), jobDate.getMonth(), jobDate.getDate());
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    if (jobDateOnly.getTime() === todayDateOnly.getTime()) return { type: 'today', label: 'Today' };
    if (jobDateOnly.getTime() === tomorrowDateOnly.getTime()) return { type: 'tomorrow', label: 'Tomorrow' };
    return null;
};

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Validate input parameters
    if (!lat1 || !lon1 || !lat2 || !lon2 || 
        isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
        return null;
    }

    // Convert to numbers to ensure we're working with numeric values
    lat1 = parseFloat(lat1);
    lon1 = parseFloat(lon1);
    lat2 = parseFloat(lat2);
    lon2 = parseFloat(lon2);

    // Validate latitude and longitude ranges
    if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90 ||
        lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
        return null;
    }

    const R = 3959; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in miles
    return parseFloat(distance.toFixed(1)); 
};

export const getLocationOptions = (id) => {
  const locations = [
      {
        id: 'uk',
        name: 'United Kingdom',
        flag: '🇬🇧',
        code: 'GB',
        cities: ['London', 'Manchester', 'Birmingham'],
        address: 'London, United Kingdom',
        country: 'United Kingdom',
        lat: 51.5074,
        lng: -0.1278
      },
      {
        id: 'us',
        name: 'United States',
        flag: '🇺🇸',
        code: 'US',
        cities: ['Miami'],
        address: 'Miami, United States',
        country: 'United States',
        lat: 25.7617,
        lng: -80.1918
      },
      {
        id: 'sa',
        name: 'Saudi Arabia', 
        flag: '🇸🇦',
        code: 'SA',
        cities: ['Riyadh', 'Jeddah', 'Dammam'],
        address: 'Riyadh, Saudi Arabia',
        country: 'Saudi Arabia',
        lat: 24.7136,
        lng: 46.6753
      },
      {
        id: 'ae',
        name: 'United Arab Emirates',
        flag: '🇦🇪',
        code: 'AE',
        cities: ['Dubai', 'Abu Dhabi', 'Sharjah'],
        address: 'Dubai, United Arab Emirates',
        country: 'United Arab Emirates',
        lat: 25.2048,
        lng: 55.2708
      },
      {
        id: 'eg',
        name: 'Egypt',
        flag: '🇪🇬',
        code: 'EG',
        cities: ['Cairo', 'Alexandria', 'Giza'],
        address: 'Cairo, Egypt',
        country: 'Egypt',
        lat: 30.0444,
        lng: 31.2357
      },
      {
        id: 'cy',
        name: 'Cyprus',
        flag: '🇨🇾',
        code: 'CY',
        cities: ['Nicosia', 'Limassol', 'Larnaca'],
        address: 'Nicosia, Cyprus',
        country: 'Cyprus',
        lat: 35.1856,
        lng: 33.3823
      },
      {
        id: 'ma',
        name: 'Morocco',
        flag: '🇲🇦',
        code: 'MA',
        cities: ['Casablanca', 'Rabat', 'Marrakech', 'Fes'],
        address: 'Casablanca, Morocco',
        country: 'Morocco',
        lat: 33.5731,
        lng: -7.5898
      },
      {
        id: 'au',
        name: 'Australia',
        flag: '🇦🇺',
        code: 'AU',
        cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth'],
        address: 'Sydney, Australia',
        country: 'Australia',
        lat: -33.8688,
        lng: 151.2093
      }
  ]
  return id ? locations.find(location => location.id === id) : locations;
};

// Helper function to get cities for a location
export const getCitiesForLocation = (locationId) => {
  const location = getLocationOptions(locationId);
  return location ? location.cities : [];
};

export const getLocationFromStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('selectedLocation');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const updateLocation = (location, callback) => {
  if (location) {
    localStorage.setItem('selectedLocation', JSON.stringify(location));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('locationChanged'));
    }
  }
  callback?.(location);
};

// Get all countries in the world
export const getAllCountries = () => {
  return [
    { name: 'Afghanistan', code: 'AF' },
    { name: 'Albania', code: 'AL' },
    { name: 'Algeria', code: 'DZ' },
    { name: 'Andorra', code: 'AD' },
    { name: 'Angola', code: 'AO' },
    { name: 'Antigua and Barbuda', code: 'AG' },
    { name: 'Argentina', code: 'AR' },
    { name: 'Armenia', code: 'AM' },
    { name: 'Australia', code: 'AU' },
    { name: 'Austria', code: 'AT' },
    { name: 'Azerbaijan', code: 'AZ' },
    { name: 'Bahamas', code: 'BS' },
    { name: 'Bahrain', code: 'BH' },
    { name: 'Bangladesh', code: 'BD' },
    { name: 'Barbados', code: 'BB' },
    { name: 'Belarus', code: 'BY' },
    { name: 'Belgium', code: 'BE' },
    { name: 'Belize', code: 'BZ' },
    { name: 'Benin', code: 'BJ' },
    { name: 'Bhutan', code: 'BT' },
    { name: 'Bolivia', code: 'BO' },
    { name: 'Bosnia and Herzegovina', code: 'BA' },
    { name: 'Botswana', code: 'BW' },
    { name: 'Brazil', code: 'BR' },
    { name: 'Brunei', code: 'BN' },
    { name: 'Bulgaria', code: 'BG' },
    { name: 'Burkina Faso', code: 'BF' },
    { name: 'Burundi', code: 'BI' },
    { name: 'Cabo Verde', code: 'CV' },
    { name: 'Cambodia', code: 'KH' },
    { name: 'Cameroon', code: 'CM' },
    { name: 'Canada', code: 'CA' },
    { name: 'Central African Republic', code: 'CF' },
    { name: 'Chad', code: 'TD' },
    { name: 'Chile', code: 'CL' },
    { name: 'China', code: 'CN' },
    { name: 'Colombia', code: 'CO' },
    { name: 'Comoros', code: 'KM' },
    { name: 'Congo', code: 'CG' },
    { name: 'Costa Rica', code: 'CR' },
    { name: 'Croatia', code: 'HR' },
    { name: 'Cuba', code: 'CU' },
    { name: 'Cyprus', code: 'CY' },
    { name: 'Czech Republic', code: 'CZ' },
    { name: 'Denmark', code: 'DK' },
    { name: 'Djibouti', code: 'DJ' },
    { name: 'Dominica', code: 'DM' },
    { name: 'Dominican Republic', code: 'DO' },
    { name: 'Ecuador', code: 'EC' },
    { name: 'Egypt', code: 'EG' },
    { name: 'El Salvador', code: 'SV' },
    { name: 'Equatorial Guinea', code: 'GQ' },
    { name: 'Eritrea', code: 'ER' },
    { name: 'Estonia', code: 'EE' },
    { name: 'Eswatini', code: 'SZ' },
    { name: 'Ethiopia', code: 'ET' },
    { name: 'Fiji', code: 'FJ' },
    { name: 'Finland', code: 'FI' },
    { name: 'France', code: 'FR' },
    { name: 'Gabon', code: 'GA' },
    { name: 'Gambia', code: 'GM' },
    { name: 'Georgia', code: 'GE' },
    { name: 'Germany', code: 'DE' },
    { name: 'Ghana', code: 'GH' },
    { name: 'Greece', code: 'GR' },
    { name: 'Grenada', code: 'GD' },
    { name: 'Guatemala', code: 'GT' },
    { name: 'Guinea', code: 'GN' },
    { name: 'Guinea-Bissau', code: 'GW' },
    { name: 'Guyana', code: 'GY' },
    { name: 'Haiti', code: 'HT' },
    { name: 'Honduras', code: 'HN' },
    { name: 'Hungary', code: 'HU' },
    { name: 'Iceland', code: 'IS' },
    { name: 'India', code: 'IN' },
    { name: 'Indonesia', code: 'ID' },
    { name: 'Iran', code: 'IR' },
    { name: 'Iraq', code: 'IQ' },
    { name: 'Ireland', code: 'IE' },
    { name: 'Israel', code: 'IL' },
    { name: 'Italy', code: 'IT' },
    { name: 'Jamaica', code: 'JM' },
    { name: 'Japan', code: 'JP' },
    { name: 'Jordan', code: 'JO' },
    { name: 'Kazakhstan', code: 'KZ' },
    { name: 'Kenya', code: 'KE' },
    { name: 'Kiribati', code: 'KI' },
    { name: 'Kosovo', code: 'XK' },
    { name: 'Kuwait', code: 'KW' },
    { name: 'Kyrgyzstan', code: 'KG' },
    { name: 'Laos', code: 'LA' },
    { name: 'Latvia', code: 'LV' },
    { name: 'Lebanon', code: 'LB' },
    { name: 'Lesotho', code: 'LS' },
    { name: 'Liberia', code: 'LR' },
    { name: 'Libya', code: 'LY' },
    { name: 'Liechtenstein', code: 'LI' },
    { name: 'Lithuania', code: 'LT' },
    { name: 'Luxembourg', code: 'LU' },
    { name: 'Madagascar', code: 'MG' },
    { name: 'Malawi', code: 'MW' },
    { name: 'Malaysia', code: 'MY' },
    { name: 'Maldives', code: 'MV' },
    { name: 'Mali', code: 'ML' },
    { name: 'Malta', code: 'MT' },
    { name: 'Marshall Islands', code: 'MH' },
    { name: 'Mauritania', code: 'MR' },
    { name: 'Mauritius', code: 'MU' },
    { name: 'Mexico', code: 'MX' },
    { name: 'Micronesia', code: 'FM' },
    { name: 'Moldova', code: 'MD' },
    { name: 'Monaco', code: 'MC' },
    { name: 'Mongolia', code: 'MN' },
    { name: 'Montenegro', code: 'ME' },
    { name: 'Morocco', code: 'MA' },
    { name: 'Mozambique', code: 'MZ' },
    { name: 'Myanmar', code: 'MM' },
    { name: 'Namibia', code: 'NA' },
    { name: 'Nauru', code: 'NR' },
    { name: 'Nepal', code: 'NP' },
    { name: 'Netherlands', code: 'NL' },
    { name: 'New Zealand', code: 'NZ' },
    { name: 'Nicaragua', code: 'NI' },
    { name: 'Niger', code: 'NE' },
    { name: 'Nigeria', code: 'NG' },
    { name: 'North Korea', code: 'KP' },
    { name: 'North Macedonia', code: 'MK' },
    { name: 'Norway', code: 'NO' },
    { name: 'Oman', code: 'OM' },
    { name: 'Pakistan', code: 'PK' },
    { name: 'Palau', code: 'PW' },
    { name: 'Palestine', code: 'PS' },
    { name: 'Panama', code: 'PA' },
    { name: 'Papua New Guinea', code: 'PG' },
    { name: 'Paraguay', code: 'PY' },
    { name: 'Peru', code: 'PE' },
    { name: 'Philippines', code: 'PH' },
    { name: 'Poland', code: 'PL' },
    { name: 'Portugal', code: 'PT' },
    { name: 'Qatar', code: 'QA' },
    { name: 'Romania', code: 'RO' },
    { name: 'Russia', code: 'RU' },
    { name: 'Rwanda', code: 'RW' },
    { name: 'Saint Kitts and Nevis', code: 'KN' },
    { name: 'Saint Lucia', code: 'LC' },
    { name: 'Saint Vincent and the Grenadines', code: 'VC' },
    { name: 'Samoa', code: 'WS' },
    { name: 'San Marino', code: 'SM' },
    { name: 'Sao Tome and Principe', code: 'ST' },
    { name: 'Saudi Arabia', code: 'SA' },
    { name: 'Senegal', code: 'SN' },
    { name: 'Serbia', code: 'RS' },
    { name: 'Seychelles', code: 'SC' },
    { name: 'Sierra Leone', code: 'SL' },
    { name: 'Singapore', code: 'SG' },
    { name: 'Slovakia', code: 'SK' },
    { name: 'Slovenia', code: 'SI' },
    { name: 'Solomon Islands', code: 'SB' },
    { name: 'Somalia', code: 'SO' },
    { name: 'South Africa', code: 'ZA' },
    { name: 'South Korea', code: 'KR' },
    { name: 'South Sudan', code: 'SS' },
    { name: 'Spain', code: 'ES' },
    { name: 'Sri Lanka', code: 'LK' },
    { name: 'Sudan', code: 'SD' },
    { name: 'Suriname', code: 'SR' },
    { name: 'Sweden', code: 'SE' },
    { name: 'Switzerland', code: 'CH' },
    { name: 'Syria', code: 'SY' },
    { name: 'Taiwan', code: 'TW' },
    { name: 'Tajikistan', code: 'TJ' },
    { name: 'Tanzania', code: 'TZ' },
    { name: 'Thailand', code: 'TH' },
    { name: 'Timor-Leste', code: 'TL' },
    { name: 'Togo', code: 'TG' },
    { name: 'Tonga', code: 'TO' },
    { name: 'Trinidad and Tobago', code: 'TT' },
    { name: 'Tunisia', code: 'TN' },
    { name: 'Turkey', code: 'TR' },
    { name: 'Turkmenistan', code: 'TM' },
    { name: 'Tuvalu', code: 'TV' },
    { name: 'Uganda', code: 'UG' },
    { name: 'Ukraine', code: 'UA' },
    { name: 'United Arab Emirates', code: 'AE' },
    { name: 'United Kingdom', code: 'GB' },
    { name: 'United States', code: 'US' },
    { name: 'Uruguay', code: 'UY' },
    { name: 'Uzbekistan', code: 'UZ' },
    { name: 'Vanuatu', code: 'VU' },
    { name: 'Vatican City', code: 'VA' },
    { name: 'Venezuela', code: 'VE' },
    { name: 'Vietnam', code: 'VN' },
    { name: 'Yemen', code: 'YE' },
    { name: 'Zambia', code: 'ZM' },
    { name: 'Zimbabwe', code: 'ZW' }
  ];
};

// Check if a country supports business accounts (provider, shop-owner, restaurant)
export const isBusinessAccountSupported = (countryName) => {
  const supportedCountries = ['United Kingdom', 'Saudi Arabia', 'United Arab Emirates', 'Egypt', 'Cyprus', 'United States'];
  return supportedCountries.includes(countryName);
};

export const getBoundingBox = (lat, lng, radiusMiles) => {
  const R = 3959; // Earth radius in miles
  const latRad = (lat * Math.PI) / 180;
  const deltaLat = (radiusMiles / R) * (180 / Math.PI);
  const deltaLng = (radiusMiles / (R * Math.cos(latRad))) * (180 / Math.PI);

  return {
    minLat: lat - deltaLat,
    maxLat: lat + deltaLat,
    minLng: lng - deltaLng,
    maxLng: lng + deltaLng,
  };
};

export const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
export const getNameInitials = (name) => {
  const [firstName, lastName] =
    typeof name === "string" ? name.split(" ") : ["", ""];
  const initials =
    typeof name === "string"
      ? `${firstName.charAt(0).toUpperCase()}${lastName ? lastName.charAt(0).toUpperCase() : ""
      }`
      : "";
  return initials
}
export const getFormattedName = (name) => {
  if (!name) {
    return null;
  }
  const [firstName, lastName] = name?.split(" ");
  const lastNameInitial = lastName ? `${lastName[0]}.` : "";
  return `${firstName} ${lastNameInitial}`;
};

/**
 * Truncates a UUID or ID string to a maximum of 8 characters, excluding dashes
 * @param {string} id - The ID string to truncate (e.g., "b6233dfe-eb33-4c6f-bab6-1fcf86b20250")
 * @param {number} maxLength - Maximum length of the truncated ID (default: 8)
 * @returns {string} - Truncated ID (e.g., "b6233dfe")
 */
export const truncateId = (id, maxLength = 8) => {
  if (!id || typeof id !== 'string') {
    return '';
  }
  
  // Remove all dashes and take the first maxLength characters
  const cleanId = id.replace(/-/g, '');
  return cleanId.substring(0, maxLength);
};

export const truncateFileName = (fileName, maxLength = 15) => {
  if (!fileName) return "";
  
  const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
  const extension = fileName.substring(fileName.lastIndexOf('.'));
  
  if (fileName.length <= maxLength) {
    return fileName;
  }
  
  const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 3) + '...';
  return truncatedName + extension;
};
export function generateRandomToken(size = 32) {
  return randomBytes(size).toString("hex");
}

export const formatAmountToCurrency = (amount, currency = "GBP") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

// Currency mapping based on location
export const getCurrencyByLocation = (location) => {
  if (!location) return "GBP"; // Default to GBP
  
  switch (location.code) {
    case 'SA': // Saudi Arabia
      return "SAR";
    case 'GB': // United Kingdom
      return "GBP";
    case 'AE': // United Arab Emirates
      return "AED";
    case 'EG': // Egypt
      return "EGP";
    case 'CY': // Cyprus
      return "EUR";
    case 'US': // United States
      return "USD";
    default:
      return "GBP";
  }
};

// Get available currencies based on location
export const getAvailableCurrencies = (location) => {
  if (!location) return [
    { value: "GBP", label: "GBP (£)" },
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (€)" },
  ];
  
  const baseCurrency = getCurrencyByLocation(location);
  const currencies = [
    { value: baseCurrency, label: `${baseCurrency} (${getCurrencySymbol(baseCurrency)})` },
  ];
  
  // Add other currencies as alternatives
  if (baseCurrency !== "GBP") currencies.push({ value: "GBP", label: "GBP (£)" });
  if (baseCurrency !== "USD") currencies.push({ value: "USD", label: "USD ($)" });
  if (baseCurrency !== "EUR") currencies.push({ value: "EUR", label: "EUR (€)" });
  if (baseCurrency !== "SAR") currencies.push({ value: "SAR", label: "SAR (ر.س)" });
  if (baseCurrency !== "AED") currencies.push({ value: "AED", label: "AED (د.إ)" });
  if (baseCurrency !== "EGP") currencies.push({ value: "EGP", label: "EGP (ج.م)" });
  
  return currencies;
};

// Get currency symbol
export const getCurrencySymbol = (currency) => {
  const symbols = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    SAR: "ر.س",
    AED: "د.إ",
    EGP: "ج.م",
  };
  return symbols[currency] || "£";
};

// Exchange rates (base: USD)
export const getExchangeRates = () => ({
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  SAR: 3.75, // Saudi Riyal
  AED: 3.67, // UAE Dirham
  EGP: 30.90, // Egyptian Pound
});

// Convert price between currencies
export const convertPrice = (price, fromCurrency = "USD", toCurrency = "GBP") => {
  const rates = getExchangeRates();
  const basePrice = price / rates[fromCurrency];
  return basePrice * rates[toCurrency];
};

export function formatAmountToDecimal(amount) {
  return parseFloat(amount).toFixed(2);
}

export const getUserFullName = (firstName, lastName) => {
  const fullName = `${firstName || ""} ${lastName || ""}`.trim();
  return fullName
}

// Simple status badge component with inline Tailwind classes
export const getStatusBadge = (status, isProvider) => {
  const statusKey = status?.toLowerCase();
  
  // Use inline Tailwind classes based on status
  const getStatusClasses = (status) => {
    switch (status) {
      case "pending":
      case "open":
        return "bg-yellow-500 text-white";
      case "active":
        return "bg-black text-white";
      case "completed":
        return "bg-blue-500 text-white";
      case "cancelled":
        return "bg-red-500 text-white";
      case "draft":
        return "bg-orange-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };
  
  // Show "Searching" for active status, "Ongoing" for open status, "Pending" for pending status
  const displayText = statusKey === "active" 
    ? (isProvider ? status : "searching") 
    : statusKey === "open" 
    ? "Ongoing" 
    : statusKey === "pending"
    ? "pending"
    : status;
  
  return (
    <span className={`badge badge-custom-sm ${getStatusClasses(statusKey)} capitalize p-2  text-[16px] text-center `}>
      {displayText}
    </span>
  );
};



export const fullDateFormate = (date) => {
  const parsedDate = new Date(date);
  if (isNaN(parsedDate)) {
    return "Invalid Date";
  }
  return parsedDate.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export const getTime = (timestamp, t = null) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";

  hours = hours % 12 || 12; // convert 0 → 12 for 12-hour format

  const timeString = minutes === "00" ? `${hours}${ampm}` : `${hours}.${minutes}${ampm}`;

  // Check if it's today or tomorrow
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (targetDate.getTime() === today.getTime()) {
    return t ? `${t("today")} ${timeString}` : `Today ${timeString}`;
  } else if (targetDate.getTime() === tomorrow.getTime()) {
    return t ? `${t("tomorrow")} ${timeString}` : `Tomorrow ${timeString}`;
  }
  
  return timeString;
};

export const getRequiredDocumentByCategory = (category) => {
  switch (category) {
    case "Van":
      return ["Signed Delivery Note", "Photo of Goods Offloaded"];
    case "Recovery":
      return ["Signed Delivery Note", "Photo of Vehicle Offloaded"];
    case "Removals":
      return ["Photo of Goods Loaded"];
    case "Cleaning":
      return [];
    case "Locksmith":
      return ["Photo of Installed Lock"];
    case "Car Key Replacement":
      return [];
    case "Click & Collect":
      return ["Photo of Collected Item", "Customer Signature on Collection"];
    default:
      return [];
  }
};

export const typeOfKeyOptions = [
  { value: "Standard", label: "Standard" },
  { value: "Security", label: "Security" },
  { value: "Not Sure", label: "Not Sure" },
];

export const typeOfLockOptions = [
  { value: "Dead Lock", label: "Dead Lock" },
  { value: "Night Latch", label: "Night Latch" },
  { value: "Electronic", label: "Electronic" },
  { value: "Not Sure", label: "Not Sure" },
];

export const howManyItemsOptions = [
  { value: 1, label: "1 Item" },
  { value: 2, label: "2 Items" },
  { value: 3, label: "3 Items" },
  { value: 4, label: "4 Items" },
  { value: 5, label: "5 Items" },
  { value: 6, label: "6 Items" },
  { value: 7, label: "7 Items" },
  { value: 8, label: "8 Items" },
  { value: 9, label: "9 Items" },
  { value: 10, label: "10 Items" },
]

export const typeOfPlaceOptions = [
  { value: "Commercial", label: "Commercial" },
  { value: "Residential", label: "Residential" },
]

export const howManyHoursOptions = [
  { value: 1, label: "1 Hour" },
  { value: 2, label: "2 Hours" },
  { value: 3, label: "3 Hours" },
  { value: 4, label: "4 Hours" },
  { value: 5, label: "5 Hours" },
  { value: 6, label: "6 Hours" },
  { value: 7, label: "7 Hours" },
  { value: 8, label: "8 Hours" },
  { value: 9, label: "9 Hours" },
  { value: 10, label: "10 Hours" },
]
export const howManyRoomsOptions = [
  { value: 1, label: "1 Room" },
  { value: 2, label: "2 Rooms" },
  { value: 3, label: "3 Rooms" },
  { value: 4, label: "4 Rooms" },
  { value: 5, label: "5 Rooms" },
  { value: 6, label: "6 Rooms" },
  { value: 7, label: "7 Rooms" },
  { value: 8, label: "8 Rooms" },
  { value: 9, label: "9 Rooms" },
  { value: 10, label: "10 Rooms" },
]

export const howManyBathroomsOptions = [
  { value: 1, label: "1 Bathroom" },
  { value: 2, label: "2 Bathrooms" },
  { value: 3, label: "3 Bathrooms" },
  { value: 4, label: "4 Bathrooms" },
  { value: 5, label: "5 Bathrooms" },
  { value: 6, label: "6 Bathrooms" },
  { value: 7, label: "7 Bathrooms" },
  { value: 8, label: "8 Bathrooms" },
  { value: 9, label: "9 Bathrooms" },
  { value: 10, label: "10 Bathrooms" },
]

export function calculateTravelTime(distance) {
  const averageSpeed = 12;
  const time = distance / averageSpeed;
  const timeInMinutes = time * 60;
  const hours = Math.floor(timeInMinutes / 60);
  const minutes = Math.floor(timeInMinutes % 60);

  return `Estimated ${hours}h and ${minutes} min`;
}

/**
 * Calculate delivery time in minutes based on distance
 * @param {number} distanceMiles - Distance in miles
 * @param {number} averageSpeedMph - Average speed in mph (default: 12 for bike delivery)
 * @param {number} preparationTimeMinutes - Additional preparation time in minutes (default: 25 for food/order preparation)
 * @returns {number} - Estimated time in minutes (rounded)
 */
export const calculateDeliveryTimeMinutes = (distanceMiles, averageSpeedMph = 12, preparationTimeMinutes = 25) => {
  if (!distanceMiles || distanceMiles <= 0) {
    return preparationTimeMinutes;
  }
  const timeInHours = distanceMiles / averageSpeedMph;
  const travelTimeInMinutes = Math.round(timeInHours * 60);
  return travelTimeInMinutes + preparationTimeMinutes;
};

export const checkDropOffDate = (timestamp) => {
  if (!timestamp) return "";

  if (timestamp === "ASAP") return "ASAP";

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  const now = new Date();
  const nowDay = now.getDate().toString().padStart(2, "0");
  const nowMonth = (now.getMonth() + 1).toString().padStart(2, "0");
  const nowYear = now.getFullYear();

  if (day === nowDay && month === nowMonth && year === nowYear) {
    return "Today";
  } else {
    return `${day}/${month}/${year}`;
  }
};

export const CategoryIcon = ({ category, ...props }) => {
  const categoryObj = jobCategories?.find(c => c.value === category);
  let IconComponent = categoryObj?.icon;
  if (!IconComponent){
    IconComponent = getServiceIcon(category)
  }
  if(!IconComponent) return null

  return <IconComponent {...props} />;
};

export const services = [
  {
    id: "shop",
    name: "Retail Stores",
    description:
      "Grab what you want, when you want it. From everyday essentials to last-minute gifts, we bring the shop to your door",
    images: {
      background: "/assets/img/slider/slider_10.jpg",
      slider: "/assets/img/slider/slider_10.jpg",
      list_service_img: "/assets/img/categories/shop-poster.jpg",
      preview_video: "/assets/video/shop-preview.mp4",
      preview_poster: "/assets/img/categories/shop-poster.jpg",
    },
  },
  {
    id: "restaurant",
    name: "Restaurants",
    description:
      "Get your favourite meals delivered straight to you with ease. Browse restaurants, explore new flavours, and place your order in just a few taps",
    images: {
      background: "/assets/img/slider/slider_9.jpg",
      slider: "/assets/img/slider/slider_9.jpg",
      list_service_img: "/assets/img/categories/restaurant-poster.jpg",
      preview_video: "/assets/video/restaurant-preview.mp4",
      preview_poster: "/assets/img/categories/restaurant-poster.jpg",
    },
  },
  {
    id: "supermarket",
    name: "Supermarkets",
    description:
      "Shop for groceries and everyday essentials from your favorite supermarkets. Fast delivery straight to your door",
    images: {
      background: "/assets/img/slider/slider_11.jpg",
      slider: "/assets/img/slider/slider_11.jpg",
      list_service_img: "/assets/img/categories/supermarket-poster.jpg",
      preview_video: "/assets/video/supermarket-preview.mp4",
      preview_poster: "/assets/img/categories/supermarket-poster.jpg",
    },
  },
  {
    id: "Taxi Rides",
    name: "Taxi Rides",
    description:
      "Book your ride with Taxi Rides. Coming soon - convenient, reliable transportation at your fingertips.",
    basePrice: 0,
    images: {
      background: "/assets/img/slider/slider_13.jpg",
      slider: "/assets/img/slider/slider_13.jpg",
      list_service_img: "/assets/img/categories/rides-poster.jpg",
      preview_video: "/assets/video/rides-preview.mp4",
      preview_poster: "/assets/img/categories/rides-poster.jpg",
    },
  },
  {
    id: "Book a Table",
    name: "Restaurant booking",
    description:
      "You can now book a table at your favorite restaurant directly on Swipped. No calls, no queues — just tap, reserve, and enjoy.",
    basePrice: 25,
    images: {
      background: "/assets/img/slider/restaurant.jpg",
      slider: "/assets/img/slider/slider_12.jpg",
      list_service_img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: "MOT & Repairs",
    name: "MOT &  Repairs",
    description:
      "Book trusted MOT tests and car servicing with certified professionals to keep your vehicle road ready.",
    basePrice: 0,
    images: {
      background: "/assets/img/slider/restaurant.jpg",
      slider: "/assets/img/slider/slider_14.jpeg",
      list_service_img: "https://images.unsplash.com/photo-1625047509248-ec889cbff17f?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: "Shisha lounges",
    name: "Shisha lounges",
    description:
      "Reserve your spot at the best Shisha lounges. Book your table and enjoy a relaxing evening with friends.",
    basePrice: 0,
    images: {
      background: "/assets/img/slider/restaurant.jpg",
      slider: "/assets/img/slider/slider_15.jpeg",
      list_service_img: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: "Spa",
    name: "Spa treatments ",
    description:
      "Book your spa appointment and treat yourself to a day of relaxation and rejuvenation.",
    basePrice: 0,
    images: {
      background: "/assets/img/slider/restaurant.jpg",
      slider: "/assets/img/slider/slider_16.jpeg",
      list_service_img: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: "Beauty",
    name: "Beauty appointments",
    description:
      "Book your beauty appointment at top salons. From haircuts to treatments, reserve your slot today.",
    basePrice: 0,
    images: {
      background: "/assets/img/slider/restaurant.jpg",
      slider: "/assets/img/slider/slider_17.jpeg",
      list_service_img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: "Healthcare",
    name: "Healthcare appointments",
    description:
      "Book your healthcare appointment with trusted providers. Dentist, clinic, IV drip, and more health services.",
    basePrice: 0,
    images: {
      background: "/assets/img/slider/restaurant.jpg",
      slider: "/assets/img/slider/slider_18.jpeg",
      list_service_img: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: "Events",
    name: "Events services",
    description:
      "Book professional event services. DJ hire, live music, character appearances, and more for your special events.",
    basePrice: 0,
    images: {
      background: "/assets/img/slider/restaurant.jpg",
      slider: "/assets/img/slider/slider_19.jpeg",
      list_service_img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: "Entertainment",
    name: "Entertainment venues",
    description:
      "Book exciting entertainment experiences. VR experiences, bowling, karaoke rooms, and unforgettable fun.",
    basePrice: 0,
    images: {
      background: "/assets/img/slider/restaurant.jpg",
      slider: "/assets/img/slider/slider_20.jpeg",
      list_service_img: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: "Luggage Storage",
    name: "Luggage Storage",
    description:
      "Travel light and stress-free. Store your bags with us for a few hours, a few days, or even a few weeks—whatever suits your plans.",
    basePrice: 25,
    images: {
      background: "/assets/img/slider/luggage.jpg",
      slider: "/assets/img/slider/luggage.jpg",
      list_service_img: "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: "Dry Cleaning Pick-Up",
    name: "Dry Cleaning Pick-Up",
    description:
      "Enjoy perfectly cleaned clothes without leaving your home. We collect your garments straight from your doorstep, get them professionally dry cleaned, and deliver them back fresh",
    basePrice: 25,
    images: {
      background: "/assets/img/slider/cleaning.jpg",
      slider: "/assets/img/slider/cleaning.jpg",
      list_service_img: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?auto=format&fit=crop&w=600&q=80",
    },
  },

  {
    id: "Recovery",
    name: "Breakdown Assistance",
    description:
      "Stranded on the road? Our dedicated recovery team is just one tap away. No matter where you are, our nationwide network operates 24/7, providing fast, safe, and reliable assistance.",
    basePrice: 400,
    images: {
      background: "/assets/img/slider/slider_2.jpg",
      slider: "/assets/img/slider/slider_2.jpg",
      list_service_img: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: "Cleaning",
    name: "Professional Cleaning",
    description:
      "From homes to commercial spaces to Airbnb properties — weve got you covered. Urgent call-out or a scheduled appointment, our professionals are ready to help.",
    basePrice: 200,
    images: {
      background: "/assets/img/slider/slider_4.jpg",
      slider: "/assets/img/slider/slider_4.jpg",
      list_service_img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: "Locksmith",
    name: "Lock & Key Replacement",
    description:
      "If you’re locked out or have lost your keys, our locksmiths will come directly to you. We operate nationwide and offer 24/7 assistance.",
    basePrice: 450,
    images: {
      background: "/assets/img/slider/slider_6.jpg",
      slider: "/assets/img/slider/slider_6.jpg",
      list_service_img: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: "Car Key Replacement",
    name: "Mobile car key replacement",
    description:
      "Lost your car key? We will replace it wherever you are. Our specialist technicians come directly to your location, cutting and programming your new key on the spot so you can get back on the road without any hassle.",
    basePrice: 300,
    images: {
      background: "/assets/img/slider/slider_8.jpg",
      slider: "/assets/img/slider/slider_8.jpg",
      list_service_img: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: "Removals",
    name: "Rubbish Removals",
    description:
      "Need rubbish gone today? We can help anytime. Our fast, reliable removal teams are available on-demand to clear unwanted items from your home, business, or garden. From single items to full load removals",
    basePrice: 300,
    images: {
      background: "/assets/img/slider/slider_7.jpg",
      slider: "/assets/img/slider/slider_7.jpg",
      list_service_img: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: "Click & Collect",
    name: "Click & Collect Delivery",
    description:
      "Nationwide collection from any store, delivered straight to your home. With Swipped, everything becomes accessible and effortless.",
    basePrice: 100,
    images: {
      background: "/assets/img/slider/slider_5.jpg",
      slider: "/assets/img/slider/slider_5.jpg",
      list_service_img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80",
    },
  },
  {
    id: "Van",
    name: "Deliveries & Couriers",
    description:
      "Send it fast — send it with Swipped. From small parcels to furniture and pallets, we handle it all with a nationwide fleet ready to assist you instantly.",
    basePrice: 350,
    images: {
      background: "/assets/img/slider/slider_1.jpg",
      slider: "/assets/img/slider/slider_1.jpg",
      list_service_img: "https://images.unsplash.com/photo-1616432043562-3671ea2e5242?auto=format&fit=crop&w=600&q=80",
    },
  },
];

// Generate jobCategories from services array
export const jobCategories = services
.filter(service => service.id !== "Order Food" && service.id !== "Shop Now – Fast Delivery on Everything You Need" && service.id !== "Luggage Storage" && service.id !== "Dry Cleaning Pick-Up" && service.id !== "shop" && service.id !== "restaurant" && service.id !== "supermarket" && service.id !== "Book a Table" && service.id !== "Taxi Rides" && service.id !== "MOT & Repairs" && service.id !== "Shisha lounges" && service.id !== "Spa" && service.id !== "Beauty" && service.id !== "Healthcare" && service.id !== "Events" && service.id !== "Entertainment" )
.map(service => ({
    value: service.id,
    label: service.name,
    icon: getServiceIcon(service.id)
  }));

// Helper function to get icon for service
function getServiceIcon(serviceId) {
  const iconMap = {
    "Click & Collect": FaShoppingBag,
    "Van": FaTruck,
    "Recovery": FaTruckPickup,
    "Cleaning": FaBroom,
    "Locksmith": FaLock,
    "Car Key Replacement": FaKey,
    "Removals": FaTrash,
    "Dry Cleaning Pick-Up": MdDryCleaning,
    "Luggage Storage": FaSuitcase,
    "shop": FaStore,
    "restaurant": FaUtensils,
  };
  return iconMap[serviceId];
}

// Helper function to get service icon image path (for homepage-style icons)
export const getServiceIconPath = (serviceId) => {
  const iconMap = {
    "Click & Collect": "/assets/img/services/shopping.png",
    "Van": "/assets/img/services/van.png",
    "Recovery": "/assets/img/services/recovery.png",
    "Cleaning": "/assets/img/services/cleaning.png",
    "Locksmith": "/assets/img/services/locksmith.png",
    "Car Key Replacement": "/assets/img/services/car_key.png",
    "Removals": "/assets/img/services/removals.png"
  };
  return iconMap[serviceId] || "/assets/img/icon/box.svg";
};

// Helper function to get service name from category value
export const getServiceName = (categoryValue) => {
  if (!categoryValue) return 'Unknown Service';
  
  const service = services.find(s => s.id === categoryValue);
  return service ? service.name : categoryValue;
};

// Helper function to get banner gradient background based on shop type
export const getShopBannerGradient = (shopType) => {
  const gradientMap = {
    'restaurant': 'linear-gradient(135deg, #d44b14 0%, #e75339 50%, #ff6b4a 100%)',
    'spa': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'mot': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'beauty': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'shisha': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'healthcare': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'events': 'linear-gradient(135deg, #fa8bff 0%, #2bd2ff 50%, #2bff88 100%)',
    'entertainment': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
  };
  
  return gradientMap[shopType] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
};

export const serviceVerificationRequirements = {
  Van: [
    "Government-issued ID (Driving License)",
    "Proof of Address (Utility Bill or Bank Statement)",
    "Courier Insurance Certificate",
    "Public Liability Insurance Certificate",
    "Photo of front of van (number plate visible)",
    "Photo of back of van (number plate visible)"
  ],
  Recovery: [
    "Government-issued ID (Driving License)",
    "Proof of Address (Utility Bill or Bank Statement)",
    "Recovery Vehicle Insurance Certificate",
    "Public Liability Insurance Certificate",
    "Photo of front of recovery truck (number plate visible)",
    "Photo of back of recovery truck (number plate visible)"
  ],
  Removals: [
    "Government-issued ID (Passport or Driving License)",
    "Proof of Address (Utility Bill or Bank Statement)"
  ],
  Locksmith: [
    "Government-issued ID (Passport or Driving License)",
    "Proof of Address (Utility Bill or Bank Statement)"
  ],
  Cleaning: [
    "Government-issued ID (Passport or Driving License)",
    "Proof of Address (Utility Bill or Bank Statement)"
  ],
  "Car Key Replacement": [
    "Government-issued ID (Passport or Driving License)",
    "Proof of Address (Utility Bill or Bank Statement)"
  ],
  "Click & Collect": [
    "Government-issued ID (Passport or Driving License)",
    "Proof of Address (Utility Bill or Bank Statement)",
    "Store Registration / Business License",
    "Proof of Business Address"
  ],
};

export const getFullDateFromTime = (date, time) => {
  if (!date || !time) return null;
  if (time === "ASAP") return null;
  const fullDate = new Date(date);
  const [hours, minutes] = time.split(":").map(Number);
  fullDate.setHours(hours, minutes, 0, 0);
  return fullDate.toISOString();
};

// Legacy function - kept for backward compatibility
// Use calculateJobPrice from pricingService.js for new implementations
export const calculatePrice = (serviceId, distance) => {
  const service = services.find(s => s.id === serviceId);
  if (!service) {
    return 0;
  }

  // Services that don't require dropoff (no distance calculation needed)
  const servicesWithoutDropoff = ['Cleaning', 'Locksmith', 'Car Key Replacement', 'Removals'];
  
  if (servicesWithoutDropoff.includes(serviceId)) {
    // For services without dropoff, return base price
    return service.basePrice;
  }

  // For services with dropoff (Van, Recovery, Click & Collect), calculate based on distance
  if (!distance || distance <= 0) {
    return service.basePrice; // Fallback to base price if no distance
  }

  return service.basePrice * distance;
};

export function generateJobTitle(job) {
  let title = "";

  switch (job.category) {
    case "Van":
      title = `Couriers: ${job.movingItem || "N/A"} - Van Size: ${job.vanSize || "N/A"}`;
      break;

    case "Click & Collect":
      title = `Click and collect delivery: ${job.storeName || "N/A"} - ID: ${job.clickAndCollectIdNumber || "N/A"}`;
      break;

    case "Recovery": // Breakdown Assistances
      title = `Recovery: ${job.make || "N/A"} ${job.model || ""}`;
      break;

    case "Cleaning":
      title = `Cleaning: ${job.typeOfPlace || "N/A"} - Rooms: ${job.howManyRooms || "N/A"}`;
      // Custom label for cleaning
      return `${title} - Job Date: ${fullDateFormate(job.pickupDate)}`;

    case "Locksmith":
      title = `Key: ${job.typeOfKey || "N/A"} - Lock: ${job.typeOfLock || "N/A"}`;
      break;

    case "Car Key Replacement": // Mobile car key replacement
      title = `Vehicle: ${job.make || "N/A"} ${job.model || ""}`;
      break;

    case "Removals": // Rubbish removals
      title = `Rubbish: ${job.howManyItems || "N/A"}`;
      break;

    default:
      title = `Job for ${job.category}`;
  }

  // Categories that keep "Pickup Date" terminology: Van (Couriers), Recovery, Removals (Rubbish), Click & Collect
  const keepPickupDateCategories = ["Van", "Recovery", "Removals", "Click & Collect"];
  
  if (keepPickupDateCategories.includes(job.category)) {
    title += ` - Pickup Date: ${fullDateFormate(job.pickupDate)}`;
  } else if (job.category !== "Cleaning") {
    // All other categories use "Job Date"
    title += ` - Job Date: ${fullDateFormate(job.pickupDate)}`;
  }

  return title;
}


/**
 * Get the full URL for a file stored in S3
 * @param {string} fileName - The filename stored in the database
 * @returns {string|null} - The full S3 URL or null if no filename provided
 */
export const getFileUrl = (fileName) => {
  if (!fileName || !process.env.NEXT_PUBLIC_AWS_BASE_URL) return null;
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_AWS_BASE_URL;
    const fileUrl = new URL(fileName, baseUrl);
    return fileUrl.toString();
  } catch (error) {
    console.warn(`Failed to construct valid URL for file: ${fileName}`, error);
    return null;
  }
};


// Courier vehicle types
export const courierVehicleTypes = [
  { value: "bike", label: "Bike" },
  { value: "motorbike", label: "Motorbike" },
  { value: "car", label: "Car" },
  { value: "small_van", label: "Small Van" },
  { value: "medium_van", label: "Medium Van" },
  { value: "large_van", label: "Large Van" },
  { value: "xl_van", label: "XL Van" }
];

// Vehicle makes and models data for Recovery and Car Key Replacement services
export const vehicleData = {
  Abarth: [
    "124 Spider",
    "500",
    "500C",
    "500e",
    "500e C",
    "595",
    "595C",
    "600e",
    "695",
    "695C",
    "Grande Punto",
    "Punto Evo",
  ],
  AC: ["Cobra", "Dax Cobra"],
  AK: ["Cobra"],
  "Alfa Romeo": [
    "145",
    "146",
    "147",
    "156",
    "156 Sportwagon",
    "159",
    "159 Sportwagon",
    "164",
    "2000",
    "4C",
    "75",
    "8C",
    "Alfasud",
    "Brera",
    "Giulia",
    "Giulietta",
    "GT",
    "GTV",
    "Junior",
    "MiTo",
    "Spider",
    "Stelvio",
    "Tonale",
  ],
  Allard: ["L Type Tourer"],
  Alpine: ["A110", "A290"],
  Alvis: ["Ellis Tourer"],
  Ariel: ["Atom", "Atom 4", "Nomad"],
  "Aston Martin": [
    "Cygnet",
    "DB11",
    "DB12",
    "DB2",
    "DB4",
    "DB5",
    "DB6",
    "DB7",
    "DB9",
    "DBS",
    "DBX",
    "Rapide",
    "Rapide S",
    "V12 Zagato",
    "V8",
    "Valkyrie",
    "Valour",
    "Vanquish",
    "Vantage",
    "Virage",
    "Vulcan",
  ],
  Audi: [
    "100",
    "80",
    "A1",
    "A2",
    "A3",
    "A3 Cabriolet",
    "A4",
    "A4 Allroad",
    "A4 Avant",
    "A4 Cabriolet",
    "A5",
    "A5 Avant",
    "A5 Cabriolet",
    "A6 Allroad",
    "A6 Avant",
    "A6 e-tron Avant",
    "A6 e-tron Sportback",
    "A6 Saloon",
    "A6 Unspecified",
    "A7",
    "A8",
    "Cabriolet",
    "Coupe",
    "e-tron",
    "e-tron GT",
    "e-tron S",
    "Q2",
    "Q3",
    "Q4 e-tron",
    "Q5",
    "Q6 e-tron",
    "Q7",
    "Q8",
    "Q8 e-tron",
    "quattro",
    "R8",
    "RS2",
    "RS3",
    "RS4",
    "RS4 Avant",
    "RS4 Cabriolet",
    "RS5",
    "RS6",
    "RS6 Avant",
    "RS7",
    "RS e-tron GT",
    "RS Q3",
    "RSQ8",
    "S1",
    "S3",
    "S4",
    "S4 Avant",
    "S4 Cabriolet",
    "S5",
    "S5 Avant",
    "S6 Avant",
    "S6 e-tron Avant",
    "S6 e-tron Sportback",
    "S6 Saloon",
    "S7",
    "S8",
    "S e-tron GT",
    "SQ2",
    "SQ5",
    "SQ6 e-tron",
    "SQ7",
    "SQ8",
    "SQ8 e-tron",
    "TT",
    "TT RS",
    "TTS",
  ],
  Austin: [
    "1100",
    "A30",
    "A35",
    "Ambassador",
    "Healey",
    "Maestro",
    "Mini",
    "Mini Cooper",
    "Mini Cooper S",
    "Mini Moke",
    "Seven",
    "Twelve",
  ],
  BAC: ["Mono"],
  Banham: ["Porsche Spyder 550"],
  Beauford: ["Open Tourer", "Series 3"],
  Bentley: [
    "Arnage",
    "Azure",
    "Bentayga",
    "Brooklands",
    "Continental",
    "Eight",
    "Flying Spur",
    "Mulsanne",
    "Series III",
    "Turbo R",
    "Turbo RT",
  ],
  BMW: [
    "1602",
    "1 Series",
    "2002",
    "2 Series",
    "2 Series Active Tourer",
    "2 Series Gran Coupe",
    "2 Series Gran Tourer",
    "3 Series",
    "3 Series Gran Turismo",
    "4 Series",
    "4 Series Gran Coupe",
    "5 Series",
    "5 Series Gran Turismo",
    "6 Series",
    "6 Series Gran Coupe",
    "6 Series Gran Turismo",
    "7 Series",
    "8 Series",
    "8 Series Gran Coupe",
    "Alpina B10",
    "Alpina B12",
    "Alpina B3",
    "Alpina B4 Gran Coupe",
    "Alpina B5",
    "Alpina B6",
    "Alpina B7",
    "Alpina B8 Gran Coupe",
    "Alpina D3",
    "Alpina D4",
    "Alpina D5",
    "Alpina Roadster",
    "Alpina Unspecified Models",
    "Alpina XB7",
    "Alpina XD3",
    "i3",
    "i4",
    "i5",
    "i7",
    "i8",
    "iX",
    "iX1",
    "iX2",
    "iX3",
    "M2",
    "M3",
    "M4",
    "M5",
    "M6",
    "M6 Gran Coupe",
    "M8",
    "M8 Gran Coupe",
    "X1",
    "X2",
    "X3",
    "X3 M",
    "X4",
    "X4 M",
    "X5",
    "X5 M",
    "X6",
    "X6 M",
    "X7",
    "XM",
    "Z1",
    "Z3",
    "Z3 M",
    "Z4",
    "Z4 M",
    "Z8",
  ],
  Bugatti: ["Chiron", "Type", "Veyron"],
  BYD: [
    "Atto 3",
    "Seal",
    "Dolphin",
    "Dolphin Surf",
    "Seal",
    "Sealion 7",
    "Seal U",
  ],
  Cadillac: ["Allante", "BLS", "CTS", "De Ville", "Escalade", "STS"],
  Caterham: ["CSR", "Seven", "Seven 170 R", "Seven 170 S"],
  Chevrolet: ["Camaro", "Corvette", "Cruze", "Spark"],
  Chrysler: ["300C", "Voyager"],
  Citroen: ["C3", "C4", "C5", "Berlingo"],
  Cupra: ["Born", "Formentor"],
  Dacia: ["Sandero", "Duster", "Jogger"],
  Daihatsu: ["Terios", "Copen"],
  Dodge: ["Charger", "Challenger", "RAM"],
  "DS Automobiles": ["DS3", "DS4", "DS7"],
  Ferrari: ["488", "812", "F8 Tributo", "Roma", "Purosangue"],
  Fiat: ["500", "Panda", "Tipo"],
  Fisker: ["Ocean"],
  Ford: ["Fiesta", "Focus", "Mondeo", "Kuga", "Puma", "Mustang"],
  Genesis: ["GV60", "GV70", "G80"],
  GMC: ["Yukon", "Sierra"],
  Honda: ["Civic", "Accord", "CR-V", "HR-V", "Jazz"],
  Hummer: ["H2", "H3"],
  Hyundai: ["i10", "i20", "i30", "Tucson", "Santa Fe"],
  Infiniti: ["Q30", "Q50", "QX70"],
  Isuzu: ["D-Max"],
  Jaguar: ["XE", "XF", "XJ", "F-Pace", "E-Pace", "I-Pace"],
  Jeep: ["Wrangler", "Renegade", "Compass", "Cherokee"],
  Kia: ["Picanto", "Rio", "Sportage", "Sorento", "EV6"],
  Koenigsegg: ["Jesko", "Regera"],
  Lamborghini: ["Aventador", "Huracan", "Urus"],
  Lancia: ["Delta"],
  "Land Rover": ["Defender", "Discovery", "Range Rover", "Evoque"],
  Lexus: ["IS", "ES", "NX", "RX", "UX"],
  Lotus: ["Elise", "Evora", "Exige", "Emira"],
  Maserati: ["Ghibli", "Levante", "Quattroporte", "MC20"],
  Maybach: ["57", "62"],
  Mazda: ["Mazda2", "Mazda3", "CX-5", "CX-30"],
  McLaren: ["570S", "720S", "Artura"],
  "Mercedes-Benz": [
    "A-Class",
    "C-Class",
    "E-Class",
    "S-Class",
    "GLC",
    "GLE",
    "G-Class",
  ],
  MG: ["ZS", "HS", "MG4"],
  MINI: ["Hatch", "Clubman", "Countryman"],
  Mitsubishi: ["Lancer", "Outlander", "ASX", "Eclipse Cross"],
  Nissan: ["Micra", "Juke", "Qashqai", "X-Trail", "GT-R"],
  Peugeot: ["208", "308", "3008", "5008"],
  Polestar: ["2", "3"],
  Porsche: ["911", "Cayenne", "Macan", "Taycan"],
  Renault: ["Clio", "Megane", "Captur", "Austral"],
  "Rolls-Royce": ["Phantom", "Ghost", "Wraith", "Cullinan"],
  Saab: ["9-3", "9-5"],
  SEAT: ["Ibiza", "Leon", "Ateca"],
  Skoda: ["Fabia", "Octavia", "Kodiaq", "Superb"],
  Smart: ["ForTwo", "ForFour"],
  Subaru: ["Impreza", "Outback", "Forester", "BRZ"],
  Suzuki: ["Swift", "Vitara", "Jimny"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X"],
  Toyota: ["Yaris", "Corolla", "Camry", "CHR", "RAV4", "Land Cruiser"],
  Vauxhall: ["Corsa", "Astra", "Insignia", "Mokka"],
  Volkswagen: ["Polo", "Golf", "Passat", "Tiguan", "Touareg"],
  Volvo: ["XC40", "XC60", "XC90", "S60", "V60"],
};

export const calculateOrderTotalPrice = (totalProductPrice, deliveryPrice) => {
  const productPrice = totalProductPrice ? parseFloat(totalProductPrice) : 0;
  const delivery = deliveryPrice ? parseFloat(deliveryPrice) : 0;
  return productPrice + delivery;
};

export const getShopStatusBadge = (status) => {
  const statusConfig = {
    inactive: { class: 'bg-warning', text: 'Inactive' },
    active: { class: 'bg-success', text: 'Active' },
    suspended: { class: 'bg-danger', text: 'Suspended' },
  };
  
  const config = statusConfig[status] || statusConfig.inactive;
  return (
    <span className={`badge badge-custom-sm ${config.class} capitalize p-2 text-[14px] text-center text-white`}>
      {config.text}
    </span>
  );
};

export const getOpenStatusBadge = (isOpen) => {
  const config = isOpen
    ? { class: 'bg-success', text: 'Open' }
    : { class: 'bg-danger', text: 'Closed' };
  return (
    <span className={`badge badge-custom-sm ${config.class} capitalize p-2 text-[14px] text-center text-white`}>
      {config.text}
    </span>
  );
};

export const getShopTimeBadge = (openingHours) => {
  if (!openingHours) {
    return null;
  }

  const todayHours = getTodayOpeningHours(openingHours);
  if (!todayHours || !todayHours.open || !todayHours.close) {
    return null;
  }

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Helper to convert time string (HH:MM or HH:MM:SS) to minutes for comparison
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const currentMinutes = timeToMinutes(currentTime);
  const openingMinutes = timeToMinutes(todayHours.open);
  const closingMinutes = timeToMinutes(todayHours.close);

  // Check if shop is currently open
  let isOpen = false;
  let timeText = '';
  let badgeClass = '';

  if (openingMinutes <= closingMinutes) {
    // Normal case: opening time is before closing time (e.g., 9:00 to 17:00)
    isOpen = currentMinutes >= openingMinutes && currentMinutes < closingMinutes;
  } else {
    // Overnight case: opening time is after closing time (e.g., 22:00 to 6:00)
    isOpen = currentMinutes >= openingMinutes || currentMinutes < closingMinutes;
  }

  if (isOpen) {
    // Shop is open, show closing time
    timeText = `Closes at ${todayHours.close}`;
    badgeClass = 'bg-light text-success border border-success'; // Light green badge for open
  } else {
    // Shop is closed, show opening time
    if (currentMinutes < openingMinutes || (openingMinutes > closingMinutes && currentMinutes >= closingMinutes)) {
      // Shop opens later today or tomorrow
      timeText = `Opens ${todayHours.open}`;
    } else {
      // Shop closed earlier today, opens tomorrow
      timeText = `Opens ${todayHours.open}`;
    }
    badgeClass = 'bg-light text-danger border border-danger'; // Light red badge for closed
  }

  return (
    <span className={`badge badge-custom-sm ${badgeClass} capitalize p-2 text-[14px] text-center`}>
      <i className="bi bi-clock me-1"></i>
      {timeText}
    </span>
  );
};

/**
 * Default opening hours for new shops/restaurants (6 days: Monday to Saturday)
 */
export const defaultOpeningHours = [
  { day: "monday", label: "Monday", open: "09:00", close: "17:00" },
  { day: "tuesday", label: "Tuesday", open: "09:00", close: "17:00" },
  { day: "wednesday", label: "Wednesday", open: "09:00", close: "17:00" },
  { day: "thursday", label: "Thursday", open: "09:00", close: "17:00" },
  { day: "friday", label: "Friday", open: "09:00", close: "17:00" },
  { day: "saturday", label: "Saturday", open: "09:00", close: "17:00" },
  { day: "sunday", label: "Sunday", open: "09:00", close: "17:00" },

];

/**
 * Gets the current day name in lowercase (monday, tuesday, etc.)
 * @returns {string} - Current day name
 */
export const getCurrentDayName = () => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = new Date().getDay();
  return days[today];
};

/**
 * Gets today's opening hours from shop metadata
 * @param {Array|Object} openingHours - Opening hours array or object
 * @returns {Object|null} - Today's opening hours { day, label, open, close } or null
 */
export const getTodayOpeningHours = (openingHours) => {
  if (!openingHours) return null;
  
  const currentDay = getCurrentDayName();
  
  // Handle array format
  if (Array.isArray(openingHours)) {
    return openingHours.find(oh => oh.day === currentDay) || null;
  }
  
  // Handle object format for backward compatibility
  if (typeof openingHours === 'object' && openingHours[currentDay]) {
    return {
      day: currentDay,
      open: openingHours[currentDay].open || '',
      close: openingHours[currentDay].close || ''
    };
  }
  
  return null;
};

/**
 * Checks if a shop/restaurant is currently closed based on opening hours
 * @param {Array|Object} openingHours - Opening hours array or object from shop_metadata
 * @returns {boolean} - true if the shop is closed, false if open
 */
export const isShopClosed = (openingHours) => {
  if (!openingHours) {
    return true;
  }

  const todayHours = getTodayOpeningHours(openingHours);
  if (!todayHours || !todayHours.open || !todayHours.close) {
    // If today has no hours set, shop is closed
    return true;
  }

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Helper to convert time string (HH:MM or HH:MM:SS) to minutes for comparison
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const currentMinutes = timeToMinutes(currentTime);
  const openingMinutes = timeToMinutes(todayHours.open);
  const closingMinutes = timeToMinutes(todayHours.close);
  
  if (openingMinutes <= closingMinutes) {
    // Normal case: opening time is before closing time (e.g., 9:00 to 22:30)
    // Closed if current time is before opening or after closing
    return currentMinutes < openingMinutes || currentMinutes >= closingMinutes;
  } else {
    // Overnight case: opening time is after closing time (e.g., 22:00 to 6:00)
    // Closed if current time is between closing and opening
    return currentMinutes >= closingMinutes && currentMinutes < openingMinutes;
  }
  
  return false;
};

/**
 * Gets the next day's opening time when shop is closed
 * @param {Array|Object} openingHours - Opening hours array or object from shop_metadata
 * @returns {Object|null} - Next day's opening hours { day, label, open, close } or null
 */
export const getNextDayOpenTime = (openingHours) => {
  if (!openingHours) return null;

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = new Date().getDay();
  
  // Start checking from tomorrow (next day)
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (today + i) % 7;
    const nextDayName = days[nextDayIndex];
    
    let nextDayHours = null;
    
    // Handle array format
    if (Array.isArray(openingHours)) {
      nextDayHours = openingHours.find(oh => oh.day === nextDayName);
    } 
    // Handle object format for backward compatibility
    else if (typeof openingHours === 'object' && openingHours[nextDayName]) {
      const dayData = openingHours[nextDayName];
      if (dayData && (dayData.open || dayData.close)) {
        nextDayHours = {
          day: nextDayName,
          open: dayData.open || '',
          close: dayData.close || ''
        };
      }
    }
    
    // If we found a day with opening hours, return it
    if (nextDayHours && nextDayHours.open) {
      return nextDayHours;
    }
  }
  
  return null;
};

/**
 * Sanitizes a file name to be URL-safe and S3-friendly.
 * Removes special characters, replaces spaces, and preserves the file extension.
 * Example: "My Resume (Final)!.pdf" → "my-resume-final.pdf"
 */
export const sanitizeFileName = (name) => {
  if (!name || typeof name !== "string") return "file";

  // Split name and extension
  const parts = name.split(".");
  const extension = parts.length > 1 ? parts.pop().toLowerCase() : "";
  const baseName = parts.join(".");

  // Slugify the base name: remove invalid chars, replace spaces with hyphens
  const safeBaseName = baseName
    .normalize("NFKD") // handle Unicode safely
    .replace(/[^a-zA-Z0-9\s_-]/g, "") // remove invalid characters
    .trim()
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .toLowerCase();

  // Limit overly long names (for URL safety)
  const truncated = safeBaseName.slice(0, 50);

  // Return final name
  return extension ? `${truncated}.${extension}` : truncated;
};
export const regionBounds = {
  GB: {
    north: 60.8607,
    south: 49.8642,
    west: -8.6494,
    east: 1.759,
  },
  SA: {
    north: 32.0,     // corrected realistic bounds
    south: 16.0,
    west: 34.0,
    east: 56.0,
  },
  AE: {
    north: 26.0,
    south: 22.5,
    west: 50.5,
    east: 56.5,
  },
  EG: {
    north: 31.8,
    south: 21.5,
    west: 24.5,
    east: 37.0,
  },
  CY: {
    north: 35.7,
    south: 34.5,
    west: 32.0,
    east: 34.6,
  },
  US: {
    north: 49.38,
    south: 24.5,
    west: -125.0,
    east: -66.9,
  },
};

export const getUserRegionByCoordinates = (latitude, longitude) => {
  try {
    for (const [region, bounds] of Object.entries(regionBounds)) {
      if (
        latitude >= bounds.south &&
        latitude <= bounds.north &&
        longitude >= bounds.west &&
        longitude <= bounds.east
      ) {
        return region;
      }
    }
    return "GB"; 
  } catch (error) {
    console.error("Error fetching user region:", error);
    return "GB";
  }
};

/**
 * Format distance based on location
 * @param {number} distance - Distance in miles
 * @param {object} location - Location object with id ('sa', 'uk', 'ae', 'eg', 'cy') or code ('SA', 'GB', 'AE', 'EG', 'CY')
 * @returns {string} - Formatted distance string (KM for metric countries, miles for UK)
 */
export const formatDistanceByLocation = (distance, location = null) => {
  if (distance === null || distance === undefined || distance === "") return "N/A";

  const numericDistance = Number(distance);
  if (!Number.isFinite(numericDistance)) return "N/A";
  
  // Get location ID or code from location object
  let locationId = null;
  if (location) {
    locationId = location.id || location.code;
  } else {
    // Try to get from localStorage if available (client-side only)
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("selectedLocation");
        if (saved) {
          const savedLocation = JSON.parse(saved);
          locationId = savedLocation.id;
        }
      } catch (error) {
        console.error("Error reading location from localStorage:", error);
      }
    }
  }
  
  // Convert location code to id format if needed
  // Countries that use kilometers: Saudi Arabia, UAE, Egypt, Cyprus
  const metricCountries = ['SA', 'sa', 'AE', 'ae', 'EG', 'eg', 'CY', 'cy'];
  if (metricCountries.includes(locationId)) {
    // Convert miles to kilometers
    const km = numericDistance * 1.60934;
    return `${km.toFixed(1)} km`;
  } else {
    // UK or default - use miles
    return `${numericDistance.toFixed(1)} miles`;
  }
};

export const DEFAULT_PAGINATION = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 1,
};

// Check if an item is "new" based on createdAt date (within last 30 days)
export const isNewItem = (createdAt, daysThreshold = 30) => {
  if (!createdAt) return false;
  
  const createdDate = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now - createdDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= daysThreshold;
};


export const nameRegex = /^(?!.*\s{2,})[A-Za-z-]+(?:\s[A-Za-z-]+)*$/;
/**
 * Filters services based on excluded services and location-specific rules
 * @param {Object} service - The service object to check
 * @param {Object} selectedLocation - The selected location object with code property
 * @returns {boolean} - true if service should be included, false otherwise
 */
export const shouldIncludeService = (service, selectedLocation = null) => {
  // const excludedServices = [
  //   'Order Food', 'Taxi Rides', 'shop', 'restaurant', 'supermarket',
  //   'Book a Table', 'MOT &  Repairs', 'Shisha lounges', 'Spa', 'Beauty',
  //   'Healthcare', 'Events', 'Entertainment'
  // ];

  // if (excludedServices.includes(service.id)) return false;

  // Only show "Luggage Storage" and "Click & Collect" in UK
  if ((service.id === 'Luggage Storage' || service.id === 'Click & Collect') &&
      (!selectedLocation || selectedLocation.code !== 'GB')) {
    return false;
  }

  // Hide Dry Cleaning in the UK
  if (service.id === 'Dry Cleaning Pick-Up' &&
      selectedLocation?.code === 'GB') {
    return false;
  }

  return true;
};

/**
 * Returns filtered array of services based on excluded and location-specific rules
 * @param {Array} servicesArray - Array of service objects
 * @param {Object} selectedLocation - The selected location object
 * @returns {Array} - Filtered array
 */
export const getFilteredServices = (servicesArray, selectedLocation = null) => {
  return servicesArray.filter(service => shouldIncludeService(service, selectedLocation));
};

/**
 * Get ordering services
 * @param {Array} servicesArray 
 * @returns {Array} - Ordered array of ordering services
 */
export const getOrderingServices = (servicesArray) => {
  const orderingServiceIds = ['Taxi Rides', 'shop', 'restaurant', 'supermarket'];
  return servicesArray
    .filter(service => orderingServiceIds.includes(service.id))
    .sort((a, b) => orderingServiceIds.indexOf(a.id) - orderingServiceIds.indexOf(b.id));
};

/**
 * Get reservation services
 * @param {Array} servicesArray 
 * @returns {Array} - Ordered array of reservation services
 */
export const getReservationServices = (servicesArray) => {
  const reservationServiceIds = ['Book a Table', 'MOT & Repairs', 'Shisha lounges', 'Spa', 'Beauty', 'Healthcare', 'Events', 'Entertainment'];
  return servicesArray
    .filter(service => reservationServiceIds.includes(service.id))
    .sort((a, b) => reservationServiceIds.indexOf(a.id) - reservationServiceIds.indexOf(b.id));
};

/**
 * Get booking services (excluding ordering & reservation)
 * @param {Array} servicesArray 
 * @param {Array} orderingServices 
 * @param {Array} reservationServices 
 * @returns {Array} - Remaining services
 */
export const getBookingServices = (servicesArray, orderingServices, reservationServices) => {
  const excludedIds = [...orderingServices.map(s => s.id), ...reservationServices.map(s => s.id)];
  return servicesArray.filter(service => !excludedIds.includes(service.id));
};


export const getCategoryPluralForm = (selectedCategoryId, categories = [], defaultPlural = "shops") => {
  if (!selectedCategoryId || !categories || categories.length === 0) {
    return defaultPlural;
  }

  const selectedCategoryObj = categories.find(
    (cat) => String(cat.id) === String(selectedCategoryId)
  );

  if (!selectedCategoryObj || !selectedCategoryObj.name) {
    return defaultPlural;
  }

  const categoryName = selectedCategoryObj.name.toLowerCase();
  let pluralForm = categoryName;

  if (categoryName.includes("supermarket")) {
    pluralForm = "supermarkets";
  } else if (categoryName.includes("pharmacy")) {
    pluralForm = "pharmacies";
  } else if (categoryName.endsWith("y") && !categoryName.endsWith("ay") && !categoryName.endsWith("ey") && !categoryName.endsWith("oy") && !categoryName.endsWith("uy")) {
    pluralForm = categoryName.slice(0, -1) + "ies";
  } else if (!categoryName.endsWith("s")) {
    pluralForm = categoryName + "s";
  }

  return pluralForm;
};
