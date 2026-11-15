import React from "react";
import { Iphone16Pro } from "@/components/ui/iphone-16-pro";

export function IPhone16ProDemo() {
  return (
    <div className="relative flex items-center justify-center p-4">
      <Iphone16Pro
        src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
        className="h-[520px] w-auto drop-shadow-2xl"
      />
    </div>
  );
}

