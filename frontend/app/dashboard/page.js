"use client";
import { useState, useEffect } from "react";
import { useWallet } from "../../context/WalletContext";
import DownloadCertificate from "../../components/DownloadCertificate";
import ReputationScore from "../../components/ReputationScore";

function CredentialCard({ tokenId, contract }) {
  const [cred, setCred] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [showQR, setShowQR] = useState(false);

  const verifyUrl = typeof window !== "undefined"
    ? window.location.origin + "/verify?id=" + tokenId : "";

  useEffect(() => {
    (async () => {
      const data = await contract.getCredential(Number(tokenId));
      setCred(data);
      try {
        const res = await fetch("https://gateway.pinata.cloud/ipfs/" + data[3]);
        setMetadata(await res.json());
      } catch (_) {}
    })();
  }, [tokenId, contract]);

  if (!cred) return (
    <div style={{
      background: "linear-gradient(135deg, rgba(10,26,74,0.5), rgba(5,15,46,0.6))",
      border: "1px solid rgba(201,168,76,0.1)",
      borderRadius: "16px", height: "180px",
      animation: "pulse 2s infinite",
    }} />
  );

  const isRevoked = cred[7];
  const statusColor = isRevoked ? "#f87171" : "#34d399";
  const statusBg = isRevoked ? "rgba(248,113,113,0.1)" : "rgba(52,211,153,0.1)";
  const statusBorder = isRevoked ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)";

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(10,26,74,0.8), rgba(5,15,46,0.9))",
      border: `1px solid ${statusBorder}`,
      borderRadius: "20px", padding: "28px",
      transition: "all 0.3s ease",
      position: "relative", overflow: "hidden",
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.3)"}
    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {/* Left accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: "4px", background: statusColor, borderRadius: "20px 0 0 20px",
      }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div style={{ paddingLeft: "8px" }}>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "20px", fontWeight: "700",
            color: "white", marginBottom: "4px",
          }}>
            {metadata ? metadata.name : "Loading..."}
          </p>
          <p style={{ fontSize: "12px", color: "rgba(201,168,76,0.7)", fontWeight: "500" }}>
            {cred[8]} · Token #{tokenId}
          </p>
        </div>
        <span style={{
          background: statusBg,
          border: `1px solid ${statusBorder}`,
          borderRadius: "20px", padding: "4px 12px",
          fontSize: "11px", fontWeight: "700",
          color: statusColor, letterSpacing: "0.06em",
        }}>
          {isRevoked ? "REVOKED" : "VALID"}
        </span>
      </div>

      {/* Details */}
      {metadata && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: "10px", marginBottom: "16px", paddingLeft: "8px",
        }}>
          {[
            ["Institution", metadata.attributes?.institution],
            ["Issue Date", metadata.attributes?.issueDate],
          ].map(([k, v]) => (
            <div key={k} style={{
              background: "rgba(5,15,46,0.6)",
              borderRadius: "10px", padding: "10px 14px",
            }}>
              <p style={{ fontSize: "10px", color: "rgba(201,168,76,0.6)", fontWeight: "600", letterSpacing: "0.06em", marginBottom: "3px" }}>{k.toUpperCase()}</p>
              <p style={{ fontSize: "13px", color: "white", fontWeight: "500" }}>{v || "—"}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reputation Score */}
      {cred && metadata && (
        <div style={{ paddingLeft: "8px", marginBottom: "16px" }}>
          <ReputationScore cred={cred} metadata={metadata} tokenId={tokenId} />
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", paddingLeft: "8px" }}>
        {[
          { label: showQR ? "Hide QR" : "Share QR", onClick: () => setShowQR(!showQR), color: "#c9a84c", bg: "rgba(201,168,76,0.1)", border: "rgba(201,168,76,0.3)" },
          { label: "Verify Link", onClick: () => window.open("/verify?id=" + tokenId, "_blank"), color: "rgba(180,195,230,0.8)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" },
        ].map(({ label, onClick, color, bg, border }) => (
          <button key={label} onClick={onClick} style={{
            background: bg, border: `1px solid ${border}`,
            borderRadius: "8px", padding: "7px 14px",
            fontSize: "12px", fontWeight: "500", color,
            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            {label}
          </button>
        ))}
        {metadata && (
          <DownloadCertificate cred={cred} metadata={metadata} tokenId={tokenId} />
        )}
      </div>

      {/* QR Code */}
      {showQR && (
        <div style={{
          marginTop: "20px", paddingLeft: "8px",
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: "10px",
        }}>
          <div style={{
            background: "white", padding: "12px",
            borderRadius: "12px", display: "inline-block",
          }}>
            <img
              src={"https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=" + encodeURIComponent(verifyUrl)}
              alt="QR Code" width={160} height={160}
            />
          </div>
          <p style={{ fontSize: "11px", color: "rgba(201,168,76,0.6)" }}>Scan to verify this credential</p>
          <p style={{
            fontSize: "10px", color: "rgba(180,195,230,0.4)",
            fontFamily: "'DM Mono', monospace", wordBreak: "break-all", textAlign: "center",
          }}>{verifyUrl}</p>
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

  if (!account) return (
    <div style={{
      minHeight: "100vh",
      background: "#020818",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>🎓</div>
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "24px", fontWeight: "700",
          color: "white", marginBottom: "8px",
        }}>Your Credentials</p>
        <p style={{ color: "rgba(180,195,230,0.6)", marginBottom: "28px", fontSize: "14px" }}>
          Connect your wallet to view your credentials.
        </p>
        <button onClick={connectWallet} style={{
          background: "linear-gradient(135deg, #c9a84c, #d4b96a)",
          border: "none", borderRadius: "10px",
          padding: "12px 28px", fontSize: "14px",
          fontWeight: "600", color: "#020818",
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        }}>
          Connect Wallet
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 30% 20%, rgba(15,36,96,0.4) 0%, transparent 60%), #020818",
      fontFamily: "'DM Sans', sans-serif",
      padding: "48px 24px",
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: "20px", padding: "4px 14px", marginBottom: "16px",
            fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", color: "#c9a84c",
          }}>✦ CREDENTIAL PORTFOLIO</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "36px", fontWeight: "700", color: "white", marginBottom: "8px",
          }}>My Credentials</h1>
          <p style={{
            fontSize: "12px", color: "rgba(201,168,76,0.6)",
            fontFamily: "'DM Mono', monospace",
          }}>
            {account.slice(0, 10)}...{account.slice(-8)}
          </p>
        </div>

        {/* Stats Row */}
        {tokenIds.length > 0 && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px", marginBottom: "32px",
          }}>
            {[
              { label: "Total", value: tokenIds.length },
              { label: "On Ethereum", value: "Sepolia" },
              { label: "Storage", value: "IPFS" },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: "linear-gradient(135deg, rgba(10,26,74,0.7), rgba(5,15,46,0.8))",
                border: "1px solid rgba(201,168,76,0.12)",
                borderRadius: "14px", padding: "18px 20px", textAlign: "center",
              }}>
                <p style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "28px", fontWeight: "700", color: "#c9a84c", lineHeight: "1",
                }}>{value}</p>
                <p style={{ fontSize: "12px", color: "rgba(180,195,230,0.5)", marginTop: "6px" }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px", color: "rgba(201,168,76,0.6)", fontSize: "14px" }}>
            Loading credentials from blockchain...
          </div>
        )}

        {/* Empty State */}
        {!loading && tokenIds.length === 0 && (
          <div style={{
            background: "linear-gradient(135deg, rgba(10,26,74,0.7), rgba(5,15,46,0.8))",
            border: "1px solid rgba(201,168,76,0.1)",
            borderRadius: "20px", padding: "60px", textAlign: "center",
          }}>
            <p style={{ fontSize: "56px", marginBottom: "16px" }}>🎓</p>
            <p style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "20px", color: "white", marginBottom: "8px",
            }}>No credentials yet</p>
            <p style={{ fontSize: "13px", color: "rgba(180,195,230,0.5)" }}>
              Ask your institution to issue one to your address.
            </p>
          </div>
        )}

        {/* Credentials */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {tokenIds.map((id) => (
            <CredentialCard key={id} tokenId={id} contract={contract} />
          ))}
        </div>
      </div>
    </div>
  );
}