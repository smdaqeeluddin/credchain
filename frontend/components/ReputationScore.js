"use client";
import { useState, useEffect } from "react";
import { calculateReputationScore } from "../utils/reputation";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../utils/contract";
import { ethers } from "ethers";

export default function ReputationScore({ cred, metadata, tokenId }) {
  const [score, setScore] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_ALCHEMY_URL);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        let verifierCount = 0;
        try {
          let i = 0;
          while (true) {
            await contract.tokenVerifiers(Number(tokenId), i);
            verifierCount++;
            i++;
          }
        } catch (_) {}
        const result = calculateReputationScore(cred, verifierCount, metadata);
        setScore(result);
      } catch (_) {}
    })();
  }, [cred, metadata, tokenId]);

  if (!score) return null;

  const colorMap = {
    green: { bg: "bg-green-100", text: "text-green-700", bar: "bg-green-500", border: "border-green-300" },
    yellow: { bg: "bg-yellow-100", text: "text-yellow-700", bar: "bg-yellow-500", border: "border-yellow-300" },
    red: { bg: "bg-red-100", text: "text-red-700", bar: "bg-red-500", border: "border-red-300" },
  };
  const c = colorMap[score.color];

  return (
    <div className={`mt-3 rounded-xl border ${c.border} ${c.bg} p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">⭐</span>
          <span className="font-bold text-gray-800 text-sm">Reputation Score</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-extrabold ${c.text}`}>{score.score}</span>
          <span className="text-gray-400 text-sm">/100</span>
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${c.bg} ${c.text} border ${c.border}`}>
            {score.grade} — {score.label}
          </span>
        </div>
      </div>

      {/* Score Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div
          className={`${c.bar} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${score.score}%` }}
        />
      </div>

      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="text-xs text-gray-500 hover:text-gray-700 transition"
      >
        {showBreakdown ? "Hide breakdown ▲" : "View breakdown ▼"}
      </button>

      {showBreakdown && (
        <div className="mt-3 space-y-2">
          {score.breakdown.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{item.label}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`${c.bar} h-1.5 rounded-full`}
                    style={{ width: `${(item.points / item.max) * 100}%` }}
                  />
                </div>
                <span className={`font-bold ${c.text}`}>{item.points}/{item.max}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}