"use client";

import React, { useState } from "react";
import { Inter } from "next/font/google";
import { AlertCircle, Lock, User } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });
const API_BASE = "http://localhost:8000";

interface LoginScreenProps {
  onLoginSuccess: (role: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append("username", loginUsername);
      formData.append("password", loginPassword);

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();

      // Save tokens
      localStorage.setItem("fintara_token", data.access_token);
      localStorage.setItem("fintara_role", data.role);

      // Notify parent component
      onLoginSuccess(data.role);
    } catch (err) {
      setLoginError("Authentication failed. Verify credentials.");
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-white text-black ${inter.className}`}
    >
      <div className="w-full max-w-md p-8 bg-white text-black rounded-2xl shadow-xl border border-black/10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#EFAE12] rounded-xl font-black text-black mb-3 shadow-inner">
            F
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-black">
            Fintara
          </h1>
          <p className="text-xs font-medium text-black/60 mt-1">
            Enterprise Credit Scoring Engine
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {loginError && (
            <div className="bg-amber-50 border border-amber-200 text-black text-xs font-medium p-3 rounded-lg flex items-center space-x-2">
              <AlertCircle size={16} className="shrink-0 text-[#EFAE12]" />
              <span>{loginError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-black">
              Officer ID
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-black/40" size={18} />
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full bg-white border border-black/20 rounded-lg py-2.5 pl-10 pr-4 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#EFAE12] transition-all"
                placeholder="e.g. admin"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-black">Passcode</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-black/40" size={18} />
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-white border border-black/20 rounded-lg py-2.5 pl-10 pr-4 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#EFAE12] transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#EFAE12] hover:bg-black hover:text-white text-black font-semibold py-3 rounded-lg transition-all shadow-sm text-sm"
          >
            Authenticate System
          </button>
        </form>
      </div>
    </div>
  );
}
