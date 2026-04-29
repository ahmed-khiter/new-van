export async function geocodePostcode(
  postcode,
  city,
  countryCode
) {
  try {
    // Base address is the postcode
    let query = encodeURIComponent(postcode);

    // If city is provided, add it into the address string (improves accuracy)
    if (city) {
      query += `,${encodeURIComponent(city)}`;
    }

    let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}`;

    // If we know the country, restrict search with components
    if (countryCode) {
      url += `&components=country:${countryCode}`;
    }

    url += `&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      console.log("Geocode Response:", data.results[0]);
      return { latitude: lat, longitude: lng };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}
