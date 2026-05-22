"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../utils/contract";
import { useWallet } from "../../context/WalletContext";
import { verifyProof } from "../../utils/zkp";
import ReputationScore from "../../components/ReputationScore";

export default function VerifyPage() {
  const [tokenId, setTokenId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verifiers, setVerifiers] = useState([]);
  const [activeTab, setActiveTab] = useState("token");
  const [proofString, setProofString] = useState("");
  const [zkResult, setZkResult] = useState(null);
  const { account, contract: walletContract } = useWallet();

  const handleVerify = async () => {
    if (!tokenId.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_ALCHEMY_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      if (walletContract) {
        try {
          const tx = await walletContract.verifyCredential(Number(tokenId));
          await tx.wait();
        } catch (_) {}
      }

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

      const expiresAt = Number(cred[6]);
      const isExpired = expiresAt > 0 && expiresAt < Math.floor(Date.now() / 1000);

      setResult({
        tokenId: cred[0].toString(),
        issuer: cred[1],
        recipient: cred[2],
        ipfsHash: cred[3],
        issuedAt: new Date(Number(cred[5]) * 1000).toLocaleDateString(),
        expiresAt: expiresAt > 0 ? new Date(expiresAt * 1000).toLocaleDateString() : "No Expiry",
        isExpired,
        revoked: cred[7],
        credentialType: cred[8],
        metadata,
      });

      const verifierList = [];
      try {
        let i = 0;
        while (true) {
          const verifier = await contract.tokenVerifiers(Number(tokenId), i);
          const timestamp = await contract.verificationLog(verifier, Number(tokenId));
          verifierList.push({
            address: verifier,
            time: new Date(Number(timestamp) * 1000).toLocaleString()
          });
          i++;
        }
      } catch (_) {}
      setVerifiers(verifierList);

    } catch (err) {
      setError("Verification failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleZKVerify = () => {
    const result = verifyProof(proofString);
    setZkResult(result);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">Verify Credential</h1>
      <p className="text-gray-500 mb-6">Verify by Token ID or paste a ZK Proof string.</p>
      <div className="bg-white rounded-2xl shadow-lg p-8">

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setActiveTab("token"); setZkResult(null); }}
            className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${activeTab === "token" ? "bg-blue-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            Token ID Verify
          </button>
          <button
            onClick={() => { setActiveTab("zkp"); setResult(null); }}
            className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${activeTab === "zkp" ? "bg-purple-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            🔐 ZK Proof Verify
          </button>
        </div>

        {/* ZKP Tab */}
        {activeTab === "zkp" && (
          <div>
            <textarea
              value={proofString}
              onChange={(e) => setProofString(e.target.value)}
              placeholder="Paste your ZK proof string here..."
              rows={4}
              className="w-full border rounded-lg px-4 py-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
            />
            <button
              onClick={handleZKVerify}
              className="w-full bg-purple-700 text-white py-3 rounded-lg font-bold hover:bg-purple-800 transition mb-4"
            >
              Verify ZK Proof
            </button>
            {zkResult && (
              <div className={`rounded-xl border-2 p-6 ${zkResult.valid ? "border-green-400 bg-green-50" : "border-red-400 bg-red-50"}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{zkResult.valid ? "✅" : "❌"}</span>
                  <div>
                    <p className={`text-2xl font-bold ${zkResult.valid ? "text-green-700" : "text-red-700"}`}>
                      {zkResult.valid ? "VALID PROOF" : "INVALID PROOF"}
                    </p>
                    {zkResult.proofId && (
                      <p className="text-xs text-gray-500 font-mono">Proof ID: {zkResult.proofId}</p>
                    )}
                  </div>
                </div>
                {zkResult.valid && (
                  <div className="space-y-2 text-sm">
                    <p><span className="font-semibold">Credential Type:</span> {zkResult.credentialType}</p>
                    <p><span className="font-semibold">Issuer Verified:</span> ✓</p>
                    <p><span className="font-semibold">Holder:</span> {zkResult.holderAddress}</p>
                    <p><span className="font-semibold">Proof Generated:</span> {new Date(zkResult.proofTimestamp).toLocaleString()}</p>
                    <div className="mt-3 bg-green-100 rounded-lg p-3">
                      <p className="text-xs text-green-700 font-semibold">🔒 Zero Knowledge Verified</p>
                      <p className="text-xs text-green-600 mt-1">Name, institution, and personal details remain private.</p>
                    </div>
                  </div>
                )}
                {!zkResult.valid && (
                  <p className="text-red-600 text-sm">{zkResult.error}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Token ID Tab */}
        {activeTab === "token" && (
          <div>
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
              <div className={`rounded-xl border-2 p-6 ${result.revoked || result.isExpired ? "border-red-400 bg-red-50" : "border-green-400 bg-green-50"}`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">{result.revoked ? "❌" : result.isExpired ? "⏰" : "✅"}</span>
                  <div>
                    <p className={`text-2xl font-bold ${result.revoked || result.isExpired ? "text-red-700" : "text-green-700"}`}>
                      {result.revoked ? "REVOKED" : result.isExpired ? "EXPIRED" : "VALID"}
                    </p>
                    <p className="text-sm text-gray-500">Credential {result.tokenId} {result.credentialType}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {result.metadata && (
                    <>
                      <p><span className="font-semibold">Title:</span> {result.metadata.name}</p>
                      <p><span className="font-semibold">Recipient:</span> {result.metadata.attributes?.recipientName}</p>
                      <p><span className="font-semibold">Institution:</span> {result.metadata.attributes?.institution}</p>
                      <p><span className="font-semibold">Issue Date:</span> {result.metadata.attributes?.issueDate}</p>
                      <p><span className="font-semibold">Expiry:</span> {result.expiresAt}</p>
                    </>
                  )}
                  <p className="font-mono text-xs text-gray-500 break-all mt-2">Issuer: {result.issuer}</p>
                  <p className="font-mono text-xs text-gray-500 break-all">Recipient: {result.recipient}</p>
                  <p className="text-xs text-gray-400 mt-2">IPFS: ipfs://{result.ipfsHash}</p>
                  <ReputationScore cred={result} metadata={result.metadata} tokenId={result.tokenId} />
                  {verifiers.length > 0 && (
                    <div className="mt-4 border-t pt-3">
                      <p className="font-semibold text-sm text-gray-700 mb-2">Verification Audit Trail ({verifiers.length} checks)</p>
                      <div className="space-y-1">
                        {verifiers.map((v, i) => (
                          <div key={i} className="text-xs text-gray-500">
                            <span className="font-mono">{v.address.slice(0,6)}...{v.address.slice(-4)}</span>
                            <span className="ml-2">{v.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}