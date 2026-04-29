'use client'
import ConfirmationDialog from "../Modals/ConfirmationModal";
import { fullDateFormate } from "../../utils/helper";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaCreditCard } from "react-icons/fa";

// Card Brand Icon Component
const CardBrandIcon = ({ brand, className = "" }) => {
  const brandLower = brand?.toLowerCase() || "";
  
  if (brandLower === "visa") {
    return (
      <svg 
        className={className}
        width="32" 
        height="20" 
        viewBox="0 0 36 22" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect width="36" height="22" rx="2" fill="#1434CB"/>
        <text x="18" y="15" fontSize="12" fontWeight="bold" fill="white" textAnchor="middle" fontFamily="Arial, sans-serif">VISA</text>
      </svg>
    );
  }
  
  if (brandLower === "mastercard" || brandLower === "master") {
    return (
      <svg 
        className={className}
        width="32" 
        height="20" 
        viewBox="0 0 36 22" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <rect width="36" height="22" rx="2" fill="#EB001B"/>
        <circle cx="12" cy="11" r="6" fill="#F79E1B"/>
        <circle cx="24" cy="11" r="6" fill="#FF5F00"/>
        <path d="M18 6C16.2 7.5 15.2 8.5 15.2 11C15.2 13.5 16.2 14.5 18 16C19.8 14.5 20.8 13.5 20.8 11C20.8 8.5 19.8 7.5 18 6Z" fill="#FF5F00"/>
      </svg>
    );
  }
  
  // Default credit card icon for other brands
  return <FaCreditCard className={`text-gray-600 ${className}`} />;
};

function WalletCard(props) {
    const {
        card,
        selected,
        onSelect,
        handleDeleteCard,
        isShowDelete, cards
    } = props;
    const [isOpenConfirmation, setIsOpenConfirmation] = useState(false)

    const handleOpenDelConfirm = () => {
        if (cards?.length === 1) {
            toast.error("You must have at least one payment card saved.");
            return;
        }

        // Check if card is default (can be true, 1, or checked via selected)
        const isDefault = card?.default === true || card?.default === 1 || selected?.id === card?.id;
        if (isDefault) {
            toast.error("You can't delete default card. Set a different one as default first.");
            return;
        }

        setIsOpenConfirmation(true);
    };

    const handleCloseConfirmation = () => {
        setIsOpenConfirmation(false);
    };

    const handleConfirmDelete = () => {
        setIsOpenConfirmation(false);
        handleDeleteCard(card);
    };

    const handleCheckOut = (e) => {
        if (e.target.checked) {
            onSelect(card);
        }
    };


    return (
        <>
            <div className="bg-white rounded-sm sm:rounded-md lg:rounded-lg shadow-sm border border-gray-200 p-2 sm:p-3 md:p-4 lg:p-5 mb-2 sm:mb-3 lg:mb-4 hover:shadow-md transition-all duration-200 w-full max-w-full">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-1">
                    {/* Left Section: Radio + Card Info */}
                    <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-3 lg:space-x-4">
                        <input
                            type="radio"
                            className="flex-shrink-0 text-blue-600 cursor-pointer"
                            checked={selected?.id === card?.id}
                            onChange={handleCheckOut} 
                        />
                        <div className="flex flex-col md:flex-row md:items-center md:space-x-0">
                            <span className="text-xs sm:text-sm md:text-sm lg:text-base font-medium text-gray-900 truncate md:truncate-none flex items-center gap-2">
                                <CardBrandIcon brand={card?.cardBrand} />
                                ****** {card?.lastFourDigit || card?.lastFourDigits || '****'}
                            </span>
                        </div>
                    </div>

                    {/* Right Section: Date, Default Badge, Delete Button */}
                    <div className="flex items-center justify-between md:justify-end md:space-x-3 lg:space-x-6">
                        <span className="text-xs sm:text-sm md:text-sm lg:text-base text-gray-500 truncate md:truncate-none">
                            {fullDateFormate(card?.createdAt)}
                        </span>
                        {(card?.default === true || card?.default === 1) && (
                            <span className="text-xs sm:text-sm md:text-sm lg:text-base text-green-600 font-semibold">
                                Default
                            </span>
                        )}
                        {isShowDelete && (
                            <button 
                                className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 lg:px-5 lg:py-2.5 text-xs sm:text-sm md:text-sm lg:text-base text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors duration-200 flex-shrink-0" 
                                onClick={handleOpenDelConfirm}
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmationDialog
                isOpen={isOpenConfirmation}
                onClose={handleCloseConfirmation}
                handleConfirm={handleConfirmDelete}
                alertMessage={"Are you sure you want to delete this card?"}
            />
        </>
    );
}

export default WalletCard;
