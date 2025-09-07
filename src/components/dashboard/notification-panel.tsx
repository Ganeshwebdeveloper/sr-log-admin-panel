"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase';
import { toast } from 'sonner';
import { Database } from '@/types/supabase';

type Notification = Database['public']['Tables']['notifications']['Row'];

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = supabaseBrowser;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10); // Limit to recent notifications

      if (error) throw error;
      setNotifications(data);
    } catch (error: any) {
      toast.error(`Failed to fetch notifications: ${error.message}`);
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        console.log('Notification change received!', payload);
        fetchNotifications(); // Re-fetch all notifications on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, supabase]);

  return (
    <Card className="glassmorphism-card border-primary-accent/30">
      <CardHeader>
        <CardTitle className="text-primary-accent flex items-center gap-2">
          <Bell className="h-5 w-5" /> Notification Panel
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-gray-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-gray-400">No new notifications.</div>
        ) : (
          <ScrollArea className="h-[300px] w-full rounded-md border border-primary-accent/20 p-2">
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 rounded-md bg-gray-800/50 border border-primary-accent/10 text-sm"
                >
                  <p className="font-medium text-white">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                    {notification.drv_id && ` - Driver: ${notification.drv_id}`}
                    {notification.vehicle_reg_no && ` - Vehicle: ${notification.vehicle_reg_no}`}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <p className="text-xs text-gray-500 mt-4">
          Notifications older than 2 days are automatically cleaned up by a database function.
        </p>
      </CardContent>
    </Card>
  );
}