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
    setLoading(true); setError(null); setCredentials([]); setSearched(false);
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
            while (true) { await contract.tokenVerifiers(Number(id), i); verifierCount++; i++; }
          } catch (_) {}
          const expiresAt = Number(cred[6]);
          const isExpired = expiresAt > 0 && expiresAt < Math.floor(Date.now() / 1000);
          const status = cred[7] ? "REVOKED" : isExpired ? "EXPIRED" : "VALID";
          const rep = calculateReputationScore(cred, verifierCount, metadata);
          return {
            tokenId: id.toString(), cred, metadata, status,
            credentialType: cred[8],
            issuedAt: new Date(Number(cred[5]) * 1000).toLocaleDateString(),
            institution: metadata?.attributes?.institution || "Unknown",
            reputation: rep,
          };
        })
      );
      setCredentials(creds);
      if (creds.length > 0) {
        setOverallScore(Math.round(creds.reduce((sum, c) => sum + c.reputation.score, 0) / creds.length));
      }
      setSearched(true);
    } catch (err) { setError("Failed to load: " + err.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 20% 30%, rgba(15,36,96,0.5) 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(201,168,76,0.06) 0%, transparent 50%), #020818",
      fontFamily: "'DM Sans', sans-serif",
      padding: "48px 24px",
    }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: "20px", padding: "4px 14px", marginBottom: "16px",
            fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", color: "#c9a84c",
          }}>✦ CAREER PASSPORT</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "42px", fontWeight: "800", color: "white",
            marginBottom: "12px", letterSpacing: "-0.02em",
          }}>Blockchain Career Passport</h1>
          <p style={{ fontSize: "14px", color: "rgba(180,195,230,0.6)", maxWidth: "440px", margin: "0 auto", lineHeight: "1.7" }}>
            Enter any wallet address to view their complete verified credential history and trust score.
          </p>
        </div>

        {/* Search */}
        <div style={{
          background: "linear-gradient(135deg, rgba(10,26,74,0.8), rgba(5,15,46,0.9))",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "20px", padding: "24px", marginBottom: "28px",
        }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <input
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter wallet address (0x...)"
              style={{
                flex: 1, background: "rgba(5,15,46,0.8)",
                border: "1px solid rgba(201,168,76,0.2)",
                borderRadius: "10px", color: "white",
                fontFamily: "'DM Mono', monospace",
                fontSize: "13px", padding: "13px 16px", outline: "none",
              }}
              onFocus={e => e.target.style.borderColor = "#c9a84c"}
              onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                background: loading ? "rgba(201,168,76,0.3)" : "linear-gradient(135deg, #c9a84c, #d4b96a)",
                border: "none", borderRadius: "10px",
                padding: "13px 24px", fontSize: "14px",
                fontWeight: "600", color: loading ? "rgba(2,8,24,0.4)" : "#020818",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
              }}
            >
              {loading ? "Loading..." : "View Passport"}
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)",
            borderRadius: "12px", padding: "14px 16px",
            color: "#f87171", fontSize: "13px", marginBottom: "20px",
          }}>{error}</div>
        )}

        {searched && credentials.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px", color: "rgba(180,195,230,0.5)" }}>
            <p style={{ fontSize: "48px", marginBottom: "12px" }}>🎓</p>
            <p style={{ fontSize: "14px" }}>No credentials found for this wallet.</p>
          </div>
        )}

        {credentials.length > 0 && (
          <div>
            {/* Overall Score Card */}
            <div style={{
              background: "linear-gradient(135deg, rgba(10,26,74,0.9), rgba(5,15,46,0.95))",
              border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: "20px", padding: "28px", marginBottom: "20px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                  <p style={{ fontSize: "10px", color: "rgba(201,168,76,0.6)", fontWeight: "600", letterSpacing: "0.08em", marginBottom: "6px" }}>WALLET</p>
                  <p style={{ fontSize: "12px", color: "rgba(180,195,230,0.7)", fontFamily: "'DM Mono', monospace" }}>
                    {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "10px", color: "rgba(201,168,76,0.6)", fontWeight: "600", letterSpacing: "0.08em", marginBottom: "6px" }}>OVERALL TRUST SCORE</p>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "48px", fontWeight: "800", lineHeight: "1" }}>
                    <span style={{ background: "linear-gradient(135deg, #e2ce94, #c9a84c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {overallScore}
                    </span>
                    <span style={{ fontSize: "20px", color: "rgba(201,168,76,0.4)" }}>/100</span>
                  </p>
                </div>
              </div>

              {/* Score bar */}
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "999px", height: "6px", marginBottom: "20px" }}>
                <div style={{
                  height: "6px", borderRadius: "999px",
                  background: "linear-gradient(90deg, #c9a84c, #e2ce94)",
                  width: `${overallScore}%`, transition: "width 1s ease",
                }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                {[
                  { label: "Total Credentials", value: credentials.length, color: "#c9a84c" },
                  { label: "Valid", value: credentials.filter(c => c.status === "VALID").length, color: "#34d399" },
                  { label: "Inactive", value: credentials.filter(c => c.status !== "VALID").length, color: "#fbbf24" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    background: "rgba(5,15,46,0.6)", borderRadius: "12px",
                    padding: "14px", textAlign: "center",
                  }}>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", fontWeight: "700", color, lineHeight: "1" }}>{value}</p>
                    <p style={{ fontSize: "11px", color: "rgba(180,195,230,0.5)", marginTop: "4px" }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Credential Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {credentials.map((cred, i) => {
                const repColor = cred.reputation.color === "green" ? "#34d399" : cred.reputation.color === "yellow" ? "#fbbf24" : "#f87171";
                const statusColor = cred.status === "VALID" ? "#34d399" : cred.status === "REVOKED" ? "#f87171" : "#fbbf24";
                return (
                  <div key={i} style={{
                    background: "linear-gradient(135deg, rgba(10,26,74,0.8), rgba(5,15,46,0.9))",
                    border: "1px solid rgba(201,168,76,0.12)",
                    borderRadius: "18px", padding: "24px",
                    position: "relative", overflow: "hidden",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.12)"; e.currentTarget.style.transform = "translateY(0)"; }}
                  >
                    {/* Left accent */}
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0,
                      width: "3px", background: statusColor, borderRadius: "18px 0 0 18px",
                    }} />

                    <div style={{ paddingLeft: "12px" }}>
                      {/* Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div>
                          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: "700", color: "white", marginBottom: "4px" }}>
                            {cred.metadata?.name || "Credential"}
                          </p>
                          <p style={{ fontSize: "12px", color: "rgba(201,168,76,0.6)" }}>{cred.institution}</p>
                        </div>
                        <span style={{
                          background: `${statusColor}18`,
                          border: `1px solid ${statusColor}40`,
                          borderRadius: "20px", padding: "3px 10px",
                          fontSize: "11px", fontWeight: "700", color: statusColor,
                          letterSpacing: "0.06em",
                        }}>{cred.status}</span>
                      </div>

                      {/* Details */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "16px" }}>
                        {[
                          ["TYPE", cred.credentialType],
                          ["ISSUED", cred.issuedAt],
                          ["TOKEN", "#" + cred.tokenId],
                        ].map(([k, v]) => (
                          <div key={k}>
                            <p style={{ fontSize: "10px", color: "rgba(201,168,76,0.5)", fontWeight: "600", letterSpacing: "0.06em", marginBottom: "3px" }}>{k}</p>
                            <p style={{ fontSize: "13px", color: "white", fontWeight: "500", fontFamily: k === "TOKEN" ? "'DM Mono', monospace" : "inherit" }}>{v}</p>
                          </div>
                        ))}
                      </div>

                      {/* Trust Score Bar */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                        <span style={{ fontSize: "11px", color: "rgba(180,195,230,0.4)", whiteSpace: "nowrap" }}>Trust Score</span>
                        <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: "999px", height: "5px" }}>
                          <div style={{
                            height: "5px", borderRadius: "999px", background: repColor,
                            width: `${cred.reputation.score}%`,
                          }} />
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: repColor }}>{cred.reputation.score}</span>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: repColor }}>{cred.reputation.grade}</span>
                      </div>

                      <button
                        onClick={() => window.open(`/verify?id=${cred.tokenId}`, "_blank")}
                        style={{
                          background: "transparent", border: "none", padding: 0,
                          fontSize: "12px", color: "#c9a84c", cursor: "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        Verify on blockchain →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}