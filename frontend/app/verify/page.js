"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../utils/contract";

export default function VerifyPage() {
  const [tokenId, setTokenId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    if (!tokenId.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_ALCHEMY_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const cred = await contract.getCredential(Number(tokenId));

      if (cred[5].toString() === "0") {
        setError("Credential not found. Token ID does not exist.");
        setLoading(false);
        return;
      }

      let metadata = null;
      try {
        const ipfsRes = await fetch(`https://gateway.pinata.cloud/ipfs/${cred[3]}`);
        metadata = await ipfsRes.json();
      } catch (_) {}

      setResult({
        tokenId: cred[0].toString(),
        issuer: cred[1],
        recipient: cred[2],
        ipfsHash: cred[3],
        issuedAt: new Date(Number(cred[5]) * 1000).toLocaleDateString(),
        revoked: cred[6],
        credentialType: cred[7],
        metadata,
      });
    } catch (err) {
      setError("Verification failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">Verify Credential</h1>
      <p className="text-gray-500 mb-6">Enter a Credential Token ID to check its authenticity. No login required.</p>
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex gap-3 mb-6">
          <input
            value={tokenId}
            onChange={(e) => setTokenId(e.target.value)}
            placeholder="Enter Token ID (e.g. 1)"
            className="flex-1 border rounded-lg px-4 py-3 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleVerify}
            disabled={loading}
            className="bg-blue-700 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-800 transition disabled:opacity-50"
          >
            {loading ? "Checking..." : "Verify"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
        )}

        {result && (
          <div className={`rounded-xl border-2 p-6 ${result.revoked ? "border-red-400 bg-red-50" : "border-green-400 bg-green-50"}`}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{result.revoked ? "❌" : "✅"}</span>
              <div>
                <p className={`text-2xl font-bold ${result.revoked ? "text-red-700" : "text-green-700"}`}>
                  {result.revoked ? "REVOKED" : "VALID"}
                </p>
                <p className="text-sm text-gray-500">Credential #{result.tokenId} • {result.credentialType}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {result.metadata && (
                <>
                  <p><span className="font-semibold">Title:</span> {result.metadata.name}</p>
                  <p><span className="font-semibold">Recipient:</span> {result.metadata.attributes?.recipientName}</p>
                  <p><span className="font-semibold">Institution:</span> {result.metadata.attributes?.institution}</p>
                  <p><span className="font-semibold">Issue Date:</span> {result.metadata.attributes?.issueDate}</p>
                </>
              )}
              <p className="font-mono text-xs text-gray-500 break-all mt-2">Issuer: {result.issuer}</p>
              <p className="font-mono text-xs text-gray-500 break-all">Recipient: {result.recipient}</p>
              <p className="text-xs text-gray-400 mt-2">IPFS: ipfs://{result.ipfsHash}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}