"use client";
import Link from "next/link";
import { useWallet } from "../context/WalletContext";

export default function Home() {
  const { account, connectWallet, loading } = useWallet();

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 20% 50%, rgba(15,36,96,0.5) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(201,168,76,0.08) 0%, transparent 50%), #020818",
      color: "white",
      fontFamily: "'DM Sans', sans-serif",
      overflow: "hidden",
    }}>

      {/* Hero Section */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "80px 24px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: "72px" }}>

          {/* Tag */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: "20px", padding: "6px 18px", marginBottom: "28px",
            fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em",
            color: "#c9a84c",
          }}>
            ✦ BLOCKCHAIN CREDENTIAL VERIFICATION
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(48px, 7vw, 88px)",
            fontWeight: "800",
            lineHeight: "1.05",
            marginBottom: "24px",
            letterSpacing: "-0.02em",
          }}>
            <span style={{
              background: "linear-gradient(135deg, #ffffff 0%, #e2ce94 50%, #c9a84c 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Trust, Verified</span>
            <br />
            <span style={{ color: "rgba(255,255,255,0.9)" }}>on the Blockchain</span>
          </h1>

          <p style={{
            fontSize: "18px", color: "rgba(200,210,240,0.8)",
            maxWidth: "560px", margin: "0 auto 16px",
            lineHeight: "1.7", fontWeight: "300",
          }}>
            Issue tamper-proof credentials as NFTs on Ethereum. Verify instantly. No intermediaries. No forgery.
          </p>

          <p style={{
            fontSize: "13px", color: "rgba(201,168,76,0.7)",
            marginBottom: "44px", letterSpacing: "0.02em",
          }}>
            Deployed on Ethereum Sepolia · IPFS Storage · Zero Knowledge Proofs
          </p>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            {!account ? (
              <button
                onClick={connectWallet}
                disabled={loading}
                style={{
                  background: "linear-gradient(135deg, #c9a84c, #d4b96a)",
                  border: "none", borderRadius: "12px",
                  padding: "15px 36px", fontSize: "15px", fontWeight: "600",
                  color: "#020818", cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                  fontFamily: "'DM Sans', sans-serif",
                  boxShadow: "0 8px 32px rgba(201,168,76,0.25)",
                  transition: "all 0.2s ease",
                  letterSpacing: "0.02em",
                }}
              >
                {loading ? "Connecting..." : "Connect Wallet to Start"}
              </button>
            ) : (
              <>
                <Link href="/dashboard" style={{
                  background: "linear-gradient(135deg, #c9a84c, #d4b96a)",
                  borderRadius: "12px", padding: "15px 36px",
                  fontSize: "15px", fontWeight: "600", color: "#020818",
                  textDecoration: "none", fontFamily: "'DM Sans', sans-serif",
                  boxShadow: "0 8px 32px rgba(201,168,76,0.25)",
                }}>
                  My Credentials
                </Link>
                <Link href="/verify" style={{
                  background: "transparent",
                  border: "1px solid rgba(201,168,76,0.4)",
                  borderRadius: "12px", padding: "15px 36px",
                  fontSize: "15px", fontWeight: "500", color: "#e2ce94",
                  textDecoration: "none", fontFamily: "'DM Sans', sans-serif",
                }}>
                  Verify a Credential
                </Link>
              </>
            )}
          </div>
        </div>

        {/* 3 Actor Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "72px" }}>
          {[
            {
              icon: "🎓",
              tag: "INSTITUTIONS",
              title: "Issue Credentials",
              desc: "Mint tamper-proof academic credentials as NFTs. Multi-signature approval, expiry dates, instant revocation.",
              features: ["NFT Minting", "Multi-Sig Approval", "Bulk Issuance"],
            },
            {
              icon: "👤",
              tag: "STUDENTS",
              title: "Own Your Credentials",
              desc: "Hold credentials in your MetaMask wallet. Share via QR, download PDF certificates, generate ZK proofs.",
              features: ["PDF Download", "QR Sharing", "ZK Proof"],
            },
            {
              icon: "✅",
              tag: "EMPLOYERS",
              title: "Verify Instantly",
              desc: "Verify any credential in 3 seconds. REST API for HR systems. Bulk verify entire candidate lists.",
              features: ["REST API", "Bulk Verify", "Audit Trail"],
            },
          ].map(({ icon, tag, title, desc, features }) => (
            <div key={title} style={{
              background: "linear-gradient(135deg, rgba(10,26,74,0.7), rgba(5,15,46,0.8))",
              border: "1px solid rgba(201,168,76,0.15)",
              borderRadius: "20px", padding: "32px",
              transition: "all 0.3s ease",
              cursor: "default",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.border = "1px solid rgba(201,168,76,0.4)";
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.3)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.border = "1px solid rgba(201,168,76,0.15)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}>
              <div style={{ fontSize: "36px", marginBottom: "16px" }}>{icon}</div>
              <div style={{
                fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em",
                color: "#c9a84c", marginBottom: "10px",
              }}>{tag}</div>
              <h3 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "22px", fontWeight: "700",
                color: "white", marginBottom: "12px",
              }}>{title}</h3>
              <p style={{ fontSize: "14px", color: "rgba(180,195,230,0.8)", lineHeight: "1.7", marginBottom: "20px" }}>{desc}</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {features.map(f => (
                  <span key={f} style={{
                    background: "rgba(201,168,76,0.1)",
                    border: "1px solid rgba(201,168,76,0.2)",
                    borderRadius: "20px", padding: "3px 10px",
                    fontSize: "11px", fontWeight: "500", color: "#c9a84c",
                  }}>{f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div style={{
          background: "linear-gradient(135deg, rgba(10,26,74,0.6), rgba(5,15,46,0.8))",
          border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: "20px", padding: "40px",
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "32px", textAlign: "center", marginBottom: "72px",
        }}>
          {[
            { value: "3s", label: "Verification Time" },
            { value: "$600B", label: "Fraud Problem Solved" },
            { value: "100%", label: "Tamper Proof" },
            { value: "23+", label: "Features Built" },
          ].map(({ value, label }) => (
            <div key={label}>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "42px", fontWeight: "700",
                background: "linear-gradient(135deg, #e2ce94, #c9a84c)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                lineHeight: "1", marginBottom: "8px",
              }}>{value}</div>
              <div style={{ fontSize: "13px", color: "rgba(180,195,230,0.7)", fontWeight: "400" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Features Grid */}
        <div style={{ marginBottom: "72px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: "20px", padding: "5px 16px", marginBottom: "16px",
              fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", color: "#c9a84c",
            }}>✦ PLATFORM FEATURES</div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "36px", fontWeight: "700", color: "white",
            }}>Everything You Need</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            {[
              { icon: "🔐", title: "ZK Proof Privacy", desc: "Prove credentials without revealing identity" },
              { icon: "📊", title: "Reputation Score", desc: "0-100 trust score per credential" },
              { icon: "✍️", title: "Multi-Signature", desc: "Require multiple approvals before minting" },
              { icon: "🌐", title: "Career Passport", desc: "Public shareable credential profile" },
              { icon: "📬", title: "Verification Requests", desc: "Consent-based GDPR compliant verification" },
              { icon: "🏛️", title: "Institution Dashboard", desc: "Full analytics and management portal" },
              { icon: "📄", title: "PDF Certificates", desc: "Download beautiful certificate documents" },
              { icon: "⚡", title: "REST API", desc: "Integrate verification into any HR system" },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{
                background: "rgba(10,26,74,0.4)",
                border: "1px solid rgba(201,168,76,0.1)",
                borderRadius: "14px", padding: "20px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(10,26,74,0.7)";
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(10,26,74,0.4)";
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.1)";
              }}>
                <div style={{ fontSize: "24px", marginBottom: "10px" }}>{icon}</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "white", marginBottom: "6px" }}>{title}</div>
                <div style={{ fontSize: "12px", color: "rgba(180,195,230,0.7)", lineHeight: "1.5" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{
          textAlign: "center",
          background: "linear-gradient(135deg, rgba(201,168,76,0.08), rgba(10,26,74,0.6))",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "24px", padding: "60px 40px",
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "36px", fontWeight: "700",
            color: "white", marginBottom: "16px",
          }}>Ready to verify trust?</h2>
          <p style={{ color: "rgba(180,195,230,0.7)", marginBottom: "32px", fontSize: "15px" }}>
            Join institutions and employers already using CredChain.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/verify" style={{
              background: "linear-gradient(135deg, #c9a84c, #d4b96a)",
              borderRadius: "12px", padding: "14px 32px",
              fontSize: "14px", fontWeight: "600", color: "#020818",
              textDecoration: "none",
            }}>Verify a Credential</Link>
            <Link href="/passport" style={{
              background: "transparent",
              border: "1px solid rgba(201,168,76,0.4)",
              borderRadius: "12px", padding: "14px 32px",
              fontSize: "14px", fontWeight: "500", color: "#e2ce94",
              textDecoration: "none",
            }}>View Career Passport</Link>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{
        borderTop: "1px solid rgba(201,168,76,0.1)",
        padding: "24px",
        textAlign: "center",
        fontSize: "12px",
        color: "rgba(180,195,230,0.4)",
        fontFamily: "'DM Mono', monospace",
      }}>
        CredChain · Ethereum Sepolia · Built for the future of trust
      </div>
    </div>
  );
}