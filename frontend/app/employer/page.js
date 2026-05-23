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
    setLoading(true); setResult(null); setError(null);
    try {
      const res = await fetch(`/api/check/${tokenId}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleBulkVerify = async () => {
    const ids = bulkInput.split("\n").map(id => id.trim()).filter(Boolean);
    if (!ids.length) return;
    setBulkLoading(true); setBulkResults([]);
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await fetch(`/api/check/${id}`);
          const data = await res.json();
          return { tokenId: id, ...data };
        } catch { return { tokenId: id, error: "Failed", valid: false, status: "ERROR" }; }
      })
    );
    setBulkResults(results); setBulkLoading(false);
  };

  const S = {
    page: {
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 30% 20%, rgba(15,36,96,0.4) 0%, transparent 60%), #020818",
      fontFamily: "'DM Sans', sans-serif",
      padding: "48px 24px",
    },
    wrapper: { maxWidth: "720px", margin: "0 auto" },
    card: {
      background: "linear-gradient(135deg, rgba(10,26,74,0.8), rgba(5,15,46,0.9))",
      border: "1px solid rgba(201,168,76,0.15)",
      borderRadius: "20px", padding: "32px",
    },
    input: {
      flex: 1, background: "rgba(5,15,46,0.8)",
      border: "1px solid rgba(201,168,76,0.2)",
      borderRadius: "10px", color: "white",
      fontFamily: "'DM Mono', monospace",
      fontSize: "14px", padding: "13px 16px", outline: "none",
    },
    btnGold: {
      background: "linear-gradient(135deg, #c9a84c, #d4b96a)",
      border: "none", borderRadius: "10px",
      padding: "13px 28px", fontSize: "14px",
      fontWeight: "600", color: "#020818",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
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

  return (
    <div style={S.page}>
      <div style={S.wrapper}>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: "20px", padding: "4px 14px", marginBottom: "16px",
            fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", color: "#c9a84c",
          }}>✦ EMPLOYER PORTAL</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "36px", fontWeight: "700", color: "white", marginBottom: "8px",
          }}>Credential Verification</h1>
          <p style={{ fontSize: "14px", color: "rgba(180,195,230,0.6)" }}>
            Instantly verify candidate credentials. No login required.
          </p>
        </div>

        {/* API Banner */}
        <div style={{
          background: "rgba(2,8,24,0.9)",
          border: "1px solid rgba(52,211,153,0.2)",
          borderRadius: "14px", padding: "16px 20px",
          marginBottom: "24px", fontFamily: "'DM Mono', monospace",
        }}>
          <p style={{ fontSize: "10px", color: "rgba(52,211,153,0.5)", marginBottom: "6px", letterSpacing: "0.08em" }}>
            REST API — INTEGRATE INTO YOUR HR SYSTEM
          </p>
          <p style={{ fontSize: "13px", color: "#34d399" }}>
            GET /api/check/<span style={{ color: "#fbbf24" }}>{"{tokenId}"}</span>
          </p>
          <p style={{ fontSize: "11px", color: "rgba(52,211,153,0.4)", marginTop: "4px" }}>
            Returns: status, issuer, credentialType, valid, issuedAt
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <button onClick={() => setActiveTab("single")} style={activeTab === "single" ? S.tabActive : S.tabInactive}>
            Single Verify
          </button>
          <button onClick={() => setActiveTab("bulk")} style={activeTab === "bulk" ? S.tabActive : S.tabInactive}>
            Bulk Verify
          </button>
        </div>

        <div style={S.card}>

          {/* Single Tab */}
          {activeTab === "single" && (
            <div>
              <p style={{ fontSize: "13px", color: "rgba(180,195,230,0.5)", marginBottom: "20px" }}>
                Enter the candidate's Credential Token ID
              </p>
              <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                <input
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSingleVerify()}
                  placeholder="Token ID (e.g. 2)"
                  style={S.input}
                  onFocus={e => e.target.style.borderColor = "#c9a84c"}
                  onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
                />
                <button
                  onClick={handleSingleVerify}
                  disabled={loading}
                  style={{ ...S.btnGold, opacity: loading ? 0.5 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                >
                  {loading ? "Checking..." : "Verify"}
                </button>
              </div>

              {error && (
                <div style={{
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.3)",
                  borderRadius: "10px", padding: "14px 16px",
                  color: "#f87171", fontSize: "13px", marginBottom: "16px",
                }}>{error}</div>
              )}

              {result && (
                <div style={{
                  borderRadius: "16px",
                  border: result.valid ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(248,113,113,0.3)",
                  background: result.valid ? "rgba(52,211,153,0.05)" : "rgba(248,113,113,0.05)",
                  padding: "28px",
                }}>
                  {/* Status */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                    <div style={{
                      width: "56px", height: "56px", borderRadius: "14px",
                      background: result.valid ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px",
                    }}>
                      {result.valid ? "✅" : "❌"}
                    </div>
                    <div>
                      <p style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "28px", fontWeight: "700",
                        color: result.valid ? "#34d399" : "#f87171", lineHeight: "1",
                      }}>{result.status}</p>
                      <p style={{ fontSize: "12px", color: "rgba(180,195,230,0.5)", marginTop: "4px" }}>
                        Token #{result.tokenId} · {result.credentialType}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                    {[
                      ["ISSUED", new Date(result.issuedAt).toLocaleDateString()],
                      ["EXPIRES", result.expiresAt ? new Date(result.expiresAt).toLocaleDateString() : "No Expiry"],
                    ].map(([k, v]) => (
                      <div key={k} style={{ background: "rgba(10,26,74,0.6)", borderRadius: "10px", padding: "12px 14px" }}>
                        <p style={{ fontSize: "10px", color: "rgba(201,168,76,0.6)", fontWeight: "600", letterSpacing: "0.06em", marginBottom: "4px" }}>{k}</p>
                        <p style={{ fontSize: "13px", color: "white", fontWeight: "500" }}>{v}</p>
                      </div>
                    ))}
                    <div style={{ background: "rgba(10,26,74,0.6)", borderRadius: "10px", padding: "12px 14px", gridColumn: "span 2" }}>
                      <p style={{ fontSize: "10px", color: "rgba(201,168,76,0.6)", fontWeight: "600", letterSpacing: "0.06em", marginBottom: "4px" }}>ISSUER</p>
                      <p style={{ fontSize: "11px", color: "rgba(180,195,230,0.6)", fontFamily: "'DM Mono', monospace", wordBreak: "break-all" }}>{result.issuer}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => window.open(`https://sepolia.etherscan.io/address/${result.issuer}`, "_blank")}
                    style={{
                      background: "transparent", border: "none", padding: 0,
                      fontSize: "12px", color: "#c9a84c", cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif", textDecoration: "underline",
                    }}
                  >
                    View issuer on Etherscan →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bulk Tab */}
          {activeTab === "bulk" && (
            <div>
              <p style={{ fontSize: "13px", color: "rgba(180,195,230,0.5)", marginBottom: "16px" }}>
                Enter one Token ID per line to verify multiple candidates
              </p>
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder={"1\n2\n3"}
                rows={5}
                style={{
                  width: "100%", background: "rgba(5,15,46,0.8)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "10px", color: "white",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "13px", padding: "13px 16px",
                  outline: "none", resize: "vertical",
                  marginBottom: "12px", boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "#c9a84c"}
                onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
              />
              <button
                onClick={handleBulkVerify}
                disabled={bulkLoading}
                style={{
                  ...S.btnGold, width: "100%", marginBottom: "24px",
                  opacity: bulkLoading ? 0.5 : 1, cursor: bulkLoading ? "not-allowed" : "pointer",
                }}
              >
                {bulkLoading ? "Verifying..." : "Verify All"}
              </button>

              {bulkResults.length > 0 && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <p style={{ fontSize: "13px", fontWeight: "600", color: "white" }}>
                      {bulkResults.length} results
                    </p>
                    <div style={{ display: "flex", gap: "16px", fontSize: "12px" }}>
                      <span style={{ color: "#34d399", fontWeight: "700" }}>
                        {bulkResults.filter(r => r.valid).length} Valid
                      </span>
                      <span style={{ color: "#f87171", fontWeight: "700" }}>
                        {bulkResults.filter(r => !r.valid).length} Invalid
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {bulkResults.map((r, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 16px", borderRadius: "10px",
                        background: r.valid ? "rgba(52,211,153,0.05)" : "rgba(248,113,113,0.05)",
                        border: r.valid ? "1px solid rgba(52,211,153,0.2)" : "1px solid rgba(248,113,113,0.2)",
                      }}>
                        <div>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", fontWeight: "600", color: "#c9a84c" }}>
                            Token #{r.tokenId}
                          </span>
                          {r.credentialType && (
                            <span style={{ fontSize: "11px", color: "rgba(180,195,230,0.4)", marginLeft: "10px" }}>
                              {r.credentialType}
                            </span>
                          )}
                        </div>
                        <span style={{
                          fontSize: "12px", fontWeight: "700",
                          color: r.valid ? "#34d399" : "#f87171",
                        }}>
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
    </div>
  );
}