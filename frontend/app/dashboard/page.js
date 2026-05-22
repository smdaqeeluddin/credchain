"use client";
import { useState, useEffect } from "react";
import { useWallet } from "../../context/WalletContext";
import DownloadCertificate from "../../components/DownloadCertificate";
import ReputationScore from "../../components/ReputationScore";

function CredentialCard({ tokenId, contract }) {
  const [cred, setCred] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [showQR, setShowQR] = useState(false);

  const verifyUrl =
    typeof window !== "undefined"
      ? window.location.origin + "/verify?id=" + tokenId
      : "";

  useEffect(() => {
    (async () => {
      const data = await contract.getCredential(Number(tokenId));
      setCred(data);
      try {
        const res = await fetch(
          "https://gateway.pinata.cloud/ipfs/" + data[3]
        );
        setMetadata(await res.json());
      } catch (_) {}
    })();
  }, [tokenId, contract]);

  if (!cred)
    return <div className="animate-pulse bg-gray-200 h-40 rounded-xl" />;

  return (
    <div className={`bg-white rounded-xl shadow border-l-4 ${cred[7] ? "border-red-400" : "border-green-500"} p-5`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="font-bold text-lg text-blue-900">
            {metadata ? metadata.name : "Loading..."}
          </p>
          <p className="text-sm text-gray-500">
            {cred[8]} Token {tokenId}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${cred[7] ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {cred[7] ? "Revoked" : "Valid"}
        </span>
      </div>
      {metadata && (
  <div className="text-sm text-gray-600 space-y-1 mb-3">
    <p>Institution: {metadata.attributes?.institution}</p>
    <p>Issued: {metadata.attributes?.issueDate}</p>
  </div>
)}
{cred && metadata && (
  <ReputationScore cred={cred} metadata={metadata} tokenId={tokenId} />
)}
      <div className="flex gap-2 mt-3 flex-wrap">
  <button
    onClick={() => setShowQR(!showQR)}
    className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition"
  >
    {showQR ? "Hide" : "Share QR"}
  </button>
  <button
    onClick={() => window.open("/verify?id=" + tokenId, "_blank")}
    className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition"
  >
    Open Verify Link
  </button>
  {metadata && (
    <DownloadCertificate cred={cred} metadata={metadata} tokenId={tokenId} />
  )}
</div>
      {showQR && (
        <div className="mt-4 flex flex-col items-center">
          <img
            src={"https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=" + encodeURIComponent(verifyUrl)}
            alt="QR Code"
            width={160}
            height={160}
          />
          <p className="text-xs text-gray-400 mt-2">Scan to verify</p>
          <p className="text-xs font-mono break-all text-gray-500 mt-1">{verifyUrl}</p>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { account, contract, connectWallet } = useWallet();
  const [tokenIds, setTokenIds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contract || !account) return;
    (async () => {
      setLoading(true);
      const ids = await contract.getHolderCredentials(account);
      setTokenIds(ids.map((id) => id.toString()));
      setLoading(false);
    })();
  }, [contract, account]);

  if (!account)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Connect your wallet to view your credentials.
          </p>
          <button
            onClick={connectWallet}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold text-blue-900 mb-2">My Credentials</h1>
      <p className="text-gray-500 mb-6 font-mono text-sm">{account}</p>
      {loading && (
        <p className="text-gray-400">Loading your credentials from blockchain...</p>
      )}
      {!loading && tokenIds.length === 0 && (
        <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">
          <p className="text-5xl mb-4">🎓</p>
          <p>No credentials found for this wallet.</p>
          <p className="text-sm mt-2">
            Ask your institution to issue one to your address.
          </p>
        </div>
      )}
      <div className="grid gap-4">
        {tokenIds.map((id) => (
          <CredentialCard key={id} tokenId={id} contract={contract} />
        ))}
      </div>
    </div>
  );
}