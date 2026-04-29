"use client";
import ChatPage from "@/components/ChatPage";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function VisitorChatsPage() {
    const searchParams = useSearchParams();
    const chatId = searchParams.get('chatId');
    const t = useTranslations("VisitorPages.chats");

    return (
        <>
            <div className="pagetitle">
                <h1>Chats</h1>
                {/* <nav>
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                            <Link href="/customer/dashboard">Home</Link>
                        </li>
                        <li className="breadcrumb-item active">Chats</li>
                    </ol>
                </nav> */}
            </div>
            <section className="section">
                <ChatPage chatId={chatId} />
            </section>
        </>
    );
}

