"use client";

import React from "react";

interface EngineSettingsProps {
  config: any;
  setConfig: (config: any) => void;
  maxTotalScore: number;
  isScoreValid: boolean;
  saveConfig: () => void;
}

export default function EngineSettings({
  config,
  setConfig,
  maxTotalScore,
  isScoreValid,
  saveConfig,
}: EngineSettingsProps) {
  // TOGGLE FUNCTIONALITY
  const handleToggle = (configKey: string) => {
    const newConfig = { ...config };
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

  return (
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
                          c.threshold_bands[index].action = e.target.value;
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
          {renderObjectEditor("Incoming Consistency", "incoming_months_scores")}
          {renderArrayEditor(
            "Outgoing / Incoming",
            "outgoing_ratio_brackets",
            (max) => `Up to ${max === 999 ? "Max" : (max * 100).toFixed(0)}%`,
          )}
          {renderArrayEditor(
            "Housing / Incoming",
            "housing_ratio_brackets",
            (max) => `Up to ${max === 999 ? "Max" : (max * 100).toFixed(0)}%`,
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
  );
}
