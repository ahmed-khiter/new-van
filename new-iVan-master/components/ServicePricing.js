"use client";
import { formatAmountToCurrency } from "@/utils/helper";

const ServicePricing = ({ serviceType }) => {
  const getPricingData = () => {
    switch (serviceType) {
      case "spa":
        return {
          title: "Spa Services",
          items: [
            { name: "Massage", duration: "30 mins", price: 40 },
            { name: "Massage", duration: "1 hour", price: 60 },
            { name: "Sauna and Steam Room", duration: "3 hours", price: 20 },
          ],
        };
      case "mot":
        return {
          title: "MOT Services",
          items: [
            { name: "MOT Test", price: 49.99 },
          ],
        };
      case "shisha":
        return {
          title: "Shisha lounges Services",
          items: [
            { name: "Shisha Session", duration: "1 hour", price: 25 },
            { name: "Shisha Session", duration: "2 hours", price: 40 },
            { name: "Premium Shisha", duration: "1 hour", price: 35 },
          ],
        };
      case "beauty":
        return {
          title: "Beauty Services",
          items: [
            { name: "Haircut", price: 30 },
            { name: "Haircut & Styling", price: 45 },
            { name: "Hair Color", price: 60 },
            { name: "Manicure", price: 25 },
            { name: "Pedicure", price: 30 },
            { name: "Full Set (Manicure & Pedicure)", price: 50 },
          ],
        };
      default:
        return null;
    }
  };

  const pricingData = getPricingData();

  if (!pricingData) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{pricingData.title}</h2>
      <div className="space-y-4">
        {pricingData.items.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange-500 transition-colors"
          >
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
              {item.duration && (
                <p className="text-sm text-gray-600 mt-1">{item.duration}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-orange-600">
                {formatAmountToCurrency(Number(item.price))}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Note:</strong> Prices are subject to change. Please confirm pricing at the time of booking.
        </p>
      </div>
    </div>
  );
};

export default ServicePricing;

