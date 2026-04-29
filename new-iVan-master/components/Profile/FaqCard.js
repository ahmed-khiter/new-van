import React, { useState } from "react";
import { FiPlus, FiMinus } from "react-icons/fi";

const FaqCard = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <div className="border border-gray-200 rounded-lg mb-3 overflow-hidden shadow-sm">
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-400 border-b"
                onClick={toggleOpen}
            >
                <h5 className="text-gray-900 font-semibold text-base mb-0 pr-4">
                    {item.question}
                </h5>
                <div className="flex-shrink-0">
                    {isOpen ? (
                        <FiMinus className="text-blue-600 w-5 h-5 transition-transform duration-400" />
                    ) : (
                        <FiPlus className="text-blue-600 w-5 h-5 transition-transform duration-400" />
                    )}
                </div>
            </div>

            {/* Answer with smooth expand */}
            <div
                className={`transition-all bg-[#fff] duration-400 ease-in-out overflow-hidden ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                <div className="px-4 pb-4 pt-3">
                    <p className="text-gray-600 text-sm leading-relaxed mb-0">
                        {item.answer}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FaqCard;
