import React from 'react';
import { FiMessageCircle } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

const ChatIcon = ({ job, className = "" }) => {
    const router = useRouter();
    const { data: session } = useSession();

    const handleChatClick = () => {
        // Redirect to chat page based on user role
        const role = session?.user?.role;
        let chatPath = '/customer/chats'; // default fallback
        
        if (role === 'admin') {
            chatPath = '/admin-chats';
        } else if (role === 'provider') {
            chatPath = '/provider/chats';
        } else if (role === 'visitor') {
            chatPath = '/customer/chats';
        }
        
        router.push(`${chatPath}?chatId=${job.chatId}`);
    };

    // Show chat icon only for jobs with status "open" and have chatId
    if (job?.status !== 'open' || !job?.chatId) {
        return null;
    }

    return (
        <button
            onClick={handleChatClick}
            className={`relative p-2 rounded-full transition-colors text-blue-600 hover:bg-blue-50 hover:text-blue-700 ${className}`}
            title="Open chat"
        >
            <FiMessageCircle className="w-5 h-5" />
            
            {/* Unread message indicator */}
            {job.unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            )}
        </button>
    );
};

export default ChatIcon;