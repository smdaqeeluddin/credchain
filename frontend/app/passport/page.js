"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../utils/contract";
import { calculateReputationScore } from "../../utils/reputation";

export default function PassportPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [overallScore, setOverallScore] = useState(null);

  const handleSearch = async () => {
    if (!walletAddress.trim()) return;
    setLoading(true);
    setError(null);
    setCredentials([]);
    setSearched(false);
    try {
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_ALCHEMY_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const ids = await contract.getHolderCredentials(walletAddress);

      const creds = await Promise.all(
        ids.map(async (id) => {
          const cred = await contract.getCredential(Number(id));
          let metadata = null;
          try {
            const res = await fetch("https://gateway.pinata.cloud/ipfs/" + cred[3]);
            metadata = await res.json();
          } catch (_) {}

          let verifierCount = 0;
          try {
            let i = 0;
            while (true) {
              await contract.tokenVerifiers(Number(id), i);
              verifierCount++;
              i++;
            }
          } catch (_) {}

          const expiresAt = Number(cred[6]);
          const isExpired = expiresAt > 0 && expiresAt < Math.floor(Date.now() / 1000);
          const status = cred[7] ? "REVOKED" : isExpired ? "EXPIRED" : "VALID";
          const rep = calculateReputationScore(cred, verifierCount, metadata);

          return {
            tokenId: id.toString(),
            cred,
            metadata,
            status,
            credentialType: cred[8],
            issuedAt: new Date(Number(cred[5]) * 1000).toLocaleDateString(),
            institution: metadata?.attributes?.institution || "Unknown",
            reputation: rep,
          };
        })
      );

      setCredentials(creds);
      if (creds.length > 0) {
        const avg = Math.round(creds.reduce((sum, c) => sum + c.reputation.score, 0) / creds.length);
        setOverallScore(avg);
      }
      setSearched(true);
    } catch (err) {
      setError("Failed to load: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1 mb-4">
            <span className="text-blue-300 text-xs font-mono">CAREER PASSPORT</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2">Blockchain Career Passport</h1>
          <p className="text-blue-300 text-sm max-w-md mx-auto">
            Enter any wallet address to view their complete verified credential history.
          </p>
        </div>

        {/* Search */}
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 mb-8">
          <div className="flex gap-3">
            <input
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="Enter wallet address (0x...)"
              className="flex-1 bg-white/10 border border-white/20 text-white placeholder-blue-300 rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-3 rounded-lg font-bold transition disabled:opacity-50"
            >
              {loading ? "Loading..." : "View Passport"}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-400 rounded-lg p-4 text-red-300 mb-6">{error}</div>
        )}

        {searched && credentials.length === 0 && (
          <div className="text-center text-blue-300 py-10">
            <p className="text-4xl mb-3">🎓</p>
            <p>No credentials found for this wallet.</p>
          </div>
        )}

        {credentials.length > 0 && (
          <div>
            {/* Overall Score Card */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-blue-300 text-xs mb-1">WALLET</p>
                  <p className="text-white font-mono text-sm">{walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-300 text-xs mb-1">OVERALL TRUST SCORE</p>
                  <p className="text-4xl font-extrabold text-white">{overallScore}<span className="text-blue-300 text-lg">/100</span></p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-2xl font-bold text-white">{credentials.length}</p>
                  <p className="text-blue-300 text-xs">Total Credentials</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-2xl font-bold text-green-400">{credentials.filter(c => c.status === "VALID").length}</p>
                  <p className="text-blue-300 text-xs">Valid</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3">
                  <p className="text-2xl font-bold text-yellow-400">{credentials.filter(c => c.status !== "VALID").length}</p>
                  <p className="text-blue-300 text-xs">Inactive</p>
                </div>
              </div>
            </div>

            {/* Credentials Timeline */}
            <div className="space-y-4">
              {credentials.map((cred, i) => (
                <div key={i} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-white text-lg">{cred.metadata?.name || "Credential"}</p>
                      <p className="text-blue-300 text-sm">{cred.institution}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        cred.status === "VALID" ? "bg-green-500/20 text-green-400" :
                        cred.status === "REVOKED" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {cred.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
                    <div>
                      <p className="text-blue-400">TYPE</p>
                      <p className="text-white font-semibold">{cred.credentialType}</p>
                    </div>
                    <div>
                      <p className="text-blue-400">ISSUED</p>
                      <p className="text-white font-semibold">{cred.issuedAt}</p>
                    </div>
                    <div>
                      <p className="text-blue-400">TOKEN</p>
                      <p className="text-white font-semibold font-mono">#{cred.tokenId}</p>
                    </div>
                  </div>

                  {/* Reputation Bar */}
                  <div className="flex items-center gap-3">
                    <span className="text-blue-300 text-xs">Trust Score</span>
                    <div className="flex-1 bg-white/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          cred.reputation.color === "green" ? "bg-green-400" :
                          cred.reputation.color === "yellow" ? "bg-yellow-400" : "bg-red-400"
                        }`}
                        style={{ width: `${cred.reputation.score}%` }}
                      />
                    </div>
                    <span className="text-white font-bold text-sm">{cred.reputation.score}/100</span>
                    <span className={`text-xs font-bold ${
                      cred.reputation.color === "green" ? "text-green-400" :
                      cred.reputation.color === "yellow" ? "text-yellow-400" : "text-red-400"
                    }`}>
                      {cred.reputation.grade}
                    </span>
                  </div>

                  <button
                    onClick={() => window.open(`/verify?id=${cred.tokenId}`, "_blank")}
                    className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition"
                  >
                    Verify on blockchain →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}