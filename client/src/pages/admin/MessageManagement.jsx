// pages/admin/MessageManagement.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import AdminLayout from "./AdminLayout";
import { format } from "date-fns";

const MessageManagement = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Use the centralized api instance from AuthContext
  const { api, currentUser, isAdmin } = useAuth();

  // Check authentication
  useEffect(() => {
    if (!currentUser || !isAdmin()) {
      setError("Unauthorized access. Admin privileges required.");
      setLoading(false);
      return;
    }
  }, [currentUser, isAdmin]);

  useEffect(() => {
    const fetchMessages = async () => {
      // Don't fetch if not authenticated as admin
      if (!currentUser || !isAdmin()) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("Fetching messages from API...");

        // Use the centralized api instance - it handles auth headers automatically
        const response = await api.get("/messages/admin/all");

        console.log("Messages response:", response.data);

        // Handle both response formats
        const messagesData = response.data.messages || response.data;
        const messageArray = Array.isArray(messagesData) ? messagesData : [];

        console.log("Processed messages:", messageArray);
        setMessages(messageArray);
      } catch (err) {
        console.error("Error fetching messages:", err);

        if (err.response?.status === 401) {
          setError("Authentication failed. Please log in again.");
        } else if (err.response?.status === 403) {
          setError("Access denied. Admin privileges required.");
        } else if (err.response?.status === 404) {
          setError(
            "Messages endpoint not found. Please check your backend configuration."
          );
        } else {
          setError(
            err.response?.data?.message ||
              "Failed to load messages. Please try again later."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [currentUser, isAdmin, api]);

  const markAsRead = async (id) => {
    try {
      console.log("Marking message as read:", id);

      // Use the centralized api instance
      await api.put(`/messages/admin/read/${id}`);

      setMessages(
        messages.map((msg) => (msg._id === id ? { ...msg, isRead: true } : msg))
      );

      // Update selected message if it's the one being marked as read
      if (selectedMessage && selectedMessage._id === id) {
        setSelectedMessage({ ...selectedMessage, isRead: true });
      }
    } catch (err) {
      console.error("Error marking message as read:", err);
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
      } else {
        setError("Failed to mark message as read. Please try again.");
      }
    }
  };

  const deleteMessage = async (id) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        console.log("Deleting message:", id);

        // Use the centralized api instance
        await api.delete(`/messages/admin/delete/${id}`);

        setMessages(messages.filter((msg) => msg._id !== id));
        if (selectedMessage && selectedMessage._id === id) {
          setSelectedMessage(null);
        }

        console.log("Message deleted successfully");
      } catch (err) {
        console.error("Error deleting message:", err);
        if (err.response?.status === 401) {
          setError("Authentication failed. Please log in again.");
        } else {
          setError(
            err.response?.data?.message ||
              "Failed to delete message. Please try again."
          );
        }
      }
    }
  };

  // Show loading state
  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Message Management</h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Message Management</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button
              onClick={() => window.location.reload()}
              className="ml-4 text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Message Management</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Message List Panel */}
          <div className="md:col-span-1 bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-medium">
                Messages ({messages.length})
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {messages.filter((m) => !m.isRead).length} unread
              </p>
            </div>

            <div className="divide-y max-h-[600px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No messages found
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message._id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !message.isRead ? "bg-blue-50" : ""
                    } ${
                      selectedMessage && selectedMessage._id === message._id
                        ? "bg-gray-100"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedMessage(message);
                      if (!message.isRead) markAsRead(message._id);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <h3
                        className={`text-sm font-medium ${
                          !message.isRead ? "font-bold" : ""
                        }`}
                      >
                        {message.subject || "No Subject"}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {format(new Date(message.createdAt), "MMM d")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {message.fullName || message.name || "Unknown Sender"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {message.message && message.message.length > 60
                        ? `${message.message.substring(0, 60)}...`
                        : message.message || "No message content"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Message Detail Panel */}
          <div className="md:col-span-2 bg-white rounded-lg shadow">
            {selectedMessage ? (
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-medium">
                    {selectedMessage.subject || "No Subject"}
                  </h2>
                  <button
                    onClick={() => deleteMessage(selectedMessage._id)}
                    className="text-red-500 hover:text-red-700 px-3 py-1 rounded border border-red-300 hover:border-red-500 transition-colors"
                  >
                    Delete
                  </button>
                </div>

                <div className="mb-6 space-y-2">
                  <p className="text-sm">
                    <strong>From:</strong>{" "}
                    {selectedMessage.fullName ||
                      selectedMessage.name ||
                      "Unknown"}
                  </p>
                  <p className="text-sm">
                    <strong>Email:</strong>{" "}
                    {selectedMessage.email || "No email provided"}
                  </p>
                  {selectedMessage.phone && (
                    <p className="text-sm">
                      <strong>Phone:</strong> {selectedMessage.phone}
                    </p>
                  )}
                  <p className="text-sm">
                    <strong>Date:</strong>{" "}
                    {format(
                      new Date(selectedMessage.createdAt),
                      "MMMM d, yyyy h:mm a"
                    )}
                  </p>
                  <p className="text-sm">
                    <strong>Status:</strong>{" "}
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        selectedMessage.isRead
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {selectedMessage.isRead ? "Read" : "Unread"}
                    </span>
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-sm font-medium mb-2">Message:</h3>
                  <p className="whitespace-pre-wrap text-sm">
                    {selectedMessage.message || "No message content"}
                  </p>
                </div>

                <div className="flex gap-3">
                  {selectedMessage.email && (
                    <a
                      href={`mailto:${selectedMessage.email}?subject=Re: ${
                        selectedMessage.subject || "Your Message"
                      }`}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                      Reply via Email
                    </a>
                  )}
                  {!selectedMessage.isRead && (
                    <button
                      onClick={() => markAsRead(selectedMessage._id)}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <p className="text-lg mb-2">📬</p>
                  <p>Select a message to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default MessageManagement;
