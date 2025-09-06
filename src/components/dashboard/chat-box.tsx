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

type Message = Database['public']['Tables']['messages']['Row'];

export function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const supabase = supabaseBrowser;
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50); // Limit to recent messages

      if (error) throw error;
      setMessages(data);
    } catch (error: any) {
      toast.error(`Failed to fetch messages: ${error.message}`);
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        console.log('Message change received!', payload);
        fetchMessages(); // Re-fetch all messages on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages, supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase.from('messages').insert({
        sender: user?.id || 'admin', // Assuming admin user for now
        message: newMessage.trim(),
        type: 'text',
      });

      if (error) throw error;
      setNewMessage('');
    } catch (error: any) {
      toast.error(`Failed to send message: ${error.message}`);
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = (type: 'image' | 'voice') => {
    toast.info(`Image/Voice upload not yet implemented. Requires Supabase Storage setup.`);
    // Future implementation would involve:
    // 1. Opening file input
    // 2. Uploading file to Supabase Storage
    // 3. Getting public URL
    // 4. Inserting message with type 'image' or 'voice' and file_url
  };

  return (
    <Card className="glassmorphism-card border-neon-blue/30 lg:col-span-1 flex flex-col">
      <CardHeader>
        <CardTitle className="text-neon-blue">Voice/Chat Box</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 p-4 pt-0">
        <ScrollArea className="flex-1 h-[250px] w-full rounded-md border border-neon-blue/20 p-2 mb-4">
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-gray-400">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-400">No messages yet.</div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === (user?.id || 'admin') ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={
                      `max-w-[70%] p-3 rounded-lg text-sm ` +
                      (msg.sender === (user?.id || 'admin')
                        ? 'bg-neon-blue/30 text-white border border-neon-blue/50'
                        : 'bg-gray-700/50 text-gray-200 border border-gray-600/50')
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
                    <p className="text-xs text-gray-400 mt-1 text-right">
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
            className="flex-1 bg-gray-700/50 border-neon-blue/20 text-white focus:border-neon-blue focus:ring-neon-blue"
            disabled={loading}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleFileUpload('image')}
            className="bg-transparent border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10"
            disabled={loading}
          >
            <Image className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => handleFileUpload('voice')}
            className="bg-transparent border-neon-blue/30 text-neon-blue hover:bg-neon-blue/10"
            disabled={loading}
          >
            <Mic className="h-4 w-4" />
          </Button>
          <Button
            type="submit"
            className="bg-neon-blue hover:bg-neon-blue/80 text-black font-bold"
            disabled={loading || !newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}