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

  useEffect(() => { if (account) loadRequests(); }, [account]);

  const loadRequests = () => {
    setLoading(true);
    try {
      const incoming = [];
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("credchain_req_to_")) {
          const target = key.replace("credchain_req_to_", "").split("_")[0];
          if (target.toLowerCase() === account.toLowerCase()) {
            incoming.push(JSON.parse(localStorage.getItem(key)));
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
        id: Date.now().toString(), from: account, fromCompany: companyName,
        to: recipientAddress.toLowerCase(), purpose, status: "PENDING",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(`credchain_req_to_${recipientAddress.toLowerCase()}_${request.id}`, JSON.stringify(request));
      setSent(true);
      setRecipientAddress(""); setCompanyName(""); setPurpose("");
      setTimeout(() => setSent(false), 3000);
    } catch (err) { alert("Failed: " + err.message); }
    finally { setSending(false); }
  };

  const handleRespond = (requestId, response) => {
    Object.keys(localStorage).forEach(key => {
      if (key.includes(requestId)) {
        const data = JSON.parse(localStorage.getItem(key));
        data.status = response;
        localStorage.setItem(key, JSON.stringify(data));
      }
    });
    loadRequests();
  };

  const S = {
    page: {
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 30% 20%, rgba(15,36,96,0.4) 0%, transparent 60%), #020818",
      fontFamily: "'DM Sans', sans-serif", padding: "48px 24px",
    },
    card: {
      background: "linear-gradient(135deg, rgba(10,26,74,0.8), rgba(5,15,46,0.9))",
      border: "1px solid rgba(201,168,76,0.15)",
      borderRadius: "20px", padding: "32px",
    },
    label: {
      display: "block", fontSize: "11px", fontWeight: "600",
      letterSpacing: "0.08em", color: "rgba(201,168,76,0.8)", marginBottom: "8px",
    },
    input: {
      width: "100%", background: "rgba(5,15,46,0.8)",
      border: "1px solid rgba(201,168,76,0.2)",
      borderRadius: "10px", color: "white",
      fontFamily: "'DM Sans', sans-serif",
      fontSize: "14px", padding: "12px 16px",
      outline: "none", boxSizing: "border-box",
    },
    tabActive: {
      flex: 1, padding: "10px", borderRadius: "10px",
      border: "1px solid rgba(201,168,76,0.4)",
      background: "rgba(201,168,76,0.12)",
      color: "#e2ce94", fontWeight: "600", fontSize: "13px",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    },
    tabInactive: {
      flex: 1, padding: "10px", borderRadius: "10px",
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(255,255,255,0.03)",
      color: "rgba(180,195,230,0.5)", fontWeight: "500", fontSize: "13px",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    },
  };

  if (!account) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>📬</div>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: "700", color: "white", marginBottom: "8px" }}>
          Verification Requests
        </p>
        <p style={{ color: "rgba(180,195,230,0.6)", marginBottom: "28px", fontSize: "14px" }}>
          Connect wallet to access credential requests.
        </p>
        <button onClick={connectWallet} style={{
          background: "linear-gradient(135deg, #c9a84c, #d4b96a)", border: "none",
          borderRadius: "10px", padding: "12px 28px", fontSize: "14px",
          fontWeight: "600", color: "#020818", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        }}>Connect Wallet</button>
      </div>
    </div>
  );

  const pendingCount = requests.filter(r => r.status === "PENDING").length;

  return (
    <div style={S.page}>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: "20px", padding: "4px 14px", marginBottom: "16px",
            fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", color: "#c9a84c",
          }}>✦ CREDENTIAL REQUESTS</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "36px", fontWeight: "700", color: "white", marginBottom: "8px",
          }}>Verification Requests</h1>
          <p style={{ fontSize: "14px", color: "rgba(180,195,230,0.6)" }}>
            Consent-based credential verification. GDPR compliant.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <button onClick={() => setActiveTab("send")} style={activeTab === "send" ? S.tabActive : S.tabInactive}>
            Send Request
          </button>
          <button onClick={() => { setActiveTab("inbox"); loadRequests(); }} style={{
            ...(activeTab === "inbox" ? S.tabActive : S.tabInactive),
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}>
            Inbox
            {pendingCount > 0 && (
              <span style={{
                background: "#f87171", color: "white", borderRadius: "999px",
                padding: "1px 7px", fontSize: "10px", fontWeight: "700",
              }}>{pendingCount}</span>
            )}
          </button>
        </div>

        <div style={S.card}>

          {/* Send Tab */}
          {activeTab === "send" && (
            <div>
              <p style={{ fontSize: "13px", color: "rgba(180,195,230,0.5)", marginBottom: "24px" }}>
                Request a candidate to share their verified credentials with you.
              </p>

              {sent && (
                <div style={{
                  background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)",
                  borderRadius: "10px", padding: "14px 16px", marginBottom: "20px",
                  color: "#34d399", fontWeight: "600", fontSize: "13px",
                }}>✓ Request sent successfully!</div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <label style={S.label}>YOUR COMPANY NAME</label>
                  <input value={companyName} onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g. Infosys HR Team" style={S.input}
                    onFocus={e => e.target.style.borderColor = "#c9a84c"}
                    onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
                  />
                </div>
                <div>
                  <label style={S.label}>CANDIDATE WALLET ADDRESS</label>
                  <input value={recipientAddress} onChange={e => setRecipientAddress(e.target.value)}
                    placeholder="0x..." style={{ ...S.input, fontFamily: "'DM Mono', monospace", fontSize: "13px" }}
                    onFocus={e => e.target.style.borderColor = "#c9a84c"}
                    onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
                  />
                </div>
                <div>
                  <label style={S.label}>PURPOSE OF VERIFICATION</label>
                  <select value={purpose} onChange={e => setPurpose(e.target.value)} style={{
                    ...S.input, cursor: "pointer",
                    appearance: "none", WebkitAppearance: "none",
                  }}
                  onFocus={e => e.target.style.borderColor = "#c9a84c"}
                  onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
                  >
                    <option value="" style={{ background: "#050f2e" }}>Select purpose</option>
                    {["Job Application", "Background Check", "Loan Application", "Visa Application", "University Admission"].map(p => (
                      <option key={p} value={p} style={{ background: "#050f2e" }}>{p}</option>
                    ))}
                  </select>
                </div>

                <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)" }} />

                <button onClick={handleSendRequest} disabled={sending} style={{
                  background: sending ? "rgba(201,168,76,0.3)" : "linear-gradient(135deg, #c9a84c, #d4b96a)",
                  border: "none", borderRadius: "12px", padding: "14px",
                  fontSize: "14px", fontWeight: "600",
                  color: sending ? "rgba(2,8,24,0.4)" : "#020818",
                  cursor: sending ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', sans-serif", width: "100%",
                }}>
                  {sending ? "Sending..." : "Send Verification Request"}
                </button>
              </div>
            </div>
          )}

          {/* Inbox Tab */}
          {activeTab === "inbox" && (
            <div>
              <p style={{ fontSize: "13px", color: "rgba(180,195,230,0.5)", marginBottom: "20px" }}>
                Verification requests sent to your wallet.
              </p>

              {loading && <p style={{ color: "rgba(201,168,76,0.5)", fontSize: "13px" }}>Loading...</p>}

              {!loading && requests.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px", color: "rgba(180,195,230,0.4)" }}>
                  <p style={{ fontSize: "48px", marginBottom: "12px" }}>📭</p>
                  <p style={{ fontSize: "14px" }}>No requests yet.</p>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {requests.map((req) => {
                  const isPending = req.status === "PENDING";
                  const isApproved = req.status === "APPROVED";
                  const borderColor = isPending ? "rgba(201,168,76,0.25)" : isApproved ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)";
                  const bgColor = isPending ? "rgba(201,168,76,0.05)" : isApproved ? "rgba(52,211,153,0.05)" : "rgba(248,113,113,0.05)";
                  const statusColor = isPending ? "#c9a84c" : isApproved ? "#34d399" : "#f87171";

                  return (
                    <div key={req.id} style={{
                      border: `1px solid ${borderColor}`,
                      background: bgColor,
                      borderRadius: "14px", padding: "20px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <p style={{ fontSize: "15px", fontWeight: "600", color: "white", marginBottom: "3px" }}>
                            {req.fromCompany}
                          </p>
                          <p style={{ fontSize: "11px", color: "rgba(180,195,230,0.4)", fontFamily: "'DM Mono', monospace" }}>
                            {req.from.slice(0, 8)}...{req.from.slice(-6)}
                          </p>
                        </div>
                        <span style={{
                          background: `${statusColor}18`,
                          border: `1px solid ${statusColor}40`,
                          borderRadius: "20px", padding: "3px 10px",
                          fontSize: "10px", fontWeight: "700", color: statusColor,
                          letterSpacing: "0.06em",
                        }}>{req.status}</span>
                      </div>

                      <p style={{ fontSize: "13px", color: "rgba(180,195,230,0.6)", marginBottom: "4px" }}>
                        Purpose: <span style={{ color: "white", fontWeight: "500" }}>{req.purpose}</span>
                      </p>
                      <p style={{ fontSize: "11px", color: "rgba(180,195,230,0.3)", marginBottom: isPending ? "16px" : "0" }}>
                        {new Date(req.createdAt).toLocaleString()}
                      </p>

                      {isPending && (
                        <div style={{ display: "flex", gap: "10px" }}>
                          <button onClick={() => handleRespond(req.id, "APPROVED")} style={{
                            flex: 1, background: "rgba(52,211,153,0.1)",
                            border: "1px solid rgba(52,211,153,0.3)",
                            borderRadius: "8px", padding: "9px",
                            fontSize: "13px", fontWeight: "600", color: "#34d399",
                            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                          }}>Approve</button>
                          <button onClick={() => handleRespond(req.id, "DENIED")} style={{
                            flex: 1, background: "rgba(248,113,113,0.1)",
                            border: "1px solid rgba(248,113,113,0.3)",
                            borderRadius: "8px", padding: "9px",
                            fontSize: "13px", fontWeight: "600", color: "#f87171",
                            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                          }}>Deny</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}