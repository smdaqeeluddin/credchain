"use client";
import { useState } from "react";

export default function EmployerPage() {
  const [tokenId, setTokenId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bulkInput, setBulkInput] = useState("");
  const [bulkResults, setBulkResults] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("single");

  const handleSingleVerify = async () => {
    if (!tokenId.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(`/api/check/${tokenId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkVerify = async () => {
    const ids = bulkInput.split("\n").map(id => id.trim()).filter(Boolean);
    if (!ids.length) return;
    setBulkLoading(true);
    setBulkResults([]);
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await fetch(`/api/check/${id}`);
          const data = await res.json();
          return { tokenId: id, ...data };
        } catch {
          return { tokenId: id, error: "Failed", valid: false, status: "ERROR" };
        }
      })
    );
    setBulkResults(results);
    setBulkLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold mb-3">
          EMPLOYER PORTAL
        </div>
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Credential Verification</h1>
        <p className="text-gray-500">Instantly verify candidate credentials. No login required.</p>
      </div>

      <div className="bg-gray-900 text-green-400 rounded-xl p-4 mb-6 font-mono text-xs">
        <p className="text-gray-400 mb-1">REST API — integrate into your HR system:</p>
        <p>GET /api/check/{"{tokenId}"}</p>
        <p className="text-gray-500 mt-1">Returns: status, issuer, credentialType, valid</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("single")}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${activeTab === "single" ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Single Verify
        </button>
        <button
          onClick={() => setActiveTab("bulk")}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${activeTab === "bulk" ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Bulk Verify
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        {activeTab === "single" && (
          <div>
            <p className="text-sm text-gray-500 mb-4">Enter the candidate's Credential Token ID</p>
            <div className="flex gap-3 mb-6">
              <input
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                placeholder="Token ID (e.g. 2)"
                className="flex-1 border rounded-lg px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSingleVerify}
                disabled={loading}
                className="bg-blue-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-800 transition disabled:opacity-50"
              >
                {loading ? "Checking..." : "Verify"}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
            )}

            {result && (
              <div className={`rounded-xl border-2 p-6 ${result.valid ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{result.valid ? "✅" : "❌"}</span>
                  <div>
                    <p className={`text-2xl font-bold ${result.valid ? "text-green-700" : "text-red-700"}`}>
                      {result.status}
                    </p>
                    <p className="text-sm text-gray-500">Token {result.tokenId} - {result.credentialType}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">ISSUED</p>
                    <p className="font-semibold">{new Date(result.issuedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-gray-400 text-xs mb-1">EXPIRES</p>
                    <p className="font-semibold">{result.expiresAt ? new Date(result.expiresAt).toLocaleDateString() : "No Expiry"}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 col-span-2">
                    <p className="text-gray-400 text-xs mb-1">ISSUER</p>
                    <p className="font-mono text-xs break-all">{result.issuer}</p>
                  </div>
                </div>
                <button
                  onClick={() => window.open(`https://sepolia.etherscan.io/address/${result.issuer}`, "_blank")}
                  className="mt-3 text-xs text-blue-600 hover:underline"
                >
                  View issuer on Etherscan →
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "bulk" && (
          <div>
            <p className="text-sm text-gray-500 mb-4">Enter one Token ID per line to verify multiple candidates</p>
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder={"1\n2\n3"}
              rows={5}
              className="w-full border rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <button
              onClick={handleBulkVerify}
              disabled={bulkLoading}
              className="w-full bg-blue-700 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition disabled:opacity-50 mb-6"
            >
              {bulkLoading ? "Verifying..." : "Verify All"}
            </button>

            {bulkResults.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="font-semibold text-gray-700">{bulkResults.length} results</p>
                  <div className="flex gap-3 text-sm">
                    <span className="text-green-600 font-bold">{bulkResults.filter(r => r.valid).length} Valid</span>
                    <span className="text-red-600 font-bold">{bulkResults.filter(r => !r.valid).length} Invalid</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {bulkResults.map((r, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${r.valid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                      <div>
                        <span className="font-mono text-sm font-bold">Token {r.tokenId}</span>
                        {r.credentialType && <span className="text-gray-500 text-xs ml-2">{r.credentialType}</span>}
                      </div>
                      <span className={`text-sm font-bold ${r.valid ? "text-green-700" : "text-red-700"}`}>
                        {r.valid ? "✅ VALID" : "❌ " + r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}