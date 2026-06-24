"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";
import { toast } from "sonner";

interface OrderNotificationContextType {
  registerListener: (callback: (data: any) => void) => () => void;
}

const OrderNotificationContext = createContext<OrderNotificationContextType | undefined>(undefined);

export const OrderNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session } = useSession();
  const listenersRef = useRef<((data: any) => void)[]>([]);

  const registerListener = (callback: (data: any) => void) => {
    listenersRef.current.push(callback);
    return () => {
      listenersRef.current = listenersRef.current.filter((cb) => cb !== callback);
    };
  };

  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain2.gain.setValueAtTime(0, ctx.currentTime);
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.45);
      osc2.start(ctx.currentTime + 0.1);
      osc2.stop(ctx.currentTime + 0.7);
    } catch (e) {
      console.error("Failed to play notification chime:", e);
    }
  };

  useEffect(() => {
    const storeId = session?.user?.storeId;
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "mt1";

    if (!storeId || !pusherKey) return;

    // Enable pusher logging in development
    if (process.env.NODE_ENV === "development") {
      Pusher.logToConsole = true;
    }

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    const channel = pusher.subscribe(`store-${storeId}`);

    channel.bind("new-order", (data: any) => {
      console.log("New order received via Pusher:", data);
      
      // Play sound
      playChime();

      // Show toast
      toast.success("New Public Order Received!", {
        description: `Order Total: Rs. ${data.total || 0} (${data.type || "TAKE_AWAY"})`,
        duration: 8000,
      });

      // Notify all registered page listeners
      listenersRef.current.forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error("Error executing listener callback:", e);
        }
      });
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [session?.user?.storeId]);

  return (
    <OrderNotificationContext.Provider value={{ registerListener }}>
      {children}
    </OrderNotificationContext.Provider>
  );
};

export const useOrderNotification = () => {
  const context = useContext(OrderNotificationContext);
  if (context === undefined) {
    throw new Error("useOrderNotification must be used within an OrderNotificationProvider");
  }
  return context;
};
