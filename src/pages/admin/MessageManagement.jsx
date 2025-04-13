// pages/admin/MessageManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import { format } from 'date-fns';

const MessageManagement = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get('/api/admin/messages');
        setMessages(response.data.messages);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages. Please try again later.');
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/admin/messages/${id}`);
      setMessages(messages.map(msg => 
        msg._id === id ? { ...msg, isRead: true } : msg
      ));
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const deleteMessage = async (id) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await axios.delete(`/api/admin/messages/${id}`);
        setMessages(messages.filter(msg => msg._id !== id));
        if (selectedMessage && selectedMessage._id === id) {
          setSelectedMessage(null);
        }
      } catch (err) {
        console.error('Error deleting message:', err);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Message Management</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Message List Panel */}
            <div className="md:col-span-1 bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <h2 className="text-lg font-medium">Messages ({messages.length})</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {messages.filter(m => !m.isRead).length} unread
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
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${!message.isRead ? 'bg-blue-50' : ''} ${selectedMessage && selectedMessage._id === message._id ? 'bg-gray-100' : ''}`}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (!message.isRead) markAsRead(message._id);
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className={`text-sm font-medium ${!message.isRead ? 'font-bold' : ''}`}>
                          {message.subject || 'No Subject'}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {format(new Date(message.createdAt), 'MMM d')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {message.fullName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {message.message.substring(0, 60)}...
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
                    <h2 className="text-xl font-medium">{selectedMessage.subject || 'No Subject'}</h2>
                    <button 
                      onClick={() => deleteMessage(selectedMessage._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-sm"><strong>From:</strong> {selectedMessage.fullName}</p>
                    <p className="text-sm"><strong>Email:</strong> {selectedMessage.email}</p>
                    <p className="text-sm"><strong>Date:</strong> {format(new Date(selectedMessage.createdAt), 'MMMM d, yyyy h:mm a')}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                  
                  <div className="mt-6">
                    <a 
                      href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
                    >
                      Reply via Email
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Select a message to view details
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default MessageManagement;