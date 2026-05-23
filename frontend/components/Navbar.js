"use client";
import Link from "next/link";
import { useState } from "react";
import { useWallet } from "../context/WalletContext";

export default function Navbar() {
  const { account, isIssuer, issuerName, connectWallet, disconnectWallet, loading } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{
      background: "linear-gradient(180deg, rgba(2,8,24,0.98) 0%, rgba(5,15,46,0.95) 100%)",
      borderBottom: "1px solid rgba(201,168,76,0.2)",
      backdropFilter: "blur(20px)",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
        
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px",
            background: "linear-gradient(135deg, #c9a84c, #e2ce94)",
            borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", fontWeight: "800", color: "#020818",
            fontFamily: "'Playfair Display', serif",
          }}>C</div>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "20px", fontWeight: "700",
            background: "linear-gradient(135deg, #e2ce94, #c9a84c)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: "0.02em",
          }}>CredChain</span>
        </Link>

        {/* Center Nav Links */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {[
            { href: "/verify", label: "Verify" },
            { href: "/passport", label: "Passport" },
            { href: "/employer", label: "Employer" },
            { href: "/zkproof", label: "ZK Proof" },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{
              color: "rgba(228,212,148,0.7)",
              textDecoration: "none",
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "500",
              fontFamily: "'DM Sans', sans-serif",
              transition: "all 0.2s ease",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={e => {
              e.target.style.color = "#e2ce94";
              e.target.style.background = "rgba(201,168,76,0.1)";
            }}
            onMouseLeave={e => {
              e.target.style.color = "rgba(228,212,148,0.7)";
              e.target.style.background = "transparent";
            }}>
              {label}
            </Link>
          ))}

          {account && (
            <>
              <Link href="/dashboard" style={{
                color: "rgba(228,212,148,0.7)",
                textDecoration: "none",
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "500",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => {
                e.target.style.color = "#e2ce94";
                e.target.style.background = "rgba(201,168,76,0.1)";
              }}
              onMouseLeave={e => {
                e.target.style.color = "rgba(228,212,148,0.7)";
                e.target.style.background = "transparent";
              }}>
                My Credentials
              </Link>
              <Link href="/requests" style={{
                color: "rgba(228,212,148,0.7)",
                textDecoration: "none",
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "500",
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={e => {
                e.target.style.color = "#e2ce94";
                e.target.style.background = "rgba(201,168,76,0.1)";
              }}
              onMouseLeave={e => {
                e.target.style.color = "rgba(228,212,148,0.7)";
                e.target.style.background = "transparent";
              }}>
                Requests
              </Link>
            </>
          )}

          {isIssuer && (
            <>
              {[
                { href: "/issuer", label: "Issue" },
                { href: "/institution", label: "Institution" },
                { href: "/multisig", label: "Multi-Sig" },
              ].map(({ href, label }) => (
                <Link key={href} href={href} style={{
                  color: "#c9a84c",
                  textDecoration: "none",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s ease",
                  border: "1px solid rgba(201,168,76,0.2)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(201,168,76,0.12)";
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)";
                }}>
                  {label}
                </Link>
              ))}
            </>
          )}
        </div>

        {/* Right Side */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {account ? (
            <>
              {isIssuer && (
                <div style={{
                  background: "rgba(201,168,76,0.12)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: "20px",
                  padding: "4px 12px",
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#c9a84c",
                  letterSpacing: "0.04em",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  ✦ {issuerName}
                </div>
              )}
              <div style={{
                background: "rgba(10,26,74,0.8)",
                border: "1px solid rgba(201,168,76,0.2)",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "12px",
                color: "rgba(228,212,148,0.8)",
                fontFamily: "'DM Mono', monospace",
              }}>
                {account.slice(0, 6)}...{account.slice(-4)}
              </div>
              <button
                onClick={disconnectWallet}
                style={{
                  background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.3)",
                  borderRadius: "8px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: "500",
                  color: "#f87171",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,0.2)"}
                onMouseLeave={e => e.currentTarget.style.background = "rgba(248,113,113,0.1)"}
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={connectWallet}
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, #c9a84c, #d4b96a)",
                border: "none",
                borderRadius: "10px",
                padding: "9px 20px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#020818",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s ease",
                letterSpacing: "0.02em",
              }}
              onMouseEnter={e => !loading && (e.currentTarget.style.transform = "translateY(-1px)", e.currentTarget.style.boxShadow = "0 6px 20px rgba(201,168,76,0.35)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = "none")}
            >
              {loading ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}