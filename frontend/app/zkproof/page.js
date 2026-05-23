"use client";
import { useState, useEffect } from "react";
import { useWallet } from "../../context/WalletContext";
import { generateProof, encodeProof } from "../../utils/zkp";

export default function ZKProofPage() {
  const { account, contract, provider, connectWallet } = useWallet();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [proof, setProof] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!contract || !account) return;
    (async () => {
      setLoading(true);
      const ids = await contract.getHolderCredentials(account);
      const creds = await Promise.all(
        ids.map(async (id) => {
          const cred = await contract.getCredential(Number(id));
          let metadata = null;
          try {
            const res = await fetch("https://gateway.pinata.cloud/ipfs/" + cred[3]);
            metadata = await res.json();
          } catch (_) {}
          return { tokenId: id.toString(), cred, metadata };
        })
      );
      setCredentials(creds.filter(c => !c.cred[7]));
      setLoading(false);
    })();
  }, [contract, account]);

  const handleGenerate = async () => {
    if (!selectedTokenId) return alert("Please select a credential first");
    setGenerating(true); setStep(2);
    try {
      const signer = await provider.getSigner();
      const selected = credentials.find(c => c.tokenId === selectedTokenId);
      await new Promise(r => setTimeout(r, 1500)); setStep(3);
      await new Promise(r => setTimeout(r, 1500)); setStep(4);
      const generatedProof = await generateProof(selected.cred, selected.metadata, account, signer);
      const encoded = encodeProof(generatedProof);
      setProof({ encoded, data: generatedProof }); setStep(5);
    } catch (err) { alert("Proof generation failed: " + err.message); setStep(1); }
    finally { setGenerating(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(proof.encoded);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (!account) return (
    <div style={{
      minHeight: "100vh", background: "#020818",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>🔐</div>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: "700", color: "white", marginBottom: "8px" }}>
          Zero Knowledge Proof
        </p>
        <p style={{ color: "rgba(180,195,230,0.6)", marginBottom: "28px", fontSize: "14px" }}>
          Connect your wallet to generate a ZK proof.
        </p>
        <button onClick={connectWallet} style={{
          background: "linear-gradient(135deg, #c9a84c, #d4b96a)", border: "none",
          borderRadius: "10px", padding: "12px 28px", fontSize: "14px",
          fontWeight: "600", color: "#020818", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        }}>Connect Wallet</button>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 30% 20%, rgba(15,36,96,0.4) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(201,168,76,0.04) 0%, transparent 50%), #020818",
      fontFamily: "'DM Sans', sans-serif", padding: "48px 24px",
    }}>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: "20px", padding: "4px 14px", marginBottom: "16px",
            fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", color: "#c9a84c",
          }}>✦ ZERO KNOWLEDGE PROOF</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "42px", fontWeight: "800", color: "white",
            marginBottom: "12px", letterSpacing: "-0.02em",
          }}>Prove Without Revealing</h1>
          <p style={{ fontSize: "14px", color: "rgba(180,195,230,0.6)", maxWidth: "440px", margin: "0 auto", lineHeight: "1.7" }}>
            Generate a cryptographic proof of your credential — without revealing your name, institution, or any personal details.
          </p>
        </div>

        {/* How it works */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "32px" }}>
          {[
            { icon: "🎓", title: "Select", desc: "Choose a credential from your wallet" },
            { icon: "⚡", title: "Generate", desc: "Wallet signs a cryptographic commitment" },
            { icon: "🔒", title: "Share", desc: "Share proof — zero personal data revealed" },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{
              background: "linear-gradient(135deg, rgba(10,26,74,0.7), rgba(5,15,46,0.8))",
              border: "1px solid rgba(201,168,76,0.1)",
              borderRadius: "14px", padding: "18px", textAlign: "center",
            }}>
              <p style={{ fontSize: "28px", marginBottom: "8px" }}>{icon}</p>
              <p style={{ fontSize: "12px", fontWeight: "700", color: "#c9a84c", marginBottom: "4px", letterSpacing: "0.04em" }}>{title}</p>
              <p style={{ fontSize: "11px", color: "rgba(180,195,230,0.5)", lineHeight: "1.5" }}>{desc}</p>
            </div>
          ))}
        </div>

        {!proof ? (
          <div style={{
            background: "linear-gradient(135deg, rgba(10,26,74,0.8), rgba(5,15,46,0.9))",
            border: "1px solid rgba(201,168,76,0.15)",
            borderRadius: "20px", padding: "32px",
          }}>
            <p style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "20px", fontWeight: "700", color: "white", marginBottom: "20px",
            }}>Select Credential to Prove</p>

            {loading && (
              <p style={{ color: "rgba(201,168,76,0.5)", fontSize: "13px", marginBottom: "16px" }}>
                Loading your credentials...
              </p>
            )}

            {!loading && credentials.length === 0 && (
              <p style={{ color: "rgba(180,195,230,0.4)", fontSize: "13px", marginBottom: "16px" }}>
                No valid credentials found in your wallet.
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
              {credentials.map(({ tokenId, cred, metadata }) => {
                const isSelected = selectedTokenId === tokenId;
                return (
                  <div key={tokenId} onClick={() => setSelectedTokenId(tokenId)} style={{
                    border: isSelected ? "1px solid rgba(201,168,76,0.5)" : "1px solid rgba(255,255,255,0.07)",
                    background: isSelected ? "rgba(201,168,76,0.08)" : "rgba(5,15,46,0.5)",
                    borderRadius: "12px", padding: "16px 18px",
                    cursor: "pointer", display: "flex",
                    justifyContent: "space-between", alignItems: "center",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)"; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                  >
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: "600", color: "white", marginBottom: "3px" }}>
                        {metadata?.name || "Credential"}
                      </p>
                      <p style={{ fontSize: "11px", color: "rgba(180,195,230,0.4)" }}>
                        {metadata?.attributes?.institution} · Token #{tokenId}
                      </p>
                    </div>
                    <div style={{
                      width: "18px", height: "18px", borderRadius: "50%",
                      border: isSelected ? "none" : "2px solid rgba(201,168,76,0.3)",
                      background: isSelected ? "linear-gradient(135deg, #c9a84c, #d4b96a)" : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {isSelected && <span style={{ fontSize: "10px", color: "#020818", fontWeight: "700" }}>✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Generation Steps */}
            {generating && (
              <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { s: 2, label: "Creating cryptographic commitment..." },
                  { s: 3, label: "Computing nullifier hash..." },
                  { s: 4, label: "Signing with your wallet..." },
                ].map(({ s, label }) => (
                  <div key={s} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    fontSize: "13px",
                    color: step >= s ? "#c9a84c" : "rgba(180,195,230,0.3)",
                    transition: "color 0.3s ease",
                  }}>
                    <span>{step > s ? "✅" : step === s ? "⏳" : "○"}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={handleGenerate} disabled={!selectedTokenId || generating} style={{
              width: "100%",
              background: (!selectedTokenId || generating)
                ? "rgba(201,168,76,0.2)"
                : "linear-gradient(135deg, #c9a84c, #d4b96a)",
              border: "none", borderRadius: "12px", padding: "14px",
              fontSize: "14px", fontWeight: "600",
              color: (!selectedTokenId || generating) ? "rgba(2,8,24,0.4)" : "#020818",
              cursor: (!selectedTokenId || generating) ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {generating ? "Generating Proof..." : "Generate ZK Proof"}
            </button>
          </div>
        ) : (
          <div style={{
            background: "linear-gradient(135deg, rgba(10,26,74,0.8), rgba(5,15,46,0.9))",
            border: "1px solid rgba(52,211,153,0.25)",
            borderRadius: "20px", padding: "32px",
          }}>
            {/* Success */}
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: "700", color: "#34d399", marginBottom: "6px" }}>
                Proof Generated!
              </p>
              <p style={{ fontSize: "13px", color: "rgba(180,195,230,0.5)" }}>Your ZK proof is ready to share</p>
            </div>

            {/* What verifier learns */}
            <div style={{
              background: "rgba(5,15,46,0.6)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "14px", padding: "20px", marginBottom: "16px",
            }}>
              <p style={{ fontSize: "10px", color: "rgba(201,168,76,0.6)", fontWeight: "700", letterSpacing: "0.1em", marginBottom: "14px" }}>
                WHAT THE VERIFIER WILL LEARN
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { show: true, label: "Credential Type", value: proof.data.publicSignals.credentialType },
                  { show: true, label: "Status", value: "VALID", valueColor: "#34d399" },
                  { show: true, label: "Issuer Verified", value: "YES" },
                  { show: false, label: "Your name" },
                  { show: false, label: "Your institution" },
                  { show: false, label: "Issue date" },
                ].map(({ show, label, value, valueColor }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                    <span style={{ color: show ? "#34d399" : "#f87171", fontSize: "12px" }}>{show ? "✓" : "✗"}</span>
                    <span style={{ color: show ? "rgba(220,230,255,0.8)" : "rgba(180,195,230,0.35)" }}>
                      {label}{value && ": "}
                      {value && <strong style={{ color: valueColor || "white" }}>{value}</strong>}
                      {!show && <span style={{ color: "rgba(180,195,230,0.3)" }}> — hidden</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Proof ID */}
            <div style={{
              background: "rgba(5,15,46,0.6)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px", padding: "14px 16px", marginBottom: "12px",
            }}>
              <p style={{ fontSize: "10px", color: "rgba(201,168,76,0.6)", fontWeight: "700", letterSpacing: "0.1em", marginBottom: "6px" }}>PROOF ID</p>
              <p style={{ fontSize: "12px", color: "#c9a84c", fontFamily: "'DM Mono', monospace" }}>{proof.data.proofId}</p>
            </div>

            {/* Encoded Proof */}
            <div style={{
              background: "rgba(5,15,46,0.6)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "12px", padding: "14px 16px", marginBottom: "20px",
            }}>
              <p style={{ fontSize: "10px", color: "rgba(201,168,76,0.6)", fontWeight: "700", letterSpacing: "0.1em", marginBottom: "6px" }}>SHAREABLE PROOF STRING</p>
              <p style={{
                fontSize: "11px", color: "rgba(180,195,230,0.5)",
                fontFamily: "'DM Mono', monospace", wordBreak: "break-all",
                display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>{proof.encoded.slice(0, 120)}...</p>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={handleCopy} style={{
                flex: 1,
                background: copied ? "rgba(52,211,153,0.15)" : "linear-gradient(135deg, #c9a84c, #d4b96a)",
                border: copied ? "1px solid rgba(52,211,153,0.3)" : "none",
                borderRadius: "10px", padding: "12px",
                fontSize: "13px", fontWeight: "600",
                color: copied ? "#34d399" : "#020818",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s ease",
              }}>
                {copied ? "✅ Copied!" : "📋 Copy Proof"}
              </button>
              <button onClick={() => { setProof(null); setSelectedTokenId(null); setStep(1); }} style={{
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px", padding: "12px 20px",
                fontSize: "13px", fontWeight: "500", color: "rgba(180,195,230,0.7)",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              }}>
                New Proof
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}