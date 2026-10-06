"use client";

import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ScoringDetailsProps {
  details: any;
  setActiveTab: (tab: string) => void;
}

export default function ScoringDetails({
  details,
  setActiveTab,
}: ScoringDetailsProps) {
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

  return (
    <div className="space-y-6 animate-in fade-in max-w-7xl mx-auto">
      {!details ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-black/10 border-dashed shadow-sm">
          <p className="text-black/60 font-medium text-sm mb-4">
            Select an account from the ledger to examine metric extraction.
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
              <h2 className="text-2xl font-bold text-black">{details.name}</h2>
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
                    tick={{ fill: "#000000", fontSize: 12, fontWeight: 500 }}
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
              {["financial", "professional", "behavioral"].map((category) => {
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
                      {Object.entries(bd[category]).map(([k, v]: any) => {
                        const score = typeof v === "object" ? v.score : v;
                        const max = typeof v === "object" ? v.max : "--";
                        const value = typeof v === "object" ? v.value : "N/A";
                        const reason =
                          typeof v === "object" ? v.reason : "Legacy record.";

                        return (
                          <div
                            key={k}
                            className="flex flex-col p-4 bg-black/[0.02] rounded-lg border border-black/10 hover:border-black/30 transition-colors"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-semibold text-black capitalize">
                                {k.replace("_score", "").replace(/_/g, " ")}
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
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
