"use client";

import React from "react";
import { RainbowKitCustomConnectButton } from "~~/components/helper/RainbowKitCustomConnectButton";

export const Header = () => {
  return (
    <div className="sticky top-0 z-20 border-b border-white/8 bg-[#0d0d0d]/90 backdrop-blur-md">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-xl tracking-tight text-white">
            Tip<span className="text-[#FED10A]">Myst</span>
          </span>
          <span className="text-[10px] font-mono bg-[#FED10A]/10 text-[#FED10A] border border-[#FED10A]/20 px-1.5 py-0.5 rounded-full">
            FHEVM
          </span>
        </div>
        <RainbowKitCustomConnectButton />
      </div>
    </div>
  );
};
