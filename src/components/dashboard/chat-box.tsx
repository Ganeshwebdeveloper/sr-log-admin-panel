"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Image, Mic } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Database } from '@/types/supabase';
import { useAuth } from '@/components/auth/auth-provider';

// Extend the Message type for optimistic updates
type Message = Database['public']['Tables']['messages']['Row'] & {
  is_optimistic?: boolean;
};

export function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = supabaseBrowser;
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to fetch initial messages
  const fetchInitialMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      setMessages(data.map(msg => ({ ...msg, is_optimistic: false }))); // Mark all fetched messages as not optimistic
    } catch (error: any) {
      toast.error(`Failed to fetch messages: ${error.message}`);
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchInitialMessages(); // Fetch messages on initial load

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        console.log('Realtime message received!', payload);
        const incomingMessage = payload.new as Message;

        setMessages((prevMessages) => {
          // 1. Check if a message with this actual Supabase ID already exists.
          // This handles cases where the message might have been added by another means
          // or if the Realtime event is somehow duplicated.
          if (prevMessages.some(msg => msg.id === incomingMessage.id)) {
            return prevMessages; // Message already exists, ignore to prevent duplicates
          }

          // 2. Try to find and replace an optimistic message from this client.
          // We match by sender and message content, assuming a user won't send the exact same message twice very quickly.
          const optimisticMessageIndex = prevMessages.findIndex(
            (msg) => msg.is_optimistic &&
                     msg.sender === incomingMessage.sender &&
                     msg.message === incomingMessage.message
          );

          if (optimisticMessageIndex > -1) {
            // If an optimistic message is found, replace it with the real message from Supabase
            const updatedMessages = [...prevMessages];
            updatedMessages[optimisticMessageIndex] = { ...incomingMessage, is_optimistic: false };
            return updatedMessages;
          } else {
            // If no matching optimistic message, it's a new message from another client.
            return [...prevMessages, { ...incomingMessage, is_optimistic: false }];
          }
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInitialMessages, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    const senderId = user?.id || 'admin';
    const now = new Date().toISOString();
    const clientTempId = crypto.randomUUID(); // Client-generated temporary ID for optimistic display

    // Optimistic update: Add message to state immediately
    const optimisticMessage: Message = {
      id: clientTempId, // Use client-generated ID for immediate display
      sender: senderId,
      message: messageContent,
      type: 'text',
      created_at: now,
      file_url: null,
      is_optimistic: true, // Mark as optimistic
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage(''); // Clear input immediately

    try {
      // Insert into Supabase. The Realtime listener will then receive this message
      // with its actual Supabase-generated ID and replace the optimistic one.
      const { error } = await supabase.from('messages').insert({
        sender: senderId,
        message: messageContent,
        type: 'text',
      });

      if (error) {
        toast.error(`Failed to send message: ${error.message}`);
        console.error('Error sending message:', error);
        // Revert optimistic update if insertion fails
        setMessages((prev) => prev.filter((msg) => msg.id !== clientTempId));
        setNewMessage(messageContent); // Restore message to input
      }
    } catch (error: any) {
      toast.error(`Failed to send message: ${error.message}`);
      console.error('Error sending message:', error);
      // Revert optimistic update if insertion fails
      setMessages((prev) => prev.filter((msg) => msg.id !== clientTempId));
      setNewMessage(messageContent); // Restore message to input
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'voice') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const senderId = user?.id || 'admin';
    const now = new Date().toISOString();
    const clientTempId = crypto.randomUUID();

    // Optimistic update for file upload
    const optimisticMessage: Message = {
      id: clientTempId,
      sender: senderId,
      message: `Uploading ${type}...`, // Placeholder message
      type: type,
      created_at: now,
      file_url: URL.createObjectURL(file), // Temporary URL for immediate display
      is_optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        throw new Error('No access token found for file upload.');
      }

      const response = await fetch('/api/upload-chat-file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-file-name': file.name,
          'x-file-type': file.type,
        },
        body: file,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'File upload failed');
      }

      const { fileUrl } = await response.json();

      // Insert message with the public URL
      const { error } = await supabase.from('messages').insert({
        sender: senderId,
        message: type === 'image' ? 'Image shared' : 'Voice note shared',
        type: type,
        file_url: fileUrl,
      });

      if (error) {
        throw error;
      }
      toast.success(`${type === 'image' ? 'Image' : 'Voice note'} sent successfully!`);

    } catch (error: any) {
      toast.error(`Failed to upload ${type}: ${error.message}`);
      console.error('Error uploading file:', error);
      // Revert optimistic update if upload fails
      setMessages((prev) => prev.filter((msg) => msg.id !== clientTempId));
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear file input
      }
    }
  };

  const triggerFileInput = (type: 'image' | 'voice') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'image' ? 'image/*' : 'audio/*';
      fileInputRef.current.dataset.fileType = type; // Store type for handler
      fileInputRef.current.click();
    }
  };

  return (
    <Card className="bg-card border border-gray-300 dark:border-gray-700 lg:col-span-1 flex flex-col">
      <CardHeader>
        <CardTitle className="text-gray-800 dark:text-gray-200">Voice/Chat Box</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 p-4 pt-0">
        <ScrollArea className="flex-1 h-[250px] w-full rounded-md border border-gray-300 dark:border-gray-700 p-2 mb-4">
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-gray-500 dark:text-gray-400">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400">No messages yet.</div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id} // Use the message ID (temp or real) for key
                  className={`flex ${msg.sender === (user?.id || 'admin') ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={
                      `max-w-[70%] p-3 rounded-lg text-sm ` +
                      (msg.sender === (user?.id || 'admin')
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600' // Admin message style
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700') // Driver message style
                    }
                  >
                    <p className="font-semibold text-xs mb-1">
                      {msg.sender === (user?.id || 'admin') ? 'You (Admin)' : `Driver ${msg.sender}`}
                    </p>
                    {msg.type === 'text' && <p>{msg.message}</p>}
                    {msg.type === 'image' && msg.file_url && (
                      <img src={msg.file_url} alt="Chat Image" className="max-w-full h-auto rounded-md" />
                    )}
                    {msg.type === 'voice' && msg.file_url && (
                      <audio controls src={msg.file_url} className="w-full"></audio>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                      {new Date(msg.created_at!).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-400 focus:ring-gray-500 dark:focus:ring-gray-400"
            disabled={loading}
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e, fileInputRef.current?.dataset.fileType as 'image' | 'voice')}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => triggerFileInput('image')}
            className="bg-transparent border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            disabled={loading}
          >
            <Image className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => triggerFileInput('voice')}
            className="bg-transparent border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            disabled={loading}
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Button
            type="submit"
            className="bg-gray-800 hover:bg-gray-700 text-white dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900 font-bold"
            disabled={loading || !newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}