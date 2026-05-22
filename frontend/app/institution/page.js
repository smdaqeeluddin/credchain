"use client";
import { useState, useEffect } from "react";
import { useWallet } from "../../context/WalletContext";

export default function InstitutionPage() {
  const { account, contract, isIssuer, issuerName, connectWallet } = useWallet();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalIssued, setTotalIssued] = useState(0);
  const [revoking, setRevoking] = useState(null);
  const [stats, setStats] = useState({ valid: 0, revoked: 0, expired: 0 });

  useEffect(() => {
    if (!contract || !account || !isIssuer) return;
    fetchCredentials();
  }, [contract, account, isIssuer]);

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const total = await contract.totalCredentials();
      setTotalIssued(Number(total));
      const totalNum = Number(total);
      const issued = [];

      for (let i = 1; i <= totalNum; i++) {
        const cred = await contract.getCredential(i);
        if (cred[1].toLowerCase() === account.toLowerCase()) {
          let metadata = null;
          try {
            const res = await fetch("https://gateway.pinata.cloud/ipfs/" + cred[3]);
            metadata = await res.json();
          } catch (_) {}

          const expiresAt = Number(cred[6]);
          const isExpired = expiresAt > 0 && expiresAt < Math.floor(Date.now() / 1000);
          const status = cred[7] ? "REVOKED" : isExpired ? "EXPIRED" : "VALID";

          issued.push({
            tokenId: i,
            recipient: cred[2],
            ipfsHash: cred[3],
            issuedAt: new Date(Number(cred[5]) * 1000).toLocaleDateString(),
            expiresAt: expiresAt > 0 ? new Date(expiresAt * 1000).toLocaleDateString() : "No Expiry",
            revoked: cred[7],
            isExpired,
            status,
            credentialType: cred[8],
            metadata,
          });
        }
      }

      setCredentials(issued);
      setStats({
        valid: issued.filter(c => c.status === "VALID").length,
        revoked: issued.filter(c => c.status === "REVOKED").length,
        expired: issued.filter(c => c.status === "EXPIRED").length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (tokenId) => {
    if (!confirm("Are you sure you want to revoke this credential?")) return;
    setRevoking(tokenId);
    try {
      const tx = await contract.revokeCredential(tokenId);
      await tx.wait();
      await fetchCredentials();
    } catch (err) {
      alert("Revoke failed: " + err.message);
    } finally {
      setRevoking(null);
    }
  };

  if (!account) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-4">🏛️</p>
        <p className="text-gray-600 mb-4">Connect your institution wallet to access the dashboard.</p>
        <button onClick={connectWallet} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Connect Wallet
        </button>
      </div>
    </div>
  );

  if (!isIssuer) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
        <p className="text-red-700 font-semibold text-lg mb-2">Access Denied</p>
        <p className="text-red-600 text-sm">This dashboard is only for approved institutions.</p>
        <p className="text-xs text-gray-500 mt-4 font-mono break-all">{account}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold mb-3">
          INSTITUTION DASHBOARD
        </div>
        <h1 className="text-3xl font-bold text-blue-900 mb-1">{issuerName}</h1>
        <p className="text-gray-500 font-mono text-sm">{account}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Issued", value: credentials.length, color: "blue" },
          { label: "Valid", value: stats.valid, color: "green" },
          { label: "Revoked", value: stats.revoked, color: "red" },
          { label: "Expired", value: stats.expired, color: "yellow" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`bg-white rounded-xl shadow p-5 border-t-4 border-${color}-400`}>
            <p className="text-gray-500 text-xs mb-1">{label}</p>
            <p className={`text-3xl font-extrabold text-${color}-600`}>{loading ? "..." : value}</p>
          </div>
        ))}
      </div>

      {/* Credentials Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-lg font-bold text-gray-800">Issued Credentials</h2>
          <button
            onClick={fetchCredentials}
            className="text-sm bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="p-10 text-center text-gray-400">
            Loading credentials from blockchain...
          </div>
        )}

        {!loading && credentials.length === 0 && (
          <div className="p-10 text-center text-gray-400">
            <p className="text-4xl mb-3">🎓</p>
            <p>No credentials issued yet.</p>
          </div>
        )}

        {!loading && credentials.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Token</th>
                  <th className="px-6 py-3 text-left">Credential</th>
                  <th className="px-6 py-3 text-left">Recipient</th>
                  <th className="px-6 py-3 text-left">Issued</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {credentials.map((cred) => (
                  <tr key={cred.tokenId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono font-bold text-blue-700">
                      #{cred.tokenId}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">{cred.metadata?.name || "Unknown"}</p>
                      <p className="text-gray-400 text-xs">{cred.credentialType}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600">{cred.metadata?.attributes?.recipientName || "Unknown"}</p>
                      <p className="font-mono text-xs text-gray-400">{cred.recipient.slice(0, 8)}...{cred.recipient.slice(-6)}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{cred.issuedAt}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        cred.status === "VALID" ? "bg-green-100 text-green-700" :
                        cred.status === "REVOKED" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {cred.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => window.open(`/verify?id=${cred.tokenId}`, "_blank")}
                          className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition"
                        >
                          View
                        </button>
                        {!cred.revoked && (
                          <button
                            onClick={() => handleRevoke(cred.tokenId)}
                            disabled={revoking === cred.tokenId}
                            className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition disabled:opacity-50"
                          >
                            {revoking === cred.tokenId ? "Revoking..." : "Revoke"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}