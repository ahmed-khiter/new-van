'use client'

import { useOnBoard } from "@/lib/hooks/useOnBoard";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/routing";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

const OnBoardLayout = ({ children }) => {
    const t = useTranslations("OnBoardPages.layout");
    const { data: session, status } = useSession();
    const router = useRouter();
    const { isNewUser, checkOnBoardStatus } = useOnBoard();

    useEffect(() => {
        const runCheck = async () => {
            if (status === "loading") return;
            if (!session) {
                router.replace("/login");
                return;
            }
            await checkOnBoardStatus();
        };

        runCheck();
    }, []);

    return (
        <div className="container-fluid px-0">
            <header id="header" className="header d-flex align-items-center">
                <div className="d-flex align-items-center justify-content-between">
                    <Link href="/looking-to-provide" className="logo d-flex align-items-center">
                        <img src="/assets/img/logo.png" alt="Logo" />
                    </Link>
                </div>
            </header>

            <div className="container py-4">
                {isNewUser ? (
                    <>
                        {children}
                    </>
                ) : (
                    <div className="text-center mt-5">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">{t("loading")}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnBoardLayout;
