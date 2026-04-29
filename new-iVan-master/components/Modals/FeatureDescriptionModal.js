"use client";
import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';

const FeatureDescriptionModal = ({ service = null }) => {
  const t = useTranslations('FeatureDescriptionModal');
  const [selectedFeature, setSelectedFeature] = useState(null);

  const getServiceIcon = (serviceName) => {
    if (!serviceName) return "fa-truck";
    const serviceIconMap = {
      'Van': 'fa-truck',
      'Courier': 'fa-truck',
      'Recovery': 'fa-truck-pickup',
      'Breakdown Assistance': 'fa-car',
      'Click & Collect': 'fa-shopping-bag',
      'Click & Collect Delivery': 'fa-shopping-bag',
      'Cleaning': 'fa-bath',
      "Lock & Key Replacement": 'fa-lock',
      'Professional Cleaning': 'fa-bath',
      'Removals': 'fa-box',
      'Rubbish Removals': 'fa-recycle',
      'Rubbish removals': 'fa-recycle',
      'Locksmith': 'fa-unlock',
      'Car key replacement': 'fa-key',
      'Mobile car key replacement': 'fa-key',
      'Luggage Storage': 'fa-suitcase',
      'Dry Cleaning Pick-Up': 'fa-shirtsinbulk',
      'Stores': 'fa-store',
      'Restaurants': 'fa-utensils',
      'Supermarkets': 'fa-shopping-cart',
    };
    
    return serviceIconMap[serviceName] || "fa-truck";
  };

  const getServiceDescription = (serviceName) => {
    if (!serviceName) {
      return t('defaultDescription');
    }
    
    const normalizedName = serviceName?.trim() || '';
    const lowerName = normalizedName.toLowerCase();
    
    const serviceKeyMap = {
      'Courier': 'descriptions.courier',
      'Van': 'descriptions.van',
      'Luggage Storage': 'descriptions.luggageStorage',
      'Locksmith': 'descriptions.locksmith',
      'Professional Cleaning': 'descriptions.professionalCleaning',
      'Cleaning': 'descriptions.cleaning',
      'Dry Cleaning Pick-Up': 'descriptions.dryCleaningPickUp',
      'Breakdown Assistance': 'descriptions.breakdownAssistance',
      'Recovery': 'descriptions.recovery',
      'Rubbish Removals': 'descriptions.rubbishRemovals',
      'Rubbish removals': 'descriptions.rubbishRemovals',
      'Removals': 'descriptions.removals',
      'Click & Collect Delivery': 'descriptions.clickCollectDelivery',
      'Click & Collect': 'descriptions.clickCollect',
    };
    
    if (serviceKeyMap[normalizedName]) {
      return t(serviceKeyMap[normalizedName]);
    }
    
    for (const [key, translationKey] of Object.entries(serviceKeyMap)) {
      if (key.toLowerCase() === lowerName) {
        return t(translationKey);
      }
    }
    
    for (const [key, translationKey] of Object.entries(serviceKeyMap)) {
      const keyLower = key.toLowerCase();
      if (lowerName.includes(keyLower) || keyLower.includes(lowerName)) {
        return t(translationKey);
      }
    }
    return t('defaultDescription');
  };

  const features = useMemo(() => ({
    howItWorks: {
      key: 'howItWorks',
      label: t('features.howItWorks.label'),
      icon: "fa-check-circle",
      description: t('features.howItWorks.description')
    },
    scheduled: {
      key: 'scheduled',
      label: t('features.scheduled.label'),
      icon: "fa-calendar",
      description: t('features.scheduled.description')
    },
    emergency: {
      key: 'emergency',
      label: t('features.emergency.label'),
      icon: "fa-clock-o",
      description: t('features.emergency.description')
    },
    monthly: {
      key: 'monthly',
      label: t('features.monthly.label'),
      icon: "fa-calendar",
      description: t('features.monthly.description')
    },
    trusted: {
      key: 'trusted',
      label: t('features.trusted.label'),
      icon: "fa-check",
      description: t('features.trusted.description')
    },
    about: {
      key: 'about',
      label: t('features.about.label'),
      icon: getServiceIcon(service),
      description: getServiceDescription(service)
    }
  }), [t, service]);

  const featureList = [
    [features.howItWorks, features.scheduled],
    [features.emergency, features.monthly],
    [features.trusted, features.about]
  ];

  const handleFeatureClick = (feature) => {
    setSelectedFeature(feature.key);
  };

  const handleClose = () => {
    setSelectedFeature(null);
  };

  const selectedFeatureData = selectedFeature ? features[selectedFeature] : null;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-2 sm:p-4 mb-2">
        <div className="mt-2 grid grid-cols-2 gap-x-1 ">
          {featureList[0].map((feature) => (
            <div className="flex items-start">
              <i
                className={`fa ${feature.icon} text-success me-[5px]`}
                style={
                  feature.icon === "fa-shirtsinbulk"
                    ? { marginRight: "5px" }
                    : {}
                }
                aria-hidden="true"
              ></i>
              <span
                key={feature.key}
                className="text-[11px] text-gray-600 font-bold underline cursor-pointer"
                onClick={() => handleFeatureClick(feature)}
              >
                {feature.label}
              </span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-x-1 my-3">
          {featureList[1].map((feature, index) => (
            <div className="flex items-start">
              <i
                className={`fa ${feature.icon} text-success me-[5px]`}
                style={
                  feature.icon === "fa-shirtsinbulk"
                    ? { marginRight: "5px" }
                    : {}
                }
                aria-hidden="true"
              ></i>
              <span
                key={feature.key}
                className={`text-[11px] text-gray-600 font-bold underline cursor-pointer ${
                  index === 1 ? "mr-[17px]" : ""
                }`}
                onClick={() => handleFeatureClick(feature)}
              >
                {feature.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mb-2 grid grid-cols-2 gap-x-1 ">
          {featureList[2].map((feature, index) => (
            <div className="flex items-start">
              <i
                className={`fa ${feature.icon} text-success me-[5px]`}
                style={
                  feature.icon === "fa-shirtsinbulk"
                    ? { marginRight: "5px" }
                    : {}
                }
                aria-hidden="true"
              ></i>
              <span
                key={feature.key}
                className={`text-[11px] text-gray-600 font-bold underline cursor-pointer break-words `}
                onClick={() => handleFeatureClick(feature)}
              >
                {feature.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {selectedFeatureData && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl relative z-[10000] animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#00483D] text-white p-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  <i
                    className={`fa ${selectedFeatureData.icon} text-white me-2`}
                    style={
                      selectedFeatureData.icon === "fa-shirtsinbulk"
                        ? { marginRight: "5px" }
                        : {}
                    }
                    aria-hidden="true"
                  ></i>
                  {selectedFeatureData.label}
                </h3>
                <button
                  onClick={handleClose}
                  className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white/10 rounded-full"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 pb-6">
              <p className="text-gray-600 leading-relaxed">
                {selectedFeatureData.description
                  .split("\n")
                  .map((line, index, array) => {
                    // Check if line starts with a number followed by a period (e.g., "1. ", "2. ")
                    const isNumberedItem = /^\d+\.\s/.test(line);
                    return (
                      <span key={index}>
                        {isNumberedItem ? (
                          <span className="font-bold">{line}</span>
                        ) : (
                          line
                        )}
                        {index < array.length - 1 && <br />}
                      </span>
                    );
                  })}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FeatureDescriptionModal;
