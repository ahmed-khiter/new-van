'use client';
import { FaBullseye, FaSearch, FaMapMarkerAlt } from "react-icons/fa";
import { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

export default function AddressInput({
    value,
    onChange,
    onLocationSelect,
    placeholder,
    label
}) {
    const inputRef = useRef(null);
    const autocompleteRef = useRef(null);
    const autocompleteServiceRef = useRef(null);
    const debounceTimeoutRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const { mapBounds, userSelectedLocation, isGoogleMapsLoaded} = useGoogleMaps();
    
    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(location);
                    console.log('User location obtained:', location);
                if (window.google?.maps?.Geocoder) {
                    const geocoder = new window.google.maps.Geocoder();
                    geocoder.geocode({ location }, (results, status) => {
                        if (status === "OK" && results[0]) {
                            const countryComponent = results[0].address_components.find(c =>
                                c.types.includes("country")
                            );
                            if (countryComponent) {
                                setUserLocation((prev) => ({ ...prev, country: countryComponent.short_name }));
                            }
                        }
                    });
                }
                },
                (error) => {
                    console.warn('Could not get user location:', error);
                    setUserLocation({ lat: 51.5074, lng: -0.1278 });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        } else {
            console.warn('Geolocation is not supported by this browser');
            setUserLocation({ lat: 51.5074, lng: -0.1278, country: 'GB' });
        }
    };

    useEffect(() => {
        const checkGoogleMaps = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
                if (!autocompleteServiceRef.current) {
                    autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
                }
                
                if(!userSelectedLocation){
                    console.log("getUserLocation" , userSelectedLocation)
                    getUserLocation();
                }
                initializeAutocomplete();
            } else {
                setTimeout(checkGoogleMaps, 100);
            }
        };

        if (isGoogleMapsLoaded) {
            checkGoogleMaps();
        }
    }, [isGoogleMapsLoaded, userSelectedLocation]);

    useEffect(() => {
        if (isGoogleMapsLoaded && (userLocation || mapBounds || userSelectedLocation) && autocompleteRef.current) {
            initializeAutocomplete();
        }
    }, [userLocation, isGoogleMapsLoaded, mapBounds, userSelectedLocation]);

    useEffect(() => {
        return () => {
            if (autocompleteRef.current) {
                window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    const initializeAutocomplete = () => {
        if (!inputRef.current || !window.google?.maps?.places) return;

        if (autocompleteRef.current) {
            window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
            autocompleteRef.current = null;
        }

        if (!autocompleteServiceRef.current) {
            autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        }

        // Use only AutocompleteService + custom dropdown so postcode logic (getPredictions with
        // multiple requests) and single-dropdown behavior work. Native Autocomplete is not attached.
    };

    const isPostcodePattern = (query) => {
        const trimmedQuery = query.trim().toUpperCase();
        const ukPostcodePattern = /^[A-Z]{1,2}\d{1,2}[A-Z]?(\s\d{1,2})?(\s?[A-Z]{2})?$/;
        return ukPostcodePattern.test(trimmedQuery) && trimmedQuery.length >= 3;
    };

    const getPredictions = (query) => {
        if (!autocompleteServiceRef.current || !query.trim() || query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsLoading(true);
        const trimmedQuery = query.trim();
        const isPostcode = isPostcodePattern(trimmedQuery);
        let allPredictions = [];
        let completedRequests = 0;
        const totalRequests = isPostcode ? 4 : 1;

        const finalizeResults = () => {
            setIsLoading(false);
            const uniquePredictions = Array.from(
                new Map(allPredictions.map(p => [p.place_id, p])).values()
            );
            
            if (isPostcode) {
                uniquePredictions.sort((a, b) => {
                    const aDesc = (a.description || a.formatted_address || '').toUpperCase();
                    const bDesc = (b.description || b.formatted_address || '').toUpperCase();
                    const queryUpper = trimmedQuery.toUpperCase();
                    const aStartsWith = aDesc.includes(queryUpper);
                    const bStartsWith = bDesc.includes(queryUpper);
                    if (aStartsWith && !bStartsWith) return -1;
                    if (!aStartsWith && bStartsWith) return 1;
                    if (aStartsWith && bStartsWith) {
                        return aDesc.length - bDesc.length;
                    }
                    return 0;
                });
            }
            
            if (uniquePredictions.length > 0) {
                setSuggestions(uniquePredictions.slice(0, 10));
                setShowSuggestions(true);
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        };

        const processPredictions = (predictions, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                const formattedPredictions = predictions.map(prediction => ({
                    place_id: prediction.place_id,
                    description: prediction.description || prediction.formatted_address,
                    structured_formatting: prediction.structured_formatting,
                    formatted_address: prediction.formatted_address || prediction.description,
                    name: prediction.structured_formatting?.main_text || prediction.name || prediction.description,
                    geometry: prediction.geometry,
                    address_components: prediction.address_components
                }));
                allPredictions.push(...formattedPredictions);
            }
            
            completedRequests++;
            if (completedRequests === totalRequests) {
                finalizeResults();
            }
        };

        const countryCode = userSelectedLocation?.code || userLocation?.country || 'GB';
        const baseRequest = {
            types: ['address'],
            componentRestrictions: { country: countryCode }
        };

        if (userSelectedLocation || userLocation) {
            baseRequest.location = new window.google.maps.LatLng(
                userSelectedLocation?.lat || userLocation.lat,
                userSelectedLocation?.lng || userLocation.lng
            );
            baseRequest.radius = 50000;
        }

        if (mapBounds) {
            baseRequest.bounds = new window.google.maps.LatLngBounds(
                new window.google.maps.LatLng(mapBounds.south, mapBounds.west),
                new window.google.maps.LatLng(mapBounds.north, mapBounds.east)
            );
        }

        const request1 = { ...baseRequest, input: trimmedQuery };
        autocompleteServiceRef.current.getPlacePredictions(request1, processPredictions);

        if (isPostcode) {
            const request2 = { 
                ...baseRequest, 
                input: `${trimmedQuery} ${countryCode}`,
                types: ['geocode']
            };
            autocompleteServiceRef.current.getPlacePredictions(request2, processPredictions);

            const request3 = { 
                ...baseRequest, 
                input: `${trimmedQuery}, United Kingdom`,
                types: ['geocode']
            };
            autocompleteServiceRef.current.getPlacePredictions(request3, processPredictions);

            try {
                const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
                const textSearchRequest = {
                    query: trimmedQuery,
                    types: ['address'],
                    componentRestrictions: { country: countryCode }
                };

                if (userSelectedLocation || userLocation) {
                    textSearchRequest.location = new window.google.maps.LatLng(
                        userSelectedLocation?.lat || userLocation.lat,
                        userSelectedLocation?.lng || userLocation.lng
                    );
                    textSearchRequest.radius = 50000;
                }

                placesService.textSearch(textSearchRequest, (results, status) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                        const formattedResults = results.map(result => ({
                            place_id: result.place_id,
                            description: result.formatted_address,
                            formatted_address: result.formatted_address,
                            name: result.name,
                            geometry: result.geometry,
                            address_components: result.address_components,
                            structured_formatting: {
                                main_text: result.name,
                                secondary_text: result.formatted_address
                            }
                        }));
                        allPredictions.push(...formattedResults);
                    }
                    completedRequests++;
                    if (completedRequests === totalRequests) {
                        finalizeResults();
                    }
                });
            } catch (error) {
                console.error('Error in textSearch for postcode:', error);
                completedRequests++;
                if (completedRequests === totalRequests) {
                    finalizeResults();
                }
            }
        }
    };

    const handleInputChange = (e) => {
        const query = e.target.value;

        onChange(query);

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        if (query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (isGoogleMapsLoaded && autocompleteServiceRef.current) {
            debounceTimeoutRef.current = setTimeout(() => {
                getPredictions(query);
            }, 300);
        } else if (!isGoogleMapsLoaded) {
            debounceTimeoutRef.current = setTimeout(() => {
                if (query.length > 2) {
                    searchPlaces(query);
                } else {
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            }, 300);
        }
    };
    const extractCityAndPostcode = (addressComponents, formattedAddress = "") => {
        let postcode = "";
        let city = "";

        if (!addressComponents) return { city, postcode };

        console.log('Address components:', addressComponents);

        addressComponents.forEach(component => {
            console.log('Component:', component.long_name, 'Types:', component.types);
            
            if (
                component.types.includes("postal_code") ||
                component.types.includes("postal_code_prefix") ||
                component.types.includes("postal_code_suffix")
            ) {
                postcode = component.long_name;
                console.log('Found postcode:', postcode);
            }
            
            if (
                component.types.includes("locality") ||
                component.types.includes("postal_town") ||
                component.types.includes("administrative_area_level_2") ||
                component.types.includes("administrative_area_level_1") ||
                component.types.includes("sublocality") ||
                component.types.includes("sublocality_level_1") ||
                component.types.includes("sublocality_level_2")
            ) {
                if (!city) {
                    city = component.long_name;
                    console.log('Found city:', city);
                }
            }
        });

        if (!postcode && formattedAddress) {
            const postcodePatterns = [
                /(\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b)/,
                /(\b\d{5}(-\d{4})?\b)/,
                /(\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b)/,
                /(\b\d{4}\b)/,
                /(\b\d{5}\b)/,
                /(\b\d{6}\b)/,
            ];

            for (const pattern of postcodePatterns) {
                const match = formattedAddress.match(pattern);
                if (match) {
                    postcode = match[1];
                    console.log('Extracted postcode from formatted address:', postcode);
                    break;
                }
            }
        }

        console.log('Extracted - City:', city, 'Postcode:', postcode);
        return { city, postcode };
    };
    const searchPlaces = async (query) => {
        if (!query.trim() || !window.google?.maps?.places) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setIsLoading(true);

        try {
            const service = new window.google.maps.places.PlacesService(document.createElement('div'));

            const request = {
                query: query,
                types: ['address'],
                componentRestrictions: { country: userLocation?.country }
            };

            service.textSearch(request, (results, status) => {
                setIsLoading(false);
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                    setSuggestions(results.slice(0, 5));
                    setShowSuggestions(true);
                } else {
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            });
        } catch (error) {
            console.error('Error searching places:', error);
            setIsLoading(false);
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const setupManualSearch = () => {
        let timeoutId;
        const handleManualInput = (e) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                if (e.target.value.length > 2) {
                    searchPlaces(e.target.value);
                } else {
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            }, 300);
        };

        if (inputRef.current) {
            inputRef.current.addEventListener('input', handleManualInput);
        }
    };

    const handleSuggestionClick = async (place) => {
        if (place.place_id && (!place.geometry || !place.address_components)) {
            setIsLoading(true);
            const service = new window.google.maps.places.PlacesService(document.createElement('div'));
            
            service.getDetails(
                {
                    placeId: place.place_id,
                    fields: ['formatted_address', 'geometry', 'name', 'place_id', 'address_components']
                },
                (placeDetails, status) => {
                    setIsLoading(false);
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                        const { postcode, city } = extractCityAndPostcode(
                            placeDetails.address_components,
                            placeDetails.formatted_address || placeDetails.name
                        );

                        const location = {
                            lat: placeDetails.geometry.location.lat(),
                            lng: placeDetails.geometry.location.lng(),
                            address: placeDetails.formatted_address || placeDetails.name,
                            placeId: placeDetails.place_id,
                            postcode: postcode,
                            city: city
                        };

                        onChange(placeDetails.formatted_address || placeDetails.name);
                        onLocationSelect(location);
                        setShowSuggestions(false);
                        setSuggestions([]);
                    } else {
                        console.error('Error getting place details:', status);
                    }
                }
            );
        } else {
            const { postcode, city } = extractCityAndPostcode(place?.address_components, place.formatted_address || place.name);

            const location = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                address: place.formatted_address || place.name,
                placeId: place.place_id,
                postcode: postcode,
                city: city
            };

            onChange(place.formatted_address || place.name);
            onLocationSelect(location);
            setShowSuggestions(false);
            setSuggestions([]);
        }
    };

    const handleSearch = () => {
        if (value?.trim()) {
            console.log("value" , value)
            searchPlaces(value);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (suggestions.length > 0) {
                handleSuggestionClick(suggestions[0]);
            } else {
                handleSearch();
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };
    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by this browser.');
            return;
        }

        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                if (window.google?.maps?.Geocoder) {
                    const geocoder = new window.google.maps.Geocoder();
                    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                        setIsLoading(false);
                        if (status === 'OK' && results[0]) {
                            const { postcode, city } = extractCityAndPostcode(results[0].address_components, results[0].formatted_address);

                            const location = {
                                lat,
                                lng,
                                address: results[0].formatted_address,
                                postcode: postcode,
                                city: city
                            };
                            onChange(results[0].formatted_address);
                            onLocationSelect(location);
                        }
                    });
                } else {
                    setIsLoading(false);
                    alert('Google Maps not loaded. Please try again.');
                }
            },
            (error) => {
                setIsLoading(false);
                console.error('Geolocation error:', error);
                alert('Unable to get your current location. Please enter address manually.');
            }
        );
    };

    return (
        <div className="relative">
            {label && (
            <label className="block text-sm font-medium text-gray-700 mb-2">
            <span className="d-inline-flex align-items-center justify-content-center ">
            📍 {label}

          </span>

            </label>
            )}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                        if (suggestions.length > 0) {
                            setShowSuggestions(true);
                        }
                    }}
                    onBlur={() => {
                        setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    placeholder={placeholder}
                    className="input-field pr-20"
                    autoComplete="off"
                />

                <button
                    onClick={handleSearch}
                    disabled={isLoading || !value}
                    className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                    title="Search for address"
                >
                    {isLoading ? (
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                    ) : (
                        <FaSearch className="h-4 w-4 text-gray-400" />
                    )}
                </button>

                <button
                    onClick={handleUseCurrentLocation}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                    title="Use current location"
                >
                    <FaBullseye className="h-4 w-4 text-gray-400" />
                </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((place, index) => (
                        <button
                            key={place.place_id || index}
                            onClick={() => handleSuggestionClick(place)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0"
                        >
                            <div className="font-medium text-gray-900">
                                {place.structured_formatting?.main_text || place.formatted_address || place.name || place.description}
                            </div>
                            {place.structured_formatting?.secondary_text && (
                                <div className="text-sm text-gray-500">{place.structured_formatting.secondary_text}</div>
                            )}
                            {!place.structured_formatting?.secondary_text && place.formatted_address && place.name && place.formatted_address !== place.name && (
                                <div className="text-sm text-gray-500">{place.name}</div>
                            )}
                        </button>
                    ))}
                </div>
            )}
            {isLoading && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mr-2" />
                        <span className="text-sm text-gray-600">Searching...</span>
                    </div>
                </div>
            )}

            {!isGoogleMapsLoaded && (
                <div className="mt-2 text-xs text-gray-500">
                    Loading Google Maps for better address suggestions...
                </div>
            )}
        </div>
    );
}
