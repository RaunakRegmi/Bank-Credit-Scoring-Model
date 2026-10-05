"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

const API_BASE = "http://localhost:8000";

export default function FintaraDashboard() {
  const [activeTab, setActiveTab] = useState("main");
  const [ledger, setLedger] = useState([]);
  const [details, setDetails] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetchLedger();
    fetchConfig();
  }, []);

  const fetchLedger = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/main`);
      const data = await res.json();
      setLedger(data);
    } catch (err) {
      console.error("Failed to fetch ledger", err);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/config`);
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      console.error("Failed to fetch config", err);
    }
  };

  const loadDetails = async (id: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/details/${id}`);
      const data = await res.json();
      setDetails(data);
      setActiveTab("details");
    } catch (err) {
      console.error("Failed to fetch details", err);
    }
  };

  // 1. CALCULATE REAL-TIME MAX TOTAL
  const calculateMaxTotal = (cfg: any) => {
    if (!cfg) return 0;
    const getMaxArr = (arr: any) =>
      Math.max(...(arr || []).map((x: any) => x.score || 0));
    const getMaxObj = (obj: any) =>
      Math.max(...Object.values(obj || {}).map((x: any) => Number(x) || 0));

    return (
      getMaxArr(cfg.age_brackets) +
      getMaxObj(cfg.marital_status_scores) +
      getMaxArr(cfg.salary_brackets) +
      getMaxObj(cfg.dependents_scores) +
      getMaxObj(cfg.incoming_months_scores) +
      getMaxArr(cfg.outgoing_ratio_brackets) +
      getMaxArr(cfg.housing_ratio_brackets) +
      getMaxObj(cfg.spouse_scores) +
      getMaxObj(cfg.spouse_working_scores) +
      getMaxObj(cfg.occupation_scores) +
      getMaxObj(cfg.address_scores)
    );
  };

  const maxTotalScore = calculateMaxTotal(config);
  const isScoreValid = maxTotalScore === 1000;

  const saveConfig = async () => {
    if (!isScoreValid) {
      alert("Error: Total maximum score must equal exactly 1000.");
      return;
    }
    try {
      await fetch(`${API_BASE}/api/settings/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      alert("Enterprise Configuration Updated Successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  // UPDATED: Radar Math now extracts .score from nested object
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

  // Helper to render Object-based rules (e.g., marital_status_scores)
  const renderObjectEditor = (title: string, configKey: string) => (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
      <h4 className="font-bold text-sm text-gray-800 mb-3 border-b border-gray-200 pb-2">
        {title}
      </h4>
      <div className="space-y-2">
        {Object.entries(config[configKey] || {}).map(([key, val]: any) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-600 capitalize">
              {key.replace(/_/g, " ")}
            </span>
            <input
              type="number"
              value={val}
              onChange={(e) => {
                const newConfig = { ...config };
                newConfig[configKey][key] = parseInt(e.target.value) || 0;
                setConfig(newConfig);
              }}
              className="w-16 p-1 text-sm border rounded text-right bg-white"
            />
          </div>
        ))}
      </div>
    </div>
  );

  // Helper to render Array-based rules (e.g., age_brackets)
  const renderArrayEditor = (
    title: string,
    configKey: string,
    labelFormat: (max: number) => string,
  ) => (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
      <h4 className="font-bold text-sm text-gray-800 mb-3 border-b border-gray-200 pb-2">
        {title}
      </h4>
      <div className="space-y-2">
        {(config[configKey] || []).map((bracket: any, idx: number) => (
          <div key={idx} className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-600">
              {labelFormat(bracket.max)}
            </span>
            <input
              type="number"
              value={bracket.score}
              onChange={(e) => {
                const newConfig = { ...config };
                newConfig[configKey][idx].score = parseInt(e.target.value) || 0;
                setConfig(newConfig);
              }}
              className="w-16 p-1 text-sm border rounded text-right bg-white"
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Activity size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-wide">Fintara CBS</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab("main")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeTab === "main" ? "bg-blue-600" : "hover:bg-slate-800"}`}
          >
            <LayoutDashboard size={20} /> <span>Main Ledger</span>
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeTab === "details" ? "bg-blue-600" : "hover:bg-slate-800"}`}
          >
            <FileText size={20} /> <span>Scoring Details</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition ${activeTab === "settings" ? "bg-blue-600" : "hover:bg-slate-800"}`}
          >
            <Settings size={20} /> <span>Engine Settings</span>
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* TAB 1: MAIN LEDGER */}
        {activeTab === "main" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">Credit Assessments</h2>
                <p className="text-gray-500 mt-1">
                  Live evaluation queue from CBS Sandbox.
                </p>
              </div>
              <button
                onClick={fetchLedger}
                className="bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-50 font-medium text-sm"
              >
                Refresh Table
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                  <tr>
                    <th className="p-5">Account No</th>
                    <th className="p-5">Status</th>
                    <th className="p-5">Date</th>
                    <th className="p-5">Total Score</th>
                    <th className="p-5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {ledger.map((row: any) => (
                    <tr
                      key={row.assessment_id}
                      className="hover:bg-gray-50/50 transition"
                    >
                      <td className="p-5 font-mono font-medium text-gray-900">
                        {row.account_no}
                      </td>
                      <td className="p-5">
                        <span
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${row.status === "Approved" ? "bg-emerald-100 text-emerald-700" : row.status === "Declined" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}
                        >
                          <span>{row.status}</span>
                        </span>
                      </td>
                      <td className="p-5 text-gray-500">
                        {new Date(row.date).toLocaleString()}
                      </td>
                      <td className="p-5 font-bold">{row.points_given}</td>
                      <td className="p-5">
                        <button
                          onClick={() => loadDetails(row.assessment_id)}
                          className="text-blue-600 font-semibold hover:text-blue-800"
                        >
                          Analyze
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
          <div className="space-y-6 animate-in fade-in">
            {!details ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 border-dashed">
                <p className="text-gray-500 mb-4">
                  Select an account from the Main Ledger to view analysis.
                </p>
                <button
                  onClick={() => setActiveTab("main")}
                  className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm"
                >
                  Return to Ledger
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold">{details.name}</h2>
                    <p className="text-gray-500 font-mono mt-1">
                      ACC: {details.account_no} | Goal: {details.type_of_good}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                      Final Score
                    </span>
                    <div className="text-4xl font-extrabold text-blue-600">
                      {details.total_score}
                    </div>
                    <p className="text-sm font-medium text-gray-500 mt-1">
                      {details.risk_category}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-1 flex flex-col items-center justify-center h-[32rem]">
                    <h3 className="font-bold mb-2 self-start">Risk Geometry</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="70%"
                        data={getRadarData()}
                      >
                        <PolarGrid />
                        <PolarAngleAxis
                          dataKey="category"
                          textAnchor="middle"
                          tick={{ fill: "#6b7280", fontSize: 12 }}
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 500]}
                          tick={false}
                        />
                        <Radar
                          name="Score"
                          dataKey="score"
                          stroke="#2563eb"
                          fill="#3b82f6"
                          fillOpacity={0.5}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* UPDATED: Detailed Metric Extraction UI */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2 overflow-y-auto h-[32rem]">
                    <h3 className="font-bold mb-4 sticky top-0 bg-white z-10 pb-2">
                      Detailed Metric Extraction & Reasoning
                    </h3>
                    {["financial", "professional", "behavioral"].map(
                      (category) => {
                        const bd =
                          typeof details.score_breakdown === "string"
                            ? JSON.parse(details.score_breakdown)
                            : details.score_breakdown;
                        return (
                          <div key={category} className="mb-6 last:mb-0">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-3">
                              {category} Profile
                            </h4>
                            <div className="space-y-3">
                              {Object.entries(bd[category]).map(
                                ([k, v]: any) => {
                                  // Handles both legacy int records and new detailed objects securely
                                  const score =
                                    typeof v === "object" ? v.score : v;
                                  const max =
                                    typeof v === "object" ? v.max : "--";
                                  const value =
                                    typeof v === "object" ? v.value : "N/A";
                                  const reason =
                                    typeof v === "object"
                                      ? v.reason
                                      : "Legacy record without detailed reasoning.";

                                  return (
                                    <div
                                      key={k}
                                      className="flex flex-col p-4 bg-gray-50 rounded-xl border border-gray-100"
                                    >
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-gray-800 capitalize">
                                          {k
                                            .replace("_score", "")
                                            .replace(/_/g, " ")}
                                        </span>
                                        <span className="text-sm font-black text-emerald-600">
                                          +{score}{" "}
                                          <span className="text-gray-400 font-medium">
                                            / {max} pts
                                          </span>
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="font-medium bg-gray-200 text-gray-700 px-2 py-1 rounded">
                                          Value: {value}
                                        </span>
                                        <span className="text-right text-gray-500 italic max-w-xs">
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

        {/* TAB 3: UPGRADED SETTINGS */}
        {activeTab === "settings" && config && (
          <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in pb-20">
            {/* Header */}
            <div>
              <h2 className="text-3xl font-bold">Engine Configuration</h2>
              <p className="text-gray-500 mt-1">
                Manage threshold bands and comprehensive metric scoring weights.
              </p>
            </div>

            {/* Threshold Bands */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-4">
                Decision Threshold Bands
              </h3>
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="p-3">Min Score</th>
                    <th className="p-3">Max Score</th>
                    <th className="p-3">Outcome Action</th>
                    <th className="p-3">Risk Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
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
                            className="w-24 p-2 border rounded-md"
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
                            className="w-24 p-2 border rounded-md"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            value={band.action}
                            onChange={(e) => {
                              const c = { ...config };
                              c.threshold_bands[index].action = e.target.value;
                              setConfig(c);
                            }}
                            className="w-full p-2 border rounded-md bg-white"
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
                            className="w-full p-2 border rounded-md"
                          />
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* All 11 Data Points */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-6">
                Data Point Weight Allocations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Behavioral */}
                {renderArrayEditor(
                  "Age Brackets",
                  "age_brackets",
                  (max) => `Up to Age ${max === 999 ? "Max" : max}`,
                )}
                {renderObjectEditor("Marital Status", "marital_status_scores")}
                {renderObjectEditor("Dependents", "dependents_scores")}
                {renderObjectEditor("Spouse Details", "spouse_scores")}
                {renderObjectEditor("Spouse Working", "spouse_working_scores")}
                {renderObjectEditor("Residence Area", "address_scores")}

                {/* Professional */}
                {renderObjectEditor(
                  "Occupation Stability",
                  "occupation_scores",
                )}

                {/* Financial */}
                {renderArrayEditor(
                  "Salary Brackets",
                  "salary_brackets",
                  (max) =>
                    `Up to ${max === 999999999 ? "Max" : max.toLocaleString()}`,
                )}
                {renderObjectEditor(
                  "Incoming Consistency (Months)",
                  "incoming_months_scores",
                )}
                {renderArrayEditor(
                  "Outgoing / Incoming Ratio",
                  "outgoing_ratio_brackets",
                  (max) =>
                    `Up to ${max === 999 ? "Max" : (max * 100).toFixed(0)}%`,
                )}
                {renderArrayEditor(
                  "Housing / Incoming Ratio",
                  "housing_ratio_brackets",
                  (max) =>
                    `Up to ${max === 999 ? "Max" : (max * 100).toFixed(0)}%`,
                )}
              </div>
            </div>

            {/* STICKY VALIDATION & SAVE BAR */}
            <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 p-4 px-8 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <div className="flex items-center space-x-4">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Engine Maximum Capacity
                  </span>
                  <div
                    className={`text-2xl font-black ${isScoreValid ? "text-emerald-600" : "text-rose-600"}`}
                  >
                    {maxTotalScore}{" "}
                    <span className="text-gray-400 text-lg">/ 1000 pts</span>
                  </div>
                </div>
                {!isScoreValid && (
                  <div className="flex items-center space-x-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg text-sm font-medium">
                    <AlertCircle size={16} />
                    <span>
                      The sum of maximums across all 11 fields must equal
                      exactly 1000.
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={saveConfig}
                disabled={!isScoreValid}
                className={`px-8 py-3 rounded-lg font-bold text-white transition shadow-sm ${isScoreValid ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"}`}
              >
                Save & Deploy Rules
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
