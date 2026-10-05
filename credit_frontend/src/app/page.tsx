"use client";

import React, { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import {
  LayoutDashboard,
  FileText,
  Settings,
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

const inter = Inter({ subsets: ["latin"] });

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

  const renderObjectEditor = (title: string, configKey: string) => (
    <div className="bg-gray-50/50 p-5 rounded-lg border border-gray-200">
      <h4 className="font-semibold text-sm text-gray-800 mb-4 border-b border-gray-200 pb-2">
        {title}
      </h4>
      <div className="space-y-3">
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
              className="w-20 p-1.5 text-sm border border-gray-300 rounded shadow-sm text-right bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderArrayEditor = (
    title: string,
    configKey: string,
    labelFormat: (max: number) => string,
  ) => (
    <div className="bg-gray-50/50 p-5 rounded-lg border border-gray-200">
      <h4 className="font-semibold text-sm text-gray-800 mb-4 border-b border-gray-200 pb-2">
        {title}
      </h4>
      <div className="space-y-3">
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
              className="w-20 p-1.5 text-sm border border-gray-300 rounded shadow-sm text-right bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className={`flex h-screen bg-gray-50 text-gray-900 ${inter.className} overflow-hidden`}
    >
      {/* SIDEBAR - Institutional Dark Theme */}
      <aside className="w-64 bg-[#0B1120] text-slate-300 flex flex-col shrink-0 border-r border-slate-800 shadow-xl z-20">
        <div className="px-6 py-8 border-b border-slate-800/80">
          <h1 className="text-xs font-bold tracking-[0.15em] uppercase text-white">
            Credit Scoring Engine
          </h1>
        </div>
        <nav className="flex-1 py-6 space-y-1">
          <button
            onClick={() => setActiveTab("main")}
            className={`w-full flex items-center space-x-3 px-6 py-3.5 transition-all text-sm font-medium ${activeTab === "main" ? "bg-blue-600/10 text-white border-l-4 border-blue-500" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-4 border-transparent"}`}
          >
            <LayoutDashboard size={18} /> <span>Main Ledger</span>
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`w-full flex items-center space-x-3 px-6 py-3.5 transition-all text-sm font-medium ${activeTab === "details" ? "bg-blue-600/10 text-white border-l-4 border-blue-500" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-4 border-transparent"}`}
          >
            <FileText size={18} /> <span>Scoring Details</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center space-x-3 px-6 py-3.5 transition-all text-sm font-medium ${activeTab === "settings" ? "bg-blue-600/10 text-white border-l-4 border-blue-500" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-4 border-transparent"}`}
          >
            <Settings size={18} /> <span>Engine Settings</span>
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10 overflow-y-auto">
        {/* TAB 1: MAIN LEDGER */}
        {activeTab === "main" && (
          <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
            <div className="flex justify-between items-end border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Evaluation Queue
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Live assessment ledger from the Core Banking System.
                </p>
              </div>
              <button
                onClick={fetchLedger}
                className="bg-white border border-gray-300 px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 font-medium text-sm transition-colors text-gray-700"
              >
                Refresh Data
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                  <tr>
                    <th className="p-4">Account No</th>
                    <th className="p-4">Decision Status</th>
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Final Score</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {ledger.map((row: any) => (
                    <tr
                      key={row.assessment_id}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="p-4 font-mono font-medium text-gray-900">
                        {row.account_no}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${row.status === "Approved" ? "bg-emerald-100 text-emerald-800" : row.status === "Declined" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500">
                        {new Date(row.date).toLocaleString()}
                      </td>
                      <td className="p-4 font-semibold text-gray-900">
                        {row.points_given}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => loadDetails(row.assessment_id)}
                          className="text-blue-600 font-medium hover:text-blue-800 hover:underline"
                        >
                          View Breakdown
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
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg border border-gray-200 border-dashed">
                <p className="text-gray-500 mb-4 text-sm">
                  Select an account from the ledger to view the analysis
                  breakdown.
                </p>
                <button
                  onClick={() => setActiveTab("main")}
                  className="bg-gray-900 text-white px-5 py-2 rounded-md font-medium shadow-sm hover:bg-gray-800 text-sm transition-colors"
                >
                  Return to Ledger
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {details.name}
                    </h2>
                    <div className="flex space-x-3 mt-2">
                      <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                        ACC: {details.account_no}
                      </span>
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                        Asset: {details.type_of_good}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Final Score
                    </span>
                    <div className="text-4xl font-black text-gray-900 mt-1">
                      {details.total_score}
                    </div>
                    <p
                      className={`text-sm font-semibold mt-1 ${details.risk_category.includes("Low") ? "text-emerald-600" : details.risk_category.includes("High") ? "text-rose-600" : "text-amber-600"}`}
                    >
                      {details.risk_category}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* VIBRANT RADAR CHART REVERTED HERE */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 md:col-span-1 flex flex-col items-center justify-center h-[36rem]">
                    <h3 className="font-semibold text-gray-900 mb-2 self-start">
                      Risk Geometry
                    </h3>
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

                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 md:col-span-2 overflow-y-auto h-[36rem]">
                    <h3 className="font-semibold text-gray-900 mb-6 sticky top-0 bg-white z-10 pb-4 border-b border-gray-100">
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
                            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-gray-100 pb-1 inline-block">
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
                                      className="flex flex-col p-4 bg-gray-50/50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                                    >
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-semibold text-gray-900 capitalize">
                                          {k
                                            .replace("_score", "")
                                            .replace(/_/g, " ")}
                                        </span>
                                        <span className="text-sm font-bold text-gray-900">
                                          +{score}{" "}
                                          <span className="text-gray-400 font-medium">
                                            / {max}
                                          </span>
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-start text-xs">
                                        <span className="font-mono bg-white border border-gray-200 text-gray-600 px-2 py-1 rounded">
                                          V: {value}
                                        </span>
                                        <span className="text-right text-gray-500 leading-relaxed max-w-sm ml-4">
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

        {/* TAB 3: SETTINGS */}
        {activeTab === "settings" && config && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-24">
            <div className="border-b border-gray-200 pb-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                Engine Rules Configuration
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Manage global decision bands and metric weight allocations.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">
                Decision Threshold Bands
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
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
                              className="w-24 p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                              className="w-24 p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                              className="w-full p-2 border border-gray-300 rounded shadow-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                              className="w-full p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-6">
                Data Point Weight Allocations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                {renderObjectEditor(
                  "Occupation Stability",
                  "occupation_scores",
                )}
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

            <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 p-4 px-10 flex justify-between items-center shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-10">
              <div className="flex items-center space-x-6">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Engine Capacity Limit
                  </span>
                  <div
                    className={`text-2xl font-black tracking-tight ${isScoreValid ? "text-gray-900" : "text-rose-600"}`}
                  >
                    {maxTotalScore}{" "}
                    <span className="text-gray-400 text-lg font-medium">
                      / 1000 pts
                    </span>
                  </div>
                </div>
                {!isScoreValid && (
                  <div className="flex items-center space-x-2 text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2 rounded text-sm font-medium">
                    <AlertCircle size={16} />
                    <span>
                      Total maximums across all 11 fields must equal exactly
                      1000.
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={saveConfig}
                disabled={!isScoreValid}
                className={`px-8 py-2.5 rounded shadow-sm text-sm font-medium transition-colors ${isScoreValid ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
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
