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
          verifierList.push({ address: verifier, time: new Date(Number(timestamp) * 1000).toLocaleString() });
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

  const S = {
    page: {
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 30% 20%, rgba(15,36,96,0.4) 0%, transparent 60%), #020818",
      fontFamily: "'DM Sans', sans-serif",
      padding: "48px 24px",
    },
    wrapper: { maxWidth: "720px", margin: "0 auto" },
    tag: {
      display: "inline-flex", alignItems: "center",
      background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
      borderRadius: "20px", padding: "4px 14px", marginBottom: "16px",
      fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", color: "#c9a84c",
    },
    title: {
      fontFamily: "'Playfair Display', serif",
      fontSize: "36px", fontWeight: "700", color: "white",
      marginBottom: "8px",
    },
    subtitle: { fontSize: "14px", color: "rgba(180,195,230,0.6)", marginBottom: "36px" },
    card: {
      background: "linear-gradient(135deg, rgba(10,26,74,0.8), rgba(5,15,46,0.9))",
      border: "1px solid rgba(201,168,76,0.15)",
      borderRadius: "20px", padding: "32px",
    },
    tabRow: { display: "flex", gap: "8px", marginBottom: "28px" },
    tabActive: {
      flex: 1, padding: "10px", borderRadius: "10px",
      border: "1px solid rgba(201,168,76,0.4)",
      background: "rgba(201,168,76,0.12)",
      color: "#e2ce94", fontWeight: "600", fontSize: "13px",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
      letterSpacing: "0.02em",
    },
    tabInactive: {
      flex: 1, padding: "10px", borderRadius: "10px",
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(255,255,255,0.03)",
      color: "rgba(180,195,230,0.5)", fontWeight: "500", fontSize: "13px",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    },
    input: {
      flex: 1,
      background: "rgba(5,15,46,0.8)",
      border: "1px solid rgba(201,168,76,0.2)",
      borderRadius: "10px", color: "white",
      fontFamily: "'DM Mono', monospace",
      fontSize: "14px", padding: "13px 16px",
      outline: "none", width: "100%",
    },
    btnGold: {
      background: "linear-gradient(135deg, #c9a84c, #d4b96a)",
      border: "none", borderRadius: "10px",
      padding: "13px 28px", fontSize: "14px",
      fontWeight: "600", color: "#020818",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
      whiteSpace: "nowrap",
    },
    btnDisabled: {
      background: "rgba(201,168,76,0.3)",
      border: "none", borderRadius: "10px",
      padding: "13px 28px", fontSize: "14px",
      fontWeight: "600", color: "rgba(2,8,24,0.5)",
      cursor: "not-allowed", fontFamily: "'DM Sans', sans-serif",
      whiteSpace: "nowrap",
    },
  };

  return (
    <div style={S.page}>
      <div style={S.wrapper}>
        <div style={S.tag}>✦ CREDENTIAL VERIFICATION</div>
        <h1 style={S.title}>Verify Credential</h1>
        <p style={S.subtitle}>Verify by Token ID or paste a ZK Proof string. No login required.</p>

        <div style={S.card}>
          {/* Tabs */}
          <div style={S.tabRow}>
            <button
              onClick={() => { setActiveTab("token"); setZkResult(null); }}
              style={activeTab === "token" ? S.tabActive : S.tabInactive}
            >
              Token ID Verify
            </button>
            <button
              onClick={() => { setActiveTab("zkp"); setResult(null); }}
              style={activeTab === "zkp" ? S.tabActive : S.tabInactive}
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
                style={{
                  ...S.input,
                  width: "100%", resize: "vertical",
                  marginBottom: "12px", fontSize: "11px",
                  fontFamily: "'DM Mono', monospace",
                }}
              />
              <button onClick={handleZKVerify} style={{ ...S.btnGold, width: "100%", marginBottom: "20px" }}>
                Verify ZK Proof
              </button>
              {zkResult && (
                <div style={{
                  borderRadius: "14px",
                  border: zkResult.valid ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(248,113,113,0.3)",
                  background: zkResult.valid ? "rgba(52,211,153,0.05)" : "rgba(248,113,113,0.05)",
                  padding: "24px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "32px" }}>{zkResult.valid ? "✅" : "❌"}</span>
                    <div>
                      <p style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "22px", fontWeight: "700",
                        color: zkResult.valid ? "#34d399" : "#f87171",
                      }}>
                        {zkResult.valid ? "VALID PROOF" : "INVALID PROOF"}
                      </p>
                      {zkResult.proofId && (
                        <p style={{ fontSize: "11px", color: "rgba(180,195,230,0.5)", fontFamily: "'DM Mono', monospace" }}>
                          ID: {zkResult.proofId}
                        </p>
                      )}
                    </div>
                  </div>
                  {zkResult.valid && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
                      {[
                        ["Credential Type", zkResult.credentialType],
                        ["Issuer Verified", "✓ Confirmed"],
                        ["Holder", zkResult.holderAddress],
                        ["Generated", new Date(zkResult.proofTimestamp).toLocaleString()],
                      ].map(([k, v]) => (
                        <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "rgba(180,195,230,0.5)" }}>{k}</span>
                          <span style={{ color: "white", fontWeight: "500" }}>{v}</span>
                        </div>
                      ))}
                      <div style={{
                        marginTop: "12px",
                        background: "rgba(52,211,153,0.08)",
                        border: "1px solid rgba(52,211,153,0.2)",
                        borderRadius: "10px", padding: "12px",
                      }}>
                        <p style={{ fontSize: "12px", color: "#34d399", fontWeight: "600" }}>🔒 Zero Knowledge Verified</p>
                        <p style={{ fontSize: "12px", color: "rgba(52,211,153,0.7)", marginTop: "4px" }}>
                          Name, institution, and personal details remain private.
                        </p>
                      </div>
                    </div>
                  )}
                  {!zkResult.valid && (
                    <p style={{ color: "#f87171", fontSize: "13px" }}>{zkResult.error}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Token ID Tab */}
          {activeTab === "token" && (
            <div>
              <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                <input
                  value={tokenId}
                  onChange={(e) => setTokenId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  placeholder="Enter Token ID (e.g. 1)"
                  style={S.input}
                />
                <button
                  onClick={handleVerify}
                  disabled={loading}
                  style={loading ? S.btnDisabled : S.btnGold}
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
                  border: result.revoked || result.isExpired
                    ? "1px solid rgba(248,113,113,0.3)"
                    : "1px solid rgba(52,211,153,0.3)",
                  background: result.revoked || result.isExpired
                    ? "rgba(248,113,113,0.05)"
                    : "rgba(52,211,153,0.05)",
                  padding: "28px",
                }}>
                  {/* Status Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                    <div style={{
                      width: "56px", height: "56px", borderRadius: "14px",
                      background: result.revoked || result.isExpired
                        ? "rgba(248,113,113,0.15)"
                        : "rgba(52,211,153,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "28px",
                    }}>
                      {result.revoked ? "❌" : result.isExpired ? "⏰" : "✅"}
                    </div>
                    <div>
                      <p style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "28px", fontWeight: "700",
                        color: result.revoked || result.isExpired ? "#f87171" : "#34d399",
                        lineHeight: "1",
                      }}>
                        {result.revoked ? "REVOKED" : result.isExpired ? "EXPIRED" : "VALID"}
                      </p>
                      <p style={{ fontSize: "12px", color: "rgba(180,195,230,0.5)", marginTop: "4px" }}>
                        Token #{result.tokenId} · {result.credentialType}
                      </p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  {result.metadata && (
                    <div style={{
                      display: "grid", gridTemplateColumns: "1fr 1fr",
                      gap: "12px", marginBottom: "20px",
                    }}>
                      {[
                        ["Title", result.metadata.name],
                        ["Recipient", result.metadata.attributes?.recipientName],
                        ["Institution", result.metadata.attributes?.institution],
                        ["Issue Date", result.metadata.attributes?.issueDate],
                        ["Expiry", result.expiresAt],
                        ["Type", result.credentialType],
                      ].map(([k, v]) => (
                        <div key={k} style={{
                          background: "rgba(10,26,74,0.5)",
                          borderRadius: "10px", padding: "12px 14px",
                        }}>
                          <p style={{ fontSize: "10px", color: "rgba(201,168,76,0.7)", fontWeight: "600", letterSpacing: "0.06em", marginBottom: "4px" }}>
                            {k.toUpperCase()}
                          </p>
                          <p style={{ fontSize: "13px", color: "white", fontWeight: "500" }}>{v || "—"}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Addresses */}
                  <div style={{ marginBottom: "16px" }}>
                    {[
                      ["ISSUER", result.issuer],
                      ["RECIPIENT", result.recipient],
                    ].map(([k, v]) => (
                      <div key={k} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "8px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}>
                        <span style={{ fontSize: "10px", color: "rgba(201,168,76,0.6)", fontWeight: "600", letterSpacing: "0.06em" }}>{k}</span>
                        <span style={{ fontSize: "11px", color: "rgba(180,195,230,0.6)", fontFamily: "'DM Mono', monospace" }}>
                          {v.slice(0, 10)}...{v.slice(-8)}
                        </span>
                      </div>
                    ))}
                    <div style={{ padding: "8px 0" }}>
                      <span style={{ fontSize: "10px", color: "rgba(201,168,76,0.6)", fontWeight: "600", letterSpacing: "0.06em" }}>IPFS</span>
                      <p style={{ fontSize: "11px", color: "rgba(180,195,230,0.5)", fontFamily: "'DM Mono', monospace", marginTop: "2px", wordBreak: "break-all" }}>
                        ipfs://{result.ipfsHash}
                      </p>
                    </div>
                  </div>

                  {/* Reputation Score */}
                  <ReputationScore cred={result} metadata={result.metadata} tokenId={result.tokenId} />

                  {/* Audit Trail */}
                  {verifiers.length > 0 && (
                    <div style={{
                      marginTop: "16px",
                      background: "rgba(10,26,74,0.5)",
                      borderRadius: "10px", padding: "16px",
                    }}>
                      <p style={{
                        fontSize: "11px", fontWeight: "600", letterSpacing: "0.06em",
                        color: "#c9a84c", marginBottom: "10px",
                      }}>
                        VERIFICATION AUDIT TRAIL — {verifiers.length} checks
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {verifiers.map((v, i) => (
                          <div key={i} style={{
                            display: "flex", justifyContent: "space-between",
                            fontSize: "11px", color: "rgba(180,195,230,0.6)",
                          }}>
                            <span style={{ fontFamily: "'DM Mono', monospace" }}>
                              {v.address.slice(0, 8)}...{v.address.slice(-6)}
                            </span>
                            <span>{v.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}