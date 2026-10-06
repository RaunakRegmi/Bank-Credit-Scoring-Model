"use client";

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
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

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

  const getRadarData = () => {
    if (!details) return [];
    const bd =
      typeof details.score_breakdown === "string"
        ? JSON.parse(details.score_breakdown)
        : details.score_breakdown;
    const sum = (obj: any) =>
      Object.values(obj).reduce(
        (a: any, b: any) => a + (typeof b === "object" ? b.score : b),
        0,
      );
    return [
      { category: "Financial", score: sum(bd.financial), fullMark: 500 },
      { category: "Professional", score: sum(bd.professional), fullMark: 100 },
      { category: "Behavioral", score: sum(bd.behavioral), fullMark: 400 },
    ];
  };

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
                <User
                  className="absolute left-3 top-3 text-black/40"
                  size={18}
                />
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
              <label className="text-xs font-semibold text-black">
                Passcode
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-3 text-black/40"
                  size={18}
                />
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

  // ==========================================
  // RENDER: MAIN DASHBOARD
  // ==========================================
  return (
    <div
      className={`flex h-screen bg-white text-black ${inter.className} overflow-hidden`}
    >
      {/* SIDEBAR */}
      <aside className="w-64 bg-white text-black flex flex-col shrink-0 border-r border-black/10 shadow-sm z-20">
        <div className="px-6 py-6 border-b border-black/10 flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#EFAE12] rounded-lg flex items-center justify-center font-black text-black">
            F
          </div>
          <div>
            <h1 className="text-xs font-bold tracking-wider uppercase text-black">
              Fintara Engine
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
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${activeTab === "main" ? "bg-[#EFAE12] text-black font-semibold shadow-sm" : "text-black/70 hover:bg-black/5 hover:text-black"}`}
          >
            <LayoutDashboard size={18} /> <span>Transaction Requests</span>
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${activeTab === "details" ? "bg-[#EFAE12] text-black font-semibold shadow-sm" : "text-black/70 hover:bg-black/5 hover:text-black"}`}
          >
            <FileText size={18} /> <span>Scoring Details</span>
          </button>
          {userRole === "admin" && (
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${activeTab === "settings" ? "bg-[#EFAE12] text-black font-semibold shadow-sm" : "text-black/70 hover:bg-black/5 hover:text-black"}`}
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

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-10 overflow-y-auto bg-white">
        {/* TAB 1: MAIN LEDGER (Omitted for brevity - same as before) */}
        {activeTab === "main" && (
          <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
            <div className="flex justify-between items-end border-b border-black/10 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-black tracking-tight">
                  Evaluation Queue
                </h2>
                <p className="text-sm text-black/60 mt-1">
                  Live assessment ledger synchronized with Core Banking System.
                </p>
              </div>
              <button
                onClick={fetchLedger}
                className="bg-white border border-black/20 text-black hover:bg-black/5 px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
              >
                Refresh Data
              </button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-black/10 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-black/5 border-b border-black/10 text-xs uppercase text-black/70 font-semibold tracking-wider">
                  <tr>
                    <th className="p-4">Account No</th>
                    <th className="p-4">Decision Status</th>
                    <th className="p-4">Final Score</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-sm">
                  {ledger.map((row: any) => (
                    <tr
                      key={row.assessment_id}
                      className="hover:bg-amber-50/40 transition-colors"
                    >
                      <td className="p-4 font-mono font-medium text-black">
                        {row.account_no}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${row.status === "Approved" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : row.status === "Declined" ? "bg-rose-50 text-rose-800 border border-rose-200" : "bg-amber-50 text-amber-900 border border-amber-200"}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-black">
                        {row.points_given}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => loadDetails(row.assessment_id)}
                          className="text-black hover:text-amber-700 font-medium text-xs tracking-wide uppercase transition-colors"
                        >
                          View Breakdown &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SCORING DETAILS */}
        {activeTab === "details" && (
          <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
            {!details ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-black/10 border-dashed shadow-sm">
                <p className="text-black/60 font-medium text-sm mb-4">
                  Select an account from the ledger to examine metric
                  extraction.
                </p>
                <button
                  onClick={() => setActiveTab("main")}
                  className="bg-[#EFAE12] text-black px-4 py-2 rounded-lg font-semibold text-sm hover:bg-black hover:text-white transition-colors shadow-sm"
                >
                  Return to Ledger
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-black/10 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-black">
                      {details.name}
                    </h2>
                    <div className="flex space-x-3 mt-2">
                      <span className="text-xs font-mono bg-black/5 text-black px-2.5 py-1 rounded-md border border-black/10">
                        ACC: {details.account_no}
                      </span>
                      <span className="text-xs font-medium bg-black/5 text-black px-2.5 py-1 rounded-md border border-black/10">
                        Asset: {details.type_of_good}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-black/40 uppercase tracking-widest">
                      Final Computed Score
                    </span>
                    <div className="text-4xl font-extrabold text-black mt-1">
                      {details.total_score}
                    </div>
                    <p className="text-xs font-semibold text-black bg-[#EFAE12]/30 border border-[#EFAE12] px-3 py-1 rounded-md mt-1 inline-block">
                      {details.risk_category}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* RADAR CHART */}
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-black/10 md:col-span-1 flex flex-col items-center justify-center h-[36rem]">
                    <h3 className="font-semibold text-black mb-2 self-start text-sm uppercase tracking-wider">
                      Risk Geometry
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="70%"
                        data={getRadarData()}
                      >
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis
                          dataKey="category"
                          textAnchor="middle"
                          tick={{
                            fill: "#000000",
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 500]}
                          tick={false}
                          axisLine={false}
                        />
                        <Radar
                          name="Score"
                          dataKey="score"
                          stroke="#000000"
                          fill="#EFAE12"
                          fillOpacity={0.7}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            borderColor: "#000000",
                            color: "#000000",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-black/10 md:col-span-2 overflow-y-auto h-[36rem]">
                    <h3 className="font-semibold text-black mb-6 sticky top-0 bg-white z-10 pb-4 border-b border-black/10 text-sm uppercase tracking-wider">
                      Metric Extraction & Compliance Reasoning
                    </h3>
                    {["financial", "professional", "behavioral"].map(
                      (category) => {
                        const bd =
                          typeof details.score_breakdown === "string"
                            ? JSON.parse(details.score_breakdown)
                            : details.score_breakdown;
                        return (
                          <div key={category} className="mb-8 last:mb-0">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-black/50 mb-4 border-b border-black/10 pb-1 inline-block">
                              {category} Profile
                            </h4>
                            <div className="space-y-3">
                              {Object.entries(bd[category]).map(
                                ([k, v]: any) => {
                                  const score =
                                    typeof v === "object" ? v.score : v;
                                  const max =
                                    typeof v === "object" ? v.max : "--";
                                  const value =
                                    typeof v === "object" ? v.value : "N/A";
                                  const reason =
                                    typeof v === "object"
                                      ? v.reason
                                      : "Legacy record.";

                                  return (
                                    <div
                                      key={k}
                                      className="flex flex-col p-4 bg-black/[0.02] rounded-lg border border-black/10 hover:border-black/30 transition-colors"
                                    >
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-semibold text-black capitalize">
                                          {k
                                            .replace("_score", "")
                                            .replace(/_/g, " ")}
                                        </span>
                                        <span className="text-sm font-bold text-black">
                                          +{score}{" "}
                                          <span className="text-black/40 font-medium">
                                            / {max}
                                          </span>
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-start text-xs">
                                        <span className="font-mono bg-white border border-black/15 text-black px-2.5 py-1 rounded-md shadow-2xs">
                                          {value}
                                        </span>
                                        <span className="text-right text-black/70 leading-relaxed max-w-sm ml-4 font-normal">
                                          {reason}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: SETTINGS (ADMIN ONLY) */}
        {activeTab === "settings" && userRole === "admin" && config && (
          <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in pb-24">
            <div className="border-b border-black/10 pb-4">
              <h2 className="text-2xl font-bold text-black">
                Engine Directives & Configuration
              </h2>
              <p className="text-sm text-black/60 mt-1">
                Manage global decision bands and metric weight allocations.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-black/10 mb-6">
              <h3 className="font-semibold text-black mb-4 text-sm uppercase tracking-wider">
                Decision Threshold Bands
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-black/5 border-b border-black/10 text-xs text-black/70 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Min Score</th>
                      <th className="p-3">Max Score</th>
                      <th className="p-3">Outcome Action</th>
                      <th className="p-3">Risk Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {(config.threshold_bands || []).map(
                      (band: any, index: number) => (
                        <tr key={index}>
                          <td className="p-3">
                            <input
                              type="number"
                              value={band.min}
                              onChange={(e) => {
                                const c = { ...config };
                                c.threshold_bands[index].min =
                                  parseInt(e.target.value) || 0;
                                setConfig(c);
                              }}
                              className="w-24 p-2 border border-black/20 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EFAE12]"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={band.max}
                              onChange={(e) => {
                                const c = { ...config };
                                c.threshold_bands[index].max =
                                  parseInt(e.target.value) || 0;
                                setConfig(c);
                              }}
                              className="w-24 p-2 border border-black/20 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EFAE12]"
                            />
                          </td>
                          <td className="p-3">
                            <select
                              value={band.action}
                              onChange={(e) => {
                                const c = { ...config };
                                c.threshold_bands[index].action =
                                  e.target.value;
                                setConfig(c);
                              }}
                              className="w-full p-2 border border-black/20 rounded-md shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#EFAE12]"
                            >
                              <option value="Approved">Approved</option>
                              <option value="Third-Party Verification">
                                Third-Party Verification
                              </option>
                              <option value="Declined">Declined</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={band.risk}
                              onChange={(e) => {
                                const c = { ...config };
                                c.threshold_bands[index].risk = e.target.value;
                                setConfig(c);
                              }}
                              className="w-full p-2 border border-black/20 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#EFAE12]"
                            />
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-black/10">
              <h3 className="font-semibold text-black mb-6 text-sm uppercase tracking-wider">
                Data Point Weight Allocations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {renderArrayEditor(
                  "Age",
                  "age_brackets",
                  (max) => `Up to ${max === 999 ? "Max" : max}`,
                )}
                {renderObjectEditor("Marital Status", "marital_status_scores")}
                {renderObjectEditor("Dependents", "dependents_scores")}
                {renderObjectEditor("Spouse Details", "spouse_scores")}
                {renderObjectEditor("Spouse Working", "spouse_working_scores")}
                {renderObjectEditor("Residence Area", "address_scores")}
                {renderObjectEditor("Occupation", "occupation_scores")}
                {renderArrayEditor(
                  "Salary",
                  "salary_brackets",
                  (max) =>
                    `Up to ${max === 999999999 ? "Max" : max.toLocaleString()}`,
                )}
                {renderObjectEditor(
                  "Incoming Consistency",
                  "incoming_months_scores",
                )}
                {renderArrayEditor(
                  "Outgoing / Incoming",
                  "outgoing_ratio_brackets",
                  (max) =>
                    `Up to ${max === 999 ? "Max" : (max * 100).toFixed(0)}%`,
                )}
                {renderArrayEditor(
                  "Housing / Incoming",
                  "housing_ratio_brackets",
                  (max) =>
                    `Up to ${max === 999 ? "Max" : (max * 100).toFixed(0)}%`,
                )}
              </div>
            </div>

            <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-black/10 p-4 px-10 flex justify-between items-center shadow-lg z-10">
              <div className="flex items-center space-x-6">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-black/40 uppercase tracking-widest">
                    Engine Capacity Limit
                  </span>
                  <div
                    className={`text-xl font-bold tracking-tight ${isScoreValid ? "text-black" : "text-rose-600"}`}
                  >
                    {maxTotalScore}{" "}
                    <span className="text-black/40 text-sm font-medium">
                      / 1000 pts
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={saveConfig}
                disabled={!isScoreValid}
                className={`px-6 py-2.5 rounded-lg shadow-sm text-sm font-semibold transition-colors ${isScoreValid ? "bg-[#EFAE12] text-black hover:bg-black hover:text-white" : "bg-black/10 text-black/40 cursor-not-allowed"}`}
              >
                Deploy Engine Rules
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
