import { useSocket } from "@/lib/hooks/useSocket";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import {
  FiMessageCircle,
  FiPaperclip,
  FiSend,
  FiPlus,
  FiArrowLeft,
  FiCamera,
} from "react-icons/fi";
import FilePreview from "./FilePreview";
import MediaDeviceHandler from "./MediaDeviceHandler";
import { useRouter, useSearchParams } from "next/navigation";
import { getServiceName, getNameInitials, getParticipantProfileImage } from "@/utils/helper";
import Image from "next/image";

const ChatPage = ({ chatId: initialChatId }) => {
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingChats, setLoadingChats] = useState(new Set());
  const [isLoadingActiveChat, setIsLoadingActiveChat] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  // New state for mobile sidebar visibility
  const [showSidebar, setShowSidebar] = useState(true);
  const loadedChats = useRef(new Set());
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const shouldScrollRef = useRef(false);
  const attachmentMenuRef = useRef(null);

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        attachmentMenuRef.current &&
        !attachmentMenuRef.current.contains(event.target)
      ) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const chatIdFromUrl = searchParams.get("chatId") || initialChatId;
    if (chatIdFromUrl && chats.length > 0) {
      const chat = chats.find((c) => c.id === chatIdFromUrl);
      if (chat && chat.id !== selectedChat?.id) {
        setSelectedChat(chat);
        // Hide sidebar on mobile when a chat is selected
        setShowSidebar(false);
      }
    }
  }, [searchParams, initialChatId, chats, selectedChat?.id]);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      if (selectedChat.unreadMessageCount > 0) {
        const timer = setTimeout(
          () => markMessagesAsRead(selectedChat.id),
          100
        );
        return () => clearTimeout(timer);
      }
    }
  }, [selectedChat?.id]);

  useEffect(() => {
    if (shouldScrollRef.current) {
      scrollToBottom();
      shouldScrollRef.current = false;
    }
  }, [selectedChat?.messages]);

  useEffect(() => {
    if (!socket) return;
    const handleMessageReceived = (data) => {
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === data.chatId) {
            const existingMessages = Array.isArray(chat.messages) ? chat.messages : [];
            return {
              ...chat,
              messages: [...existingMessages, data.message],
              unreadMessageCount:
                selectedChat?.id === data.chatId
                  ? chat.unreadMessageCount
                  : chat.unreadMessageCount + 1,
            };
          }
          return chat;
        })
      );
      
      // Dispatch event to update sidebar count
      window.dispatchEvent(new CustomEvent('messageReceived'));
      
      if (selectedChat && data.chatId === selectedChat.id) {
        setSelectedChat((prevSelectedChat) => ({
          ...prevSelectedChat,
          messages: [...(Array.isArray(prevSelectedChat.messages) ? prevSelectedChat.messages : []), data.message],
        }));
        shouldScrollRef.current = true;
      }
    };

    const handleUnreadUpdate = (data) => {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === data.chatId
            ? { ...chat, unreadMessageCount: data.unreadCount }
            : chat
        )
      );
    };

    socket.on("message-received", handleMessageReceived);
    socket.on("unread-update", handleUnreadUpdate);
    return () => {
      socket.off("message-received", handleMessageReceived);
      socket.off("unread-update", handleUnreadUpdate);
    };
  }, [socket, selectedChat?.id]);

  useEffect(() => {
    if (!socket) return;
    if (selectedChat) socket.emit("join-chat", selectedChat.id);
    return () => {
      if (selectedChat) socket.emit("leave-chat", selectedChat.id);
    };
  }, [socket, selectedChat]);

  const fetchChats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/chats");
      if (response.ok) {
        const chatsData = await response.json();
        setChats((prevChats) => {
          if (prevChats.length === 0) return chatsData;
          const mergedChats = chatsData.map((newChat) => {
            const existingChat = prevChats.find(
              (prevChat) => prevChat.id === newChat.id
            );
            if (existingChat && existingChat.messages) {
              console.log(
                `🔄 Preserving ${existingChat.messages.length} messages for chat ${newChat.id}`
              );
              return { ...newChat, messages: existingChat.messages };
            }
            return newChat;
          });
          return mergedChats;
        });
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    if (loadedChats.current.has(chatId)) {
      console.log(`Chat ${chatId} already fully loaded, skipping fetch`);
      return;
    }
    try {
      console.log(`Fetching messages for chat ${chatId}`);
      setLoadingChats((prev) => new Set(prev).add(chatId));
      const response = await fetch(`/api/chats/${chatId}/messages`);
      if (response.ok) {
        const responseData = await response.json();
        // API returns { messages: [...], deliveryOrderId } or a direct array
        const messagesData = Array.isArray(responseData) ? responseData : (responseData.messages || []);
        console.log(
          `Fetched ${messagesData.length} messages for chat ${chatId}`
        );
        loadedChats.current.add(chatId);
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === chatId ? { ...chat, messages: messagesData } : chat
          )
        );
        setSelectedChat((prevSelectedChat) => ({
          ...prevSelectedChat,
          messages: messagesData,
        }));
        shouldScrollRef.current = true;
        setIsLoadingActiveChat(false);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingChats((prev) => {
        const newSet = new Set(prev);
        newSet.delete(chatId);
        return newSet;
      });
    }
  };

  const markMessagesAsRead = async (chatId) => {
    try {
      await fetch(`/api/chats/${chatId}/mark-read`, { method: "POST" });
      if (socket) socket.emit("mark-as-read", { chatId, unreadCount: 0 });
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId ? { ...chat, unreadMessageCount: 0 } : chat
        )
      );
      
      // Dispatch event to update sidebar count
      window.dispatchEvent(new CustomEvent('messageRead'));
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  const renderMessageContent = (content, isOwn = false) => {
    const googleMapsRegex = /(https:\/\/www\.google\.com\/maps\?q=[^\s]+)/g;
    const parts = content.split(googleMapsRegex);
    return parts.map((part, index) => {
      if (googleMapsRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-sm font-medium transition-colors ${
              isOwn
                ? "bg-blue-200 text-blue-800 hover:bg-blue-300"
                : "bg-gray-300 text-gray-700 hover:bg-gray-300"
            }`}
            title="Click to open in Google Maps"
          >
            <span className="text-sm">📍</span>
            <span>View Location</span>
          </a>
        );
      }
      return part;
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const handleFileRemove = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCameraCapture = (capturedFile) => {
    setSelectedFiles((prev) => [...prev, capturedFile]);
    setShowAttachmentMenu(false);
  };

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}&z=15`;
        const locationMessage = `📍: ${googleMapsLink}`;
        setNewMessage((prev) => prev + (prev ? "\n" : "") + locationMessage);
        setIsGettingLocation(false);
        setShowAttachmentMenu(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Error getting location: " + error.message);
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
    );
  };

  const sendMessage = async () => {
    if (!selectedChat || (!newMessage.trim() && selectedFiles.length === 0))
      return;
    try {
      setIsSending(true);
      const formData = new FormData();
      formData.append("content", newMessage.trim() || "");
      formData.append(
        "messageType",
        selectedFiles.length > 0 ? "file" : "text"
      );
      selectedFiles.forEach((file) => formData.append("files", file));
      const response = await fetch(`/api/chats/${selectedChat.id}/messages`, {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const newMessageData = await response.json();
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === selectedChat.id
              ? {
                  ...chat,
                  messages: [...(Array.isArray(chat.messages) ? chat.messages : []), newMessageData],
                }
              : chat
          )
        );
        setSelectedChat((prevSelectedChat) => ({
          ...prevSelectedChat,
          messages: [...(Array.isArray(prevSelectedChat.messages) ? prevSelectedChat.messages : []), newMessageData],
        }));
        shouldScrollRef.current = true;
        setNewMessage("");
        setSelectedFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (socket) {
          socket.emit("new-message", {
            chatId: selectedChat.id,
            message: newMessageData,
          });
        }
        
        // Dispatch event to update sidebar count
        window.dispatchEvent(new CustomEvent('chatUpdated'));
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleViewJobDetail = () => {
    if (!selectedChat?.job?.id) return;
    const jobId = selectedChat.job.id;
    const role = session?.user?.role;
    let jobDetailPath = "";
    switch (role) {
      case "admin":
        jobDetailPath = `/jobs/view/${jobId}`;
        break;
      case "provider":
        jobDetailPath = `/provider/jobs/${jobId}`;
        break;
      case "visitor":
        jobDetailPath = `/customer/jobs/view/${jobId}`;
        break;
      default:
        jobDetailPath = `/customer/jobs/view/${jobId}`;
    }
    router.push(jobDetailPath);
  };

  const handleChatSelect = (chat) => {
    const latestChat = chats.find((c) => c.id === chat.id) || chat;
    if (!loadedChats.current.has(chat.id)) setIsLoadingActiveChat(true);
    setSelectedChat(latestChat);
    setShowSidebar(false); // Hide sidebar on mobile
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("chatId", chat.id);
    router.replace(currentUrl.pathname + currentUrl.search, { scroll: false });
  };

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery.trim()) return true;
    const chatTitle = chat.type === "support" ? "Admin Support" : (chat.job?.title || "Untitled Job");
    return chatTitle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center w-full h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-3 text-gray-600 text-sm">Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-160px)] bg-gray-100 rounded-lg overflow-hidden shadow-2xl">
      {/* Sidebar - Hidden on mobile when chat is selected */}
      <div
        className={`w-full md:w-1/3 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ${
          showSidebar ? "block" : "hidden md:block"
        }`}
        style={{ 
          height: 'calc(100vh - 160px)',
          maxHeight: 'calc(100vh - 160px)'
        }}
      >
        <div className="p-4 border-b border-gray-200 flex-shrink-0 bg-white">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div 
          className="flex-1 overflow-y-auto chat-sidebar-scroll"
          style={{ 
            minHeight: 0,
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {filteredChats.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              {searchQuery
                ? "No chats found matching your search"
                : "No chats available"}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredChats.map((chat , index) => {
                const participantUser = getParticipantProfileImage(
                  chat.participants, 
                  session?.user?.role, 
                  session?.user?.id
                );
                
                return (
                  <div
                    key={index}
                    onClick={() => handleChatSelect(chat)}
                    className={`py-3 px-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                      selectedChat?.id === chat.id
                        ? "bg-blue-50 border-l-4 border-l-blue-500 shadow-sm"
                        : "hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Profile Image */}
                      <div className="flex-shrink-0">
                        {participantUser?.profilePicture ? (
                          <Image
                            src={`${process.env.NEXT_PUBLIC_AWS_BASE_URL}${participantUser.profilePicture}`}
                            alt={`${participantUser.firstName} ${participantUser.lastName}`}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-200">
                            {getNameInitials(`${participantUser?.firstName} ${participantUser?.lastName}`)}
                          </div>
                        )}
                      </div>
                      
                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {chat.type === "support" ? "Admin Support" : (chat.job?.title || "Untitled Job")}
                          </h3>
                          {chat.unreadMessageCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full shadow-sm ml-2">
                              {chat.unreadMessageCount}
                            </span>
                          )}
                        </div>
                        {chat.messages?.[0] && (
                          <p className="text-xs text-gray-500 truncate mb-0 mt-1">
                            {chat.messages[0].content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area - Hidden on mobile when sidebar is visible */}
      <div
        className={`flex-1 flex flex-col bg-white ${
          selectedChat && !showSidebar ? "block" : "hidden md:block"
        }`}
      >
        {selectedChat ? (
          <>
            {/* Chat Header with Back Button on Mobile */}
            <div className="bg-white border-b border-gray-200 p-2 sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Back Button for Mobile */}
                  <button
                    onClick={() => setShowSidebar(true)}
                    className="md:hidden p-2 text-gray-600 hover:text-gray-800"
                    title="Back to chat list"
                  >
                    <FiArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate mb-0 max-w-[200px] w-full sm:max-w-[400px]">
                      {selectedChat.type === "support" ? "Admin Support" : (selectedChat.job?.title || "Untitled Job")}
                    </h3>
                  </div>
                </div>
                {selectedChat.type !== "support" && (
                  <button
                    onClick={handleViewJobDetail}
                    className="btn btn-sm btn-primary flex items-center gap-2 text-sm"
                    title="View Job Details"
                  >
                    <i className="bi bi-eye"></i>
                    <span className="hidden sm:inline">View Job</span>
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-1"
            >
              {isLoadingActiveChat || loadingChats.has(selectedChat.id) ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : !Array.isArray(selectedChat.messages) ||
                selectedChat.messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8 text-sm">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                selectedChat.messages.map((message, index) => {
                  const isOwn = message.senderId === session?.user?.id;
                  const isSystem = message.messageType === "system";
                  const showDate =
                    index === 0 ||
                    formatDate(selectedChat.messages[index - 1].createdAt) !==
                      formatDate(message.createdAt);
                  const prevMessage =
                    index > 0 ? selectedChat.messages[index - 1] : null;
                  const isFirstInSeries =
                    !prevMessage ||
                    prevMessage.senderId !== message.senderId ||
                    isSystem !== (prevMessage.messageType === "system");
                  const nextMessage =
                    index < selectedChat.messages.length - 1
                      ? selectedChat.messages[index + 1]
                      : null;
                  const isLastInSeries =
                    !nextMessage ||
                    nextMessage.senderId !== message.senderId ||
                    isSystem !== (nextMessage.messageType === "system");

                  return (
                    <div key={message.id}>
                      {showDate && !isSystem && (
                        <div className="text-center text-xs text-gray-500 mb-4">
                          {formatDate(message.createdAt)}
                        </div>
                      )}
                      {isSystem ? (
                        <div className="flex justify-center mb-4">
                          <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-sm font-medium shadow-sm max-w-[80%]">
                            {message.content}
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`flex ${
                            isOwn ? "justify-end" : "justify-start"
                          } ${isFirstInSeries ? "mb-2" : "mb-1"}`}
                        >
                          <div
                            className={`flex ${
                              isOwn ? "flex-row-reverse" : "flex-row"
                            } items-end space-x-2 max-w-[80%] sm:max-w-[70%]`}
                          >
                            {!isOwn && !isSystem && isFirstInSeries && (
                              <div
                                title={`${message.sender?.firstName} ${message.sender?.lastName}`}
                                className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 overflow-hidden"
                              >
                                {message.sender?.profilePictureUrl ? (
                                  <Image
                                    src={message.sender.profilePictureUrl}
                                    alt={`${message.sender?.firstName} ${message.sender?.lastName}`}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover rounded-full"
                                    unoptimized
                                  />
                                ) : (
                                  <span>
                                    {getNameInitials(`${message.sender?.firstName} ${message.sender?.lastName}`)}
                                  </span>
                                )}
                              </div>
                            )}
                            {!isOwn && !isSystem && !isFirstInSeries && (
                              <div className="w-6 h-6 sm:w-8 sm:h-8"></div>
                            )}
                            <div
                              className={`py-2 px-3 rounded-lg ${
                                isOwn
                                  ? `bg-blue-100 text-blue-900 ${
                                      isFirstInSeries
                                        ? "rounded-br-sm"
                                        : "rounded-r-lg"
                                    } ${
                                      isLastInSeries
                                        ? "rounded-tr-sm"
                                        : "rounded-r-lg"
                                    }`
                                  : `bg-gray-100 text-gray-900 ${
                                      isFirstInSeries
                                        ? "rounded-bl-sm"
                                        : "rounded-l-lg"
                                    } ${
                                      isLastInSeries
                                        ? "rounded-tl-sm"
                                        : "rounded-l-lg"
                                    }`
                              }`}
                            >
                              {message.messageType === "file" &&
                              message.metadata?.files ? (
                                <div className="space-y-2">
                                  <FilePreview
                                    files={message.metadata.files}
                                    isMessage={true}
                                  />
                                  {message.content && (
                                    <p className="text-xs sm:text-sm mt-2 mb-0">
                                      {renderMessageContent(
                                        message.content,
                                        isOwn
                                      )}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs sm:text-sm mb-0">
                                  {renderMessageContent(message.content, isOwn)}
                                </p>
                              )}
                            </div>
                            {isLastInSeries && (
                              <div
                                className={`text-[10px] text-gray-500 ${
                                  isOwn ? "mr-2" : "ml-2"
                                }`}
                              >
                                {formatTime(message.createdAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-3 sm:p-4">
              {selectedFiles.length > 0 && (
                <FilePreview
                  files={selectedFiles}
                  onRemove={handleFileRemove}
                  isMessage={false}
                />
              )}
              <div className="flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.txt,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="relative" ref={attachmentMenuRef}>
                  <button
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Add attachment"
                  >
                    <FiPlus className="w-5 h-5" />
                  </button>
                  {showAttachmentMenu && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 w-48 sm:w-56">
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => {
                            fileInputRef.current?.click();
                            setShowAttachmentMenu(false);
                          }}
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        >
                          <FiPaperclip className="w-4 h-4" />
                          <span>File</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowCameraModal(true);
                            setShowAttachmentMenu(false);
                          }}
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        >
                          <FiCamera className="w-4 h-4" />
                          <span>Camera</span>
                        </button>
                        <button
                          onClick={handleLocationClick}
                          disabled={isGettingLocation}
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isGettingLocation ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                          ) : (
                            <span>📍</span>
                          )}
                          <span>Location</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSending}
                />
                <button
                  onClick={sendMessage}
                  disabled={
                    isSending ||
                    (!newMessage.trim() && selectedFiles.length === 0)
                  }
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FiSend className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FiMessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-500 mb-2">
                Select a chat
              </h3>
              <p className="text-sm text-gray-400">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {showCameraModal && (
        <MediaDeviceHandler
          onCapture={handleCameraCapture}
          onClose={() => setShowCameraModal(false)}
        />
      )}
    </div>
  );
};

export default ChatPage;
