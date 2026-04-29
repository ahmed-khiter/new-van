import { useState, useCallback } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { signOut } from "next-auth/react";
import { toast } from "react-hot-toast";
import { useLocale } from "next-intl";

export function useOnBoard() {
    const [isNewUser, setIsNewUser] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const locale = useLocale();

    const handleLanguageChange = useCallback((newLocale) => {
        // Get the current URL path
        const currentPath = window.location.pathname;
        let newPath;
        
        // Handle URL construction based on locale prefix configuration
        if (newLocale === 'en') {
            // English is default locale, remove any locale prefix
            if (currentPath.startsWith('/tr/') || currentPath.startsWith('/el/')) {
                newPath = currentPath.substring(3); // Remove /tr or /el
            } else if (currentPath === '/tr' || currentPath === '/el') {
                newPath = '/';
            } else {
                newPath = currentPath;
            }
        } else {
            // For non-default locales (tr, el)
            if (currentPath.startsWith('/tr/') || currentPath.startsWith('/el/')) {
                // Replace existing locale with new one
                newPath = currentPath.replace(/^\/[^\/]+/, `/${newLocale}`);
            } else if (currentPath === '/tr' || currentPath === '/el') {
                // Replace root locale
                newPath = `/${newLocale}`;
            } else {
                // Add locale prefix to path
                newPath = `/${newLocale}${currentPath}`;
            }
        }
        
        // Navigate to the new URL
        window.location.href = newPath;
    }, []);

    const checkOnBoardStatus = useCallback(async () => {
        try {
            const profileResponse = await fetch("/api/profile");
            if (!profileResponse.ok) {
                throw new Error("Failed to fetch user data");
            }

            const profileData = await profileResponse.json();
            const { isFirstTime, role, preferredLocale, address1, latitude, longitude } = profileData.profile;

            // Handle language preference for service providers
            if (role === "provider" && preferredLocale && preferredLocale !== locale) {
                handleLanguageChange(preferredLocale);
                return; // Don't continue with other redirects, let language redirect happen first
            }

            // Only show onboarding for first-time users
            if (isFirstTime) {
                // Check if user needs address setup (for all user types)

                if (role === "provider") {
                    // After address setup, continue with provider-specific onboarding
                    if (pathname !== "/looking-to-provide") {
                        router.replace("/looking-to-provide");
                    }
                    setIsNewUser(true);
                } else {
                    // For shop owners and customers with complete address, go to dashboard
                    let target;
                    if (role === "visitor") {
                        target = "/customer/jobs";
                    } else if (role === "team-member" || role === "affiliate") {
                        target = "/admin-dashboard"; // Team members and affiliates use admin dashboard
                    } else if (role === "restaurant") {
                        target = "/restaurant/dashboard";
                    } else if (role === "shop-owner") {
                        target = "/shop/dashboard";
                    } else if (role === "provider") {
                        target = "/provider/dashboard";
                    } else {
                        target = `/${role}-dashboard`;
                    }
                    
                    if (pathname !== target) {
                        router.replace(target);
                    }
                }
            } else {
                // For returning users, go directly to their dashboard
                let target;
                if (role === "visitor") {
                    target = "/customer/jobs";
                } else if (role === "team-member" || role === "affiliate") {
                    target = "/admin-dashboard"; // Team members and affiliates use admin dashboard
                } else if (role === "restaurant") {
                    target = "/restaurant/dashboard";
                } else if (role === "shop-owner") {
                    target = "/shop/dashboard";
                } else if (role === "provider") {
                    target = "/provider/dashboard";
                } else {
                    target = `/${role}-dashboard`;
                }
                
                if (pathname !== target) {
                    router.replace(target);
                }
            }
        } catch (error) {
            toast.error(error.message || "An unexpected error occurred");
            console.error("Error in checkOnBoardStatus:", error);
            await signOut({ redirect: false });
            // Redirect to default language (English) without locale prefix
            window.location.href = "/login";
        }
    }, [router, pathname, locale, handleLanguageChange]);

    return { isNewUser, checkOnBoardStatus };
}
