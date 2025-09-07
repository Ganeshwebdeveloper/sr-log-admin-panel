"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare } from 'lucide-react';
import { ChatBox } from '@/components/dashboard/chat-box';
import { useIsMobile } from '@/hooks/use-mobile'; // Import the useIsMobile hook

export function FixedChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg bg-gray-800 hover:bg-gray-700 text-white dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900 z-50"
          aria-label="Open Chat"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={isMobile ? "bottom" : "right"} // Open from bottom on mobile, right on desktop
        className={isMobile ? "h-[80vh] max-h-[80vh] w-full" : "w-full sm:max-w-md flex flex-col"} // Adjust size for mobile/desktop
      >
        <SheetHeader className="text-left px-4 pt-4">
          <SheetTitle className="text-gray-800 dark:text-gray-200">Chat with Drivers</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          <ChatBox />
        </div>
      </SheetContent>
    </Sheet>
  );
}