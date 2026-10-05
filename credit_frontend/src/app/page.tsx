"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Activity,
  CheckCircle,
  XCircle,
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

  const saveConfig = async () => {
    try {
      await fetch(`${API_BASE}/api/settings/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      alert("Enterprise Configuration Updated!");
    } catch (err) {
      console.error(err);
    }
  };

  // Radar Chart Data formatting
  const getRadarData = () => {
    if (!details) return [];
    const bd =
      typeof details.score_breakdown === "string"
        ? JSON.parse(details.score_breakdown)
        : details.score_breakdown;

    const sum = (obj: any) =>
      Object.values(obj).reduce((a: any, b: any) => a + b, 0);

    return [
      { category: "Financial", score: sum(bd.financial), fullMark: 500 },
      { category: "Professional", score: sum(bd.professional), fullMark: 100 },
      { category: "Behavioral", score: sum(bd.behavioral), fullMark: 400 },
    ];
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
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
                          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${row.status === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
                        >
                          {row.status === "Approved" ? (
                            <CheckCircle size={14} />
                          ) : (
                            <XCircle size={14} />
                          )}
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
                  {/* Radar Chart */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-1 flex flex-col items-center justify-center h-80">
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

                  {/* Profile Breakdowns */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2 overflow-y-auto h-80">
                    <h3 className="font-bold mb-4">Raw Metric Extraction</h3>
                    {["financial", "professional", "behavioral"].map(
                      (category) => {
                        const bd =
                          typeof details.score_breakdown === "string"
                            ? JSON.parse(details.score_breakdown)
                            : details.score_breakdown;
                        return (
                          <div key={category} className="mb-6 last:mb-0">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                              {category} Profile
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              {Object.entries(bd[category]).map(
                                ([k, v]: any) => (
                                  <div
                                    key={k}
                                    className="flex justify-between p-3 bg-gray-50 rounded-lg"
                                  >
                                    <span className="text-sm text-gray-600 capitalize">
                                      {k
                                        .replace("_score", "")
                                        .replace(/_/g, " ")}
                                    </span>
                                    <span className="text-sm font-bold text-gray-900">
                                      +{v}
                                    </span>
                                  </div>
                                ),
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
          <div className="max-w-3xl space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold">Engine Configuration</h2>
                <p className="text-gray-500 mt-1">
                  Adjust core scoring thresholds.
                </p>
              </div>
              <button
                onClick={saveConfig}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition"
              >
                Save to Engine
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Global Approval Threshold
              </label>
              <input
                type="number"
                value={config.approval_threshold}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    approval_threshold: parseInt(e.target.value),
                  })
                }
                className="w-1/3 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-sm text-gray-500 mt-2">
                Any score below this integer will trigger a strict "Declined"
                state.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
