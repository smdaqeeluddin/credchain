"use client";
import { useState, useEffect } from "react";
import { useWallet } from "../../context/WalletContext";

export default function RequestsPage() {
  const { account, connectWallet } = useWallet();
  const [activeTab, setActiveTab] = useState("send");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const storageKey = account ? `credchain_requests_${account.toLowerCase()}` : null;

  useEffect(() => {
    if (!account) return;
    loadRequests();
  }, [account]);

  const loadRequests = () => {
    setLoading(true);
    try {
      const allKeys = Object.keys(localStorage);
      const incoming = [];
      allKeys.forEach(key => {
        if (key.startsWith("credchain_req_to_")) {
          const target = key.replace("credchain_req_to_", "").split("_")[0];
          if (target.toLowerCase() === account.toLowerCase()) {
            const data = JSON.parse(localStorage.getItem(key));
            incoming.push(data);
          }
        }
      });
      setRequests(incoming);
    } catch (_) {}
    setLoading(false);
  };

  const handleSendRequest = async () => {
    if (!recipientAddress || !companyName || !purpose) return alert("Fill all fields");
    setSending(true);
    try {
      const request = {
        id: Date.now().toString(),
        from: account,
        fromCompany: companyName,
        to: recipientAddress.toLowerCase(),
        purpose,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };
      const key = `credchain_req_to_${recipientAddress.toLowerCase()}_${request.id}`;
      localStorage.setItem(key, JSON.stringify(request));
      setSent(true);
      setRecipientAddress("");
      setCompanyName("");
      setPurpose("");
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleRespond = (requestId, response) => {
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (key.includes(requestId)) {
        const data = JSON.parse(localStorage.getItem(key));
        data.status = response;
        localStorage.setItem(key, JSON.stringify(data));
      }
    });
    loadRequests();
  };

  if (!account) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-4">📬</p>
        <p className="text-gray-600 mb-4">Connect wallet to access credential requests.</p>
        <button onClick={connectWallet} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Connect Wallet
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold mb-3">
          CREDENTIAL REQUESTS
        </div>
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Verification Requests</h1>
        <p className="text-gray-500">Consent-based credential verification. GDPR compliant.</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("send")}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${activeTab === "send" ? "bg-purple-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Send Request
        </button>
        <button
          onClick={() => { setActiveTab("inbox"); loadRequests(); }}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${activeTab === "inbox" ? "bg-purple-700 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Inbox {requests.filter(r => r.status === "PENDING").length > 0 && (
            <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {requests.filter(r => r.status === "PENDING").length}
            </span>
          )}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        {activeTab === "send" && (
          <div>
            <p className="text-sm text-gray-500 mb-6">Request a candidate to share their verified credentials with you.</p>

            {sent && (
              <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-4 text-green-700 font-semibold">
                Request sent successfully!
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Company Name</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Infosys HR Team"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Wallet Address</label>
                <input
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full border rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Verification</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select purpose</option>
                  <option value="Job Application">Job Application</option>
                  <option value="Background Check">Background Check</option>
                  <option value="Loan Application">Loan Application</option>
                  <option value="Visa Application">Visa Application</option>
                  <option value="University Admission">University Admission</option>
                </select>
              </div>
              <button
                onClick={handleSendRequest}
                disabled={sending}
                className="w-full bg-purple-700 text-white py-3 rounded-xl font-bold hover:bg-purple-800 transition disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Verification Request"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "inbox" && (
          <div>
            <p className="text-sm text-gray-500 mb-6">Verification requests sent to your wallet.</p>

            {loading && <p className="text-gray-400 text-sm">Loading...</p>}

            {!loading && requests.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <p className="text-4xl mb-3">📭</p>
                <p>No requests yet.</p>
              </div>
            )}

            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className={`border rounded-xl p-5 ${req.status === "PENDING" ? "border-purple-200 bg-purple-50" : req.status === "APPROVED" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-gray-800">{req.fromCompany}</p>
                      <p className="text-xs text-gray-500 font-mono">{req.from.slice(0, 8)}...{req.from.slice(-6)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${req.status === "PENDING" ? "bg-purple-100 text-purple-700" : req.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Purpose: <span className="font-semibold">{req.purpose}</span></p>
                  <p className="text-xs text-gray-400 mb-4">{new Date(req.createdAt).toLocaleString()}</p>

                  {req.status === "PENDING" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleRespond(req.id, "APPROVED")}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRespond(req.id, "DENIED")}
                        className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition text-sm"
                      >
                        Deny
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}