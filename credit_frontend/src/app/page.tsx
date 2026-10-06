"use client";

import LoginScreen from "../components/LoginScreen";
import Sidebar from "../components/Sidebar";
import TransactionRequests from "../components/TransactionRequests";
import ScoringDetails from "../components/ScoringDetails";
import EngineSettings from "../components/EngineSettings";

import React, { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import {
  LayoutDashboard,
  FileText,
  Settings,
  AlertCircle,
  Lock,
  User,
} from "lucide-react";

const inter = Inter({ subsets: ["latin"] });
const API_BASE = "http://localhost:8000";

export default function FintaraDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState("main");
  const [ledger, setLedger] = useState([]);
  const [details, setDetails] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("fintara_token");
    const role = localStorage.getItem("fintara_role");
    if (token && role) {
      setUserRole(role);
      setIsLoggedIn(true);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchLedger();
      fetchConfig();
    }
  }, [isLoggedIn]);

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
      localStorage.setItem("fintara_token", data.access_token);
      localStorage.setItem("fintara_role", data.role);

      setUserRole(data.role);
      setIsLoggedIn(true);
      setLoginError("");
    } catch (err) {
      setLoginError("Authentication failed. Verify credentials.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("fintara_token");
    localStorage.removeItem("fintara_role");
    setIsLoggedIn(false);
    setUserRole("");
    setActiveTab("main");
  };

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("fintara_token")}`,
  });

  const fetchLedger = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/main`, {
        headers: getAuthHeaders(),
      });
      if (res.status === 401) return handleLogout();
      setLedger(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/config`, {
        headers: getAuthHeaders(),
      });
      if (res.status === 401) return handleLogout();
      setConfig(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadDetails = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/details/${id}`, {
        headers: getAuthHeaders(),
      });
      if (res.status === 401) return handleLogout();
      setDetails(await res.json());
      setActiveTab("details");
    } catch (err) {
      console.error(err);
    }
  };

  const saveConfig = async () => {
    if (!isScoreValid)
      return alert("System Block: Total score configuration must equal 1000.");
    try {
      const res = await fetch(`${API_BASE}/api/settings/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(config),
      });
      if (res.status === 401) return handleLogout();
      alert("Engine Rules deployed securely.");
    } catch (err) {
      console.error(err);
    }
  };

  // 1000-POINT LIMIT: Only counts sections that are ACTIVE
  const calculateMaxTotal = (cfg: any) => {
    if (!cfg) return 0;
    const getMaxArr = (key: string) => {
      if (cfg[key]?.enabled === false) return 0; // Ignore disabled sections
      return Math.max(
        ...(cfg[key]?.brackets || cfg[key] || []).map((x: any) => x.score || 0),
      );
    };
    const getMaxObj = (key: string) => {
      if (cfg[key]?.enabled === false) return 0; // Ignore disabled sections
      return Math.max(
        ...Object.values(cfg[key]?.scores || cfg[key] || {})
          .filter((v) => typeof v === "number")
          .map(Number),
      );
    };

    return (
      getMaxArr("age_brackets") +
      getMaxObj("marital_status_scores") +
      getMaxArr("salary_brackets") +
      getMaxObj("dependents_scores") +
      getMaxObj("incoming_months_scores") +
      getMaxArr("outgoing_ratio_brackets") +
      getMaxArr("housing_ratio_brackets") +
      getMaxObj("spouse_scores") +
      getMaxObj("spouse_working_scores") +
      getMaxObj("occupation_scores") +
      getMaxObj("address_scores")
    );
  };

  const maxTotalScore = calculateMaxTotal(config);
  const isScoreValid = maxTotalScore === 1000;

  // TOGGLE FUNCTIONALITY
  const handleToggle = (configKey: string) => {
    const newConfig = { ...config };
    // Handle both old array/object structures and new nested structures safely
    if (Array.isArray(newConfig[configKey])) {
      newConfig[configKey] = { enabled: false, brackets: newConfig[configKey] };
    } else if (!newConfig[configKey].hasOwnProperty("enabled")) {
      newConfig[configKey] = { enabled: false, scores: newConfig[configKey] };
    } else {
      newConfig[configKey].enabled = !newConfig[configKey].enabled;
    }
    setConfig(newConfig);
  };

  const renderObjectEditor = (title: string, configKey: string) => {
    const section = config[configKey] || {};
    const isEnabled = section.enabled !== false;
    const entries = section.scores || section;

    return (
      <div
        className={`bg-white p-5 rounded-xl border border-black/10 shadow-sm transition-all ${!isEnabled ? "opacity-40 bg-black/[0.02]" : ""}`}
      >
        <div className="flex justify-between items-center mb-4 border-b border-black/10 pb-2">
          <h4 className="font-semibold text-sm text-black">{title}</h4>
          <button
            onClick={() => handleToggle(configKey)}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${!isEnabled ? "bg-black/10 text-black/60" : "bg-[#EFAE12] text-black"}`}
          >
            {!isEnabled ? "OFF" : "ACTIVE"}
          </button>
        </div>
        <div className="space-y-3">
          {Object.entries(entries).map(([key, val]: any) => {
            if (key === "enabled") return null;
            return (
              <div key={key} className="flex justify-between items-center">
                <span className="text-xs font-medium text-black/70 capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                <input
                  type="number"
                  disabled={!isEnabled}
                  value={val}
                  onChange={(e) => {
                    const newConfig = { ...config };
                    if (newConfig[configKey].scores)
                      newConfig[configKey].scores[key] =
                        parseInt(e.target.value) || 0;
                    else
                      newConfig[configKey][key] = parseInt(e.target.value) || 0;
                    setConfig(newConfig);
                  }}
                  className="w-20 p-1.5 text-sm border border-black/20 rounded-md text-right bg-white disabled:bg-transparent focus:outline-none focus:ring-2 focus:ring-[#EFAE12]"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderArrayEditor = (
    title: string,
    configKey: string,
    labelFormat: (max: number) => string,
  ) => {
    const section = config[configKey] || {};
    const isEnabled = section.enabled !== false;
    const brackets = section.brackets || section;

    return (
      <div
        className={`bg-white p-5 rounded-xl border border-black/10 shadow-sm transition-all ${!isEnabled ? "opacity-40 bg-black/[0.02]" : ""}`}
      >
        <div className="flex justify-between items-center mb-4 border-b border-black/10 pb-2">
          <h4 className="font-semibold text-sm text-black">{title}</h4>
          <button
            onClick={() => handleToggle(configKey)}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${!isEnabled ? "bg-black/10 text-black/60" : "bg-[#EFAE12] text-black"}`}
          >
            {!isEnabled ? "OFF" : "ACTIVE"}
          </button>
        </div>
        <div className="space-y-3">
          {(Array.isArray(brackets) ? brackets : []).map(
            (bracket: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-xs font-medium text-black/70">
                  {labelFormat(bracket.max)}
                </span>
                <input
                  type="number"
                  disabled={!isEnabled}
                  value={bracket.score}
                  onChange={(e) => {
                    const newConfig = { ...config };
                    if (newConfig[configKey].brackets)
                      newConfig[configKey].brackets[idx].score =
                        parseInt(e.target.value) || 0;
                    else
                      newConfig[configKey][idx].score =
                        parseInt(e.target.value) || 0;
                    setConfig(newConfig);
                  }}
                  className="w-20 p-1.5 text-sm border border-black/20 rounded-md text-right bg-white disabled:bg-transparent focus:outline-none focus:ring-2 focus:ring-[#EFAE12]"
                />
              </div>
            ),
          )}
        </div>
      </div>
    );
  };

  // ... [LOGIN SCREEN REMAINS THE SAME]
  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLoginSuccess={(role) => {
          setUserRole(role);
          setIsLoggedIn(true);
        }}
      />
    );
  }

  // ==========================================
  // RENDER: MAIN DASHBOARD
  // ==========================================
  return (
    <div
      className={`flex h-screen bg-white text-black ${inter.className} overflow-hidden`}
    >
      {/* SIDEBAR */}
      <Sidebar
        userRole={userRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-10 overflow-y-auto bg-white">
        {activeTab === "main" && (
          <TransactionRequests
            ledger={ledger}
            fetchLedger={fetchLedger}
            loadDetails={loadDetails}
          />
        )}

        {/* TAB 2: SCORING DETAILS */}
        {activeTab === "details" && (
          <ScoringDetails details={details} setActiveTab={setActiveTab} />
        )}

        {/* TAB 3: SETTINGS (ADMIN ONLY) */}
        {activeTab === "settings" && userRole === "admin" && config && (
          <EngineSettings
            config={config}
            setConfig={setConfig}
            maxTotalScore={maxTotalScore}
            isScoreValid={isScoreValid}
            saveConfig={saveConfig}
          />
        )}
      </main>
    </div>
  );
}
