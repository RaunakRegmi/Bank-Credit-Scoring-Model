"use client";

import React from "react";
import { LayoutDashboard, FileText, Settings } from "lucide-react";

interface SidebarProps {
  userRole: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleLogout: () => void;
}

export default function Sidebar({
  userRole,
  activeTab,
  setActiveTab,
  handleLogout,
}: SidebarProps) {
  return (
    <aside className="w-64 bg-white text-black flex flex-col shrink-0 border-r border-black/10 shadow-sm z-20">
      <div className="px-6 py-6 border-b border-black/10 flex items-center space-x-3">
        <div className="w-8 h-8 bg-[#EFAE12] rounded-lg flex items-center justify-center font-black text-black">
          F
        </div>
        <div>
          <h1 className="text-xs font-bold tracking-wider uppercase text-black">
            Credit Scoring Engine
          </h1>
          <div className="text-[11px] flex items-center space-x-1.5 text-black/60 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-[#EFAE12]"></span>
            <span className="capitalize">{userRole} Session</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6 space-y-1 px-3">
        <button
          onClick={() => setActiveTab("main")}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
            activeTab === "main"
              ? "bg-[#EFAE12] text-black font-semibold shadow-sm"
              : "text-black/70 hover:bg-black/5 hover:text-black"
          }`}
        >
          <LayoutDashboard size={18} /> <span>Transaction Requests</span>
        </button>
        <button
          onClick={() => setActiveTab("details")}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
            activeTab === "details"
              ? "bg-[#EFAE12] text-black font-semibold shadow-sm"
              : "text-black/70 hover:bg-black/5 hover:text-black"
          }`}
        >
          <FileText size={18} /> <span>Scoring Details</span>
        </button>
        {userRole === "admin" && (
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
              activeTab === "settings"
                ? "bg-[#EFAE12] text-black font-semibold shadow-sm"
                : "text-black/70 hover:bg-black/5 hover:text-black"
            }`}
          >
            <Settings size={18} /> <span>Engine Settings</span>
          </button>
        )}
      </nav>

      <div className="p-4 border-t border-black/10">
        <button
          onClick={handleLogout}
          className="w-full flex justify-center items-center space-x-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-black/70 hover:text-black bg-black/5 hover:bg-black/10 rounded-lg transition-colors"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
}
