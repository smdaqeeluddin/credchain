"use client";
import { useState } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../utils/contract";
import { useWallet } from "../../context/WalletContext";

export default function VerifyPage() {
  const [tokenId, setTokenId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verifiers, setVerifiers] = useState([]);
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
    </div>
  );
}