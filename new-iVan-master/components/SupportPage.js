"use client";
import Image from "next/image";
import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import toast from "react-hot-toast";
import { BsFillTelephoneFill, BsChatDotsFill } from "react-icons/bs";
import { MdEmail } from "react-icons/md";
import FaqCard from "@/components/Profile/FaqCard";

/**
 * Reusable Support Page Component
 * @param {Object} props
 * @param {string} props.translationNamespace - The translation namespace (e.g., "ProviderPages.support", "VisitorPages.support")
 * @param {boolean} props.showPageTitle - Whether to show the page title header (default: true)
 * @param {Array} props.customFaq - Optional custom FAQ items to override default ones
 * @param {string} props.chatPath - The path to navigate to for live chat (e.g., "/customer/chats")
 */
export default function SupportPage({ 
    translationNamespace = "VisitorPages.support",
    showPageTitle = true,
    customFaq = null,
    chatPath = "/customer/chats"
}) {
    const router = useRouter();
    const t = useTranslations(translationNamespace);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isHoveringPhone, setIsHoveringPhone] = useState(false);
    const [isHoveringEmail, setIsHoveringEmail] = useState(false);
    const [phoneText, setPhoneText] = useState(t("text_us"));
    const [emailText, setEmailText] = useState(t("email_us"));

    const handlePhoneClick = (phoneNumber, setText) => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            window.location.href = `tel:${phoneNumber}`;
        } else {
            navigator.clipboard.writeText(phoneNumber)
                .then(() => {
                    toast.success(t("phone_copied_success"));
                    setText(t("copied"));
                    setTimeout(() => setText(t("text_us")), 2000);
                })
                .catch(() => toast.error(t("failed_copy_phone")));
        }
    };

    const handleMouseEnter = (setIsHovering) => {
        setIsHovering(true);
    };

    const handleMouseLeave = (setIsHovering, setText, defaultText) => {
        setIsHovering(false);
        setText(defaultText);
    };

    // Default FAQ items - can be overridden with customFaq prop
    const defaultFaq = [
        {
            question: t("faq.how_get_paid.question"),
            answer: t("faq.how_get_paid.answer"),
        },
        {
            question: t("faq.verification_time.question"),
            answer: t("faq.verification_time.answer"),
        },
        {
            question: t("faq.required_documents.question"),
            answer: t("faq.required_documents.answer"),
        },
        {
            question: t("faq.restricted_accounts.question"),
            answer: t("faq.restricted_accounts.answer"),
        },
        {
            question: t("faq.missed_job.question"),
            answer: t("faq.missed_job.answer"),
        },
        {
            question: t("faq.contact_team.question"),
            answer: t("faq.contact_team.answer"),
        },
    ];

    const faq = customFaq || defaultFaq;

    return (
        <div className="min-h-screen py-4">
            {showPageTitle && (
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-12">
                            <h1 className="text-2xl font-semibold text-gray-800 mb-4">{t("title")}</h1>
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Image Section */}
            <div className="max-w-6xl mx-auto p-6 relative h-72 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <Image
                        src="/assets/img/help.jpg"
                        alt="Help Center"
                        fill
                        className="object-cover rounded-md"
                        onLoad={() => setImageLoaded(true)}
                    />
                </div>
                <div className="relative z-10 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">{t("help_center")}</h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto py-10">
                {/* FAQ Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-10">{t("frequently_asked_questions")}</h2>
                    <div className="space-y-3">
                        {faq.map((item, index) => (
                            <FaqCard key={index} item={item} />
                        ))}
                    </div>
                </div>

                {/* Contact Options */}
                <div className="grid md:grid-cols-3 gap-4">
                    {/* Phone Contact */}
                    <div
                        onMouseEnter={() => handleMouseEnter(setIsHoveringPhone)}
                        onMouseLeave={() => handleMouseLeave(setIsHoveringPhone, setPhoneText, t("text_us"))}
                        onClick={() => handlePhoneClick("02035351953", setPhoneText)}
                        className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-blue-50 hover:border-blue-200 group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                                <BsFillTelephoneFill size={24} className="text-blue-600" />
                            </div>
                            <div>
                                <h5 className="font-medium text-gray-800 mb-1">{t("phone_support")}</h5>
                                <span className="text-sm text-gray-600">
                                    {isHoveringPhone ? "02035351953" : phoneText}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Email Contact */}
                    <div
                        onClick={() => window.location.href = "mailto:update@ivanplatform.com"}
                        onMouseEnter={() => handleMouseEnter(setIsHoveringEmail)}
                        onMouseLeave={() => handleMouseLeave(setIsHoveringEmail, setEmailText, t("email_us"))}
                        className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-green-50 hover:border-green-200 group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                                <MdEmail size={24} className="text-green-600" />
                            </div>
                            <div>
                                <h5 className="font-medium text-gray-800 mb-1">{t("email_support")}</h5>
                                <span className="text-sm text-gray-600">
                                    {isHoveringEmail ? "update@ivanplatform.com" : emailText}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Live Chat */}
                    <div
                        onClick={() => router.push(chatPath)}
                        className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-md hover:bg-purple-50 hover:border-purple-200 group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                                <BsChatDotsFill size={24} className="text-purple-600" />
                            </div>
                            <div>
                                <h5 className="font-medium text-gray-800 mb-1">{t("live_chat")}</h5>
                                <span className="text-sm text-gray-600">
                                    {t("chat_with_us")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
