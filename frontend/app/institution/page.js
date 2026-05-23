"use client";
import { useState, useEffect } from "react";
import { useWallet } from "../../context/WalletContext";

export default function InstitutionPage() {
  const { account, contract, isIssuer, issuerName, connectWallet } = useWallet();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
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
            tokenId: i, recipient: cred[2], ipfsHash: cred[3],
            issuedAt: new Date(Number(cred[5]) * 1000).toLocaleDateString(),
            expiresAt: expiresAt > 0 ? new Date(expiresAt * 1000).toLocaleDateString() : "No Expiry",
            revoked: cred[7], isExpired, status, credentialType: cred[8], metadata,
          });
        }
      }
      setCredentials(issued);
      setStats({
        valid: issued.filter(c => c.status === "VALID").length,
        revoked: issued.filter(c => c.status === "REVOKED").length,
        expired: issued.filter(c => c.status === "EXPIRED").length,
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleRevoke = async (tokenId) => {
    if (!confirm("Are you sure you want to revoke this credential?")) return;
    setRevoking(tokenId);
    try {
      const tx = await contract.revokeCredential(tokenId);
      await tx.wait();
      await fetchCredentials();
    } catch (err) { alert("Revoke failed: " + err.message); }
    finally { setRevoking(null); }
  };

  const pageStyle = {
    minHeight: "100vh",
    background: "radial-gradient(ellipse at 30% 20%, rgba(15,36,96,0.4) 0%, transparent 60%), #020818",
    fontFamily: "'DM Sans', sans-serif",
    padding: "48px 24px",
  };

  if (!account) return (
    <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>🏛️</div>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: "700", color: "white", marginBottom: "8px" }}>Institution Dashboard</p>
        <p style={{ color: "rgba(180,195,230,0.6)", marginBottom: "28px", fontSize: "14px" }}>Connect your institution wallet to continue.</p>
        <button onClick={connectWallet} style={{
          background: "linear-gradient(135deg, #c9a84c, #d4b96a)", border: "none",
          borderRadius: "10px", padding: "12px 28px", fontSize: "14px",
          fontWeight: "600", color: "#020818", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        }}>Connect Wallet</button>
      </div>
    </div>
  );

  if (!isIssuer) return (
    <div style={{ ...pageStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)",
        borderRadius: "20px", padding: "48px", maxWidth: "440px", textAlign: "center",
      }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚫</div>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "#f87171", marginBottom: "8px" }}>Access Denied</p>
        <p style={{ color: "rgba(248,113,113,0.7)", fontSize: "14px", marginBottom: "16px" }}>This dashboard is only for approved institutions.</p>
        <p style={{ fontSize: "11px", color: "rgba(180,195,230,0.3)", fontFamily: "'DM Mono', monospace", wordBreak: "break-all" }}>{account}</p>
      </div>
    </div>
  );

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: "20px", padding: "4px 14px", marginBottom: "16px",
            fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", color: "#c9a84c",
          }}>✦ INSTITUTION DASHBOARD</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "36px", fontWeight: "700", color: "white", marginBottom: "6px",
          }}>{issuerName}</h1>
          <p style={{ fontSize: "12px", color: "rgba(201,168,76,0.5)", fontFamily: "'DM Mono', monospace" }}>{account}</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
          {[
            { label: "Total Issued", value: credentials.length, color: "#c9a84c" },
            { label: "Valid", value: stats.valid, color: "#34d399" },
            { label: "Revoked", value: stats.revoked, color: "#f87171" },
            { label: "Expired", value: stats.expired, color: "#fbbf24" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: "linear-gradient(135deg, rgba(10,26,74,0.8), rgba(5,15,46,0.9))",
              border: `1px solid ${color}25`,
              borderTop: `3px solid ${color}`,
              borderRadius: "16px", padding: "20px 24px",
            }}>
              <p style={{ fontSize: "11px", color: "rgba(180,195,230,0.5)", fontWeight: "600", letterSpacing: "0.06em", marginBottom: "8px" }}>
                {label.toUpperCase()}
              </p>
              <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "36px", fontWeight: "700", color, lineHeight: "1",
              }}>
                {loading ? "—" : value}
              </p>
            </div>
          ))}
        </div>

        {/* Table Card */}
        <div style={{
          background: "linear-gradient(135deg, rgba(10,26,74,0.8), rgba(5,15,46,0.9))",
          border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: "20px", overflow: "hidden",
        }}>
          {/* Table Header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "20px 28px",
            borderBottom: "1px solid rgba(201,168,76,0.1)",
          }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "20px", fontWeight: "700", color: "white",
            }}>Issued Credentials</h2>
            <button onClick={fetchCredentials} style={{
              background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: "8px", padding: "7px 16px",
              fontSize: "12px", fontWeight: "500", color: "#c9a84c",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,0.18)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(201,168,76,0.1)"}
            >
              Refresh
            </button>
          </div>

          {loading && (
            <div style={{ padding: "60px", textAlign: "center", color: "rgba(201,168,76,0.5)", fontSize: "14px" }}>
              Loading credentials from blockchain...
            </div>
          )}

          {!loading && credentials.length === 0 && (
            <div style={{ padding: "60px", textAlign: "center" }}>
              <p style={{ fontSize: "48px", marginBottom: "12px" }}>🎓</p>
              <p style={{ color: "rgba(180,195,230,0.5)", fontSize: "14px" }}>No credentials issued yet.</p>
            </div>
          )}

          {!loading && credentials.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
                    {["Token", "Credential", "Recipient", "Issued", "Status", "Actions"].map(h => (
                      <th key={h} style={{
                        padding: "12px 20px", textAlign: "left",
                        fontSize: "10px", fontWeight: "700",
                        letterSpacing: "0.1em", color: "rgba(201,168,76,0.5)",
                      }}>{h.toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {credentials.map((cred, i) => (
                    <tr key={cred.tokenId} style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,0.04)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "13px", fontWeight: "600", color: "#c9a84c",
                        }}>#{cred.tokenId}</span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <p style={{ fontSize: "14px", fontWeight: "600", color: "white", marginBottom: "2px" }}>
                          {cred.metadata?.name || "Unknown"}
                        </p>
                        <p style={{ fontSize: "11px", color: "rgba(201,168,76,0.5)" }}>{cred.credentialType}</p>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <p style={{ fontSize: "14px", color: "rgba(220,230,255,0.8)", marginBottom: "2px" }}>
                          {cred.metadata?.attributes?.recipientName || "Unknown"}
                        </p>
                        <p style={{ fontSize: "11px", color: "rgba(180,195,230,0.4)", fontFamily: "'DM Mono', monospace" }}>
                          {cred.recipient.slice(0, 8)}...{cred.recipient.slice(-6)}
                        </p>
                      </td>
                      <td style={{ padding: "16px 20px", fontSize: "13px", color: "rgba(180,195,230,0.6)" }}>
                        {cred.issuedAt}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{
                          background: cred.status === "VALID" ? "rgba(52,211,153,0.1)" : cred.status === "REVOKED" ? "rgba(248,113,113,0.1)" : "rgba(251,191,36,0.1)",
                          border: `1px solid ${cred.status === "VALID" ? "rgba(52,211,153,0.3)" : cred.status === "REVOKED" ? "rgba(248,113,113,0.3)" : "rgba(251,191,36,0.3)"}`,
                          color: cred.status === "VALID" ? "#34d399" : cred.status === "REVOKED" ? "#f87171" : "#fbbf24",
                          borderRadius: "20px", padding: "3px 10px",
                          fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em",
                        }}>{cred.status}</span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => window.open(`/verify?id=${cred.tokenId}`, "_blank")}
                            style={{
                              background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
                              borderRadius: "7px", padding: "5px 12px",
                              fontSize: "11px", fontWeight: "500", color: "#c9a84c",
                              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                            }}
                          >View</button>
                          {!cred.revoked && (
                            <button
                              onClick={() => handleRevoke(cred.tokenId)}
                              disabled={revoking === cred.tokenId}
                              style={{
                                background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)",
                                borderRadius: "7px", padding: "5px 12px",
                                fontSize: "11px", fontWeight: "500", color: "#f87171",
                                cursor: revoking === cred.tokenId ? "not-allowed" : "pointer",
                                opacity: revoking === cred.tokenId ? 0.5 : 1,
                                fontFamily: "'DM Sans', sans-serif",
                              }}
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
    </div>
  );
}