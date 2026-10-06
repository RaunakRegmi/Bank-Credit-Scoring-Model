"use client";

import React from "react";

interface TransactionRequestsProps {
  ledger: any[];
  fetchLedger: () => void;
  loadDetails: (id: number) => void;
}

export default function TransactionRequests({
  ledger,
  fetchLedger,
  loadDetails,
}: TransactionRequestsProps) {
  return (
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
  );
}
