"use client";
import { useState } from "react";
import { useWallet } from "../../context/WalletContext";
import { ethers } from "ethers";
import emailjs from "@emailjs/browser";

export default function IssuerPage() {
  const { account, contract, isIssuer, issuerName, connectWallet } = useWallet();
  const [form, setForm] = useState({
    recipientAddress: "",
    recipientName: "",
    recipientEmail: "",
    credentialTitle: "",
    credentialType: "DEGREE",
    institution: "",
    issueDate: "",
    expiryDate: "",
    description: "",
  });
  const [status, setStatus] = useState({ loading: false, success: null, error: null, tokenId: null });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!contract || !isIssuer) return alert("You must be a connected approved issuer.");
    setStatus({ loading: true, success: null, error: null, tokenId: null });
    try {
      const metadata = {
        name: form.credentialTitle,
        description: form.description,
        attributes: {
          recipientName: form.recipientName,
          recipientAddress: form.recipientAddress,
          institution: form.institution || issuerName,
          credentialType: form.credentialType,
          issueDate: form.issueDate,
          issuer: account,
        },
        issuedAt: new Date().toISOString(),
      };
      const ipfsRes = await fetch("/api/upload-ipfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata }),
      });
      const { ipfsHash, error: ipfsError } = await ipfsRes.json();
      if (ipfsError) throw new Error(JSON.stringify(ipfsError));
      const credentialHash = ethers.keccak256(
        ethers.toUtf8Bytes(`${form.recipientAddress}${form.credentialTitle}${form.issueDate}${account}`)
      );
      const expiresAt = form.expiryDate ? Math.floor(new Date(form.expiryDate).getTime() / 1000) : 0;
      const tx = await contract.issueCredential(form.recipientAddress, ipfsHash, form.credentialType, credentialHash, expiresAt);
      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment?.name === "CredentialIssued");
      const tokenId = event ? event.args[0].toString() : "unknown";
      try {
        await emailjs.send(
          process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID,
          process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID,
          {
            to_email: form.recipientEmail,
            recipient_name: form.recipientName,
            credential_title: form.credentialTitle,
            institution: form.institution || issuerName,
            issue_date: form.issueDate,
            token_id: tokenId,
            verify_url: `${window.location.origin}/verify?id=${tokenId}`,
          },
          process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
        );
      } catch (emailErr) { console.log("Email failed:", emailErr); }
      setStatus({ loading: false, success: true, error: null, tokenId });
      setForm({ recipientAddress: "", recipientName: "", recipientEmail: "", credentialTitle: "", credentialType: "DEGREE", institution: "", issueDate: "", expiryDate: "", description: "" });
    } catch (err) {
      setStatus({ loading: false, success: false, error: err.message, tokenId: null });
    }
  };

  const S = {
    page: {
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 30% 20%, rgba(15,36,96,0.4) 0%, transparent 60%), #020818",
      fontFamily: "'DM Sans', sans-serif",
      padding: "48px 24px",
    },
    card: {
      background: "linear-gradient(135deg, rgba(10,26,74,0.8), rgba(5,15,46,0.9))",
      border: "1px solid rgba(201,168,76,0.15)",
      borderRadius: "24px", padding: "40px",
      maxWidth: "680px", margin: "0 auto",
    },
    label: {
      display: "block", fontSize: "11px", fontWeight: "600",
      letterSpacing: "0.08em", color: "rgba(201,168,76,0.8)",
      marginBottom: "8px",
    },
    input: {
      width: "100%",
      background: "rgba(5,15,46,0.8)",
      border: "1px solid rgba(201,168,76,0.2)",
      borderRadius: "10px", color: "white",
      fontFamily: "'DM Sans', sans-serif",
      fontSize: "14px", padding: "12px 16px",
      outline: "none", transition: "border-color 0.2s ease",
      boxSizing: "border-box",
    },
    inputMono: {
      fontFamily: "'DM Mono', monospace",
      fontSize: "13px",
    },
    select: {
      width: "100%",
      background: "rgba(5,15,46,0.8)",
      border: "1px solid rgba(201,168,76,0.2)",
      borderRadius: "10px", color: "white",
      fontFamily: "'DM Sans', sans-serif",
      fontSize: "14px", padding: "12px 16px",
      outline: "none",
    },
  };

  if (!account) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>🏛️</div>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: "700", color: "white", marginBottom: "8px" }}>
          Institution Portal
        </p>
        <p style={{ color: "rgba(180,195,230,0.6)", marginBottom: "28px", fontSize: "14px" }}>
          Connect your institution wallet to issue credentials.
        </p>
        <button onClick={connectWallet} style={{
          background: "linear-gradient(135deg, #c9a84c, #d4b96a)",
          border: "none", borderRadius: "10px", padding: "12px 28px",
          fontSize: "14px", fontWeight: "600", color: "#020818",
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        }}>Connect Wallet</button>
      </div>
    </div>
  );

  if (!isIssuer) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        background: "rgba(248,113,113,0.08)",
        border: "1px solid rgba(248,113,113,0.3)",
        borderRadius: "20px", padding: "48px", maxWidth: "440px", textAlign: "center",
      }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚫</div>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "#f87171", marginBottom: "8px" }}>Access Denied</p>
        <p style={{ color: "rgba(248,113,113,0.7)", fontSize: "14px", marginBottom: "16px" }}>
          Your wallet is not registered as an approved issuer.
        </p>
        <p style={{ fontSize: "11px", color: "rgba(180,195,230,0.3)", fontFamily: "'DM Mono', monospace", wordBreak: "break-all" }}>{account}</p>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: "20px", padding: "4px 14px", marginBottom: "16px",
            fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", color: "#c9a84c",
          }}>✦ CREDENTIAL ISSUANCE</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "32px", fontWeight: "700", color: "white", marginBottom: "8px",
          }}>Issue Credential</h1>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "rgba(52,211,153,0.08)",
            border: "1px solid rgba(52,211,153,0.2)",
            borderRadius: "8px", padding: "6px 14px",
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399", display: "inline-block" }} />
            <span style={{ fontSize: "13px", color: "#34d399", fontWeight: "500" }}>
              Issuing as {issuerName}
            </span>
          </div>
        </div>

        {/* Success */}
        {status.success && (
          <div style={{
            background: "rgba(52,211,153,0.08)",
            border: "1px solid rgba(52,211,153,0.3)",
            borderRadius: "12px", padding: "20px", marginBottom: "24px",
          }}>
            <p style={{ color: "#34d399", fontWeight: "600", marginBottom: "4px" }}>✓ Credential Issued Successfully!</p>
            <p style={{ color: "rgba(52,211,153,0.7)", fontSize: "13px" }}>
              Token ID: <span style={{ fontFamily: "'DM Mono', monospace" }}>#{status.tokenId}</span>
            </p>
          </div>
        )}

        {/* Error */}
        {status.error && (
          <div style={{
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.3)",
            borderRadius: "12px", padding: "20px", marginBottom: "24px",
          }}>
            <p style={{ color: "#f87171", fontWeight: "600", marginBottom: "4px" }}>Error</p>
            <p style={{ color: "rgba(248,113,113,0.7)", fontSize: "12px", wordBreak: "break-all" }}>{status.error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleIssue}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Recipient Address */}
            <div>
              <label style={S.label}>RECIPIENT WALLET ADDRESS *</label>
              <input name="recipientAddress" value={form.recipientAddress} onChange={handleChange}
                placeholder="0x..." required style={{ ...S.input, ...S.inputMono }}
                onFocus={e => e.target.style.borderColor = "#c9a84c"}
                onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
              />
            </div>

            {/* Name + Email */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={S.label}>RECIPIENT NAME *</label>
                <input name="recipientName" value={form.recipientName} onChange={handleChange}
                  placeholder="Jane Doe" required style={S.input}
                  onFocus={e => e.target.style.borderColor = "#c9a84c"}
                  onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
                />
              </div>
              <div>
                <label style={S.label}>RECIPIENT EMAIL *</label>
                <input type="email" name="recipientEmail" value={form.recipientEmail} onChange={handleChange}
                  placeholder="jane@example.com" required style={S.input}
                  onFocus={e => e.target.style.borderColor = "#c9a84c"}
                  onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
                />
              </div>
            </div>

            {/* Credential Title */}
            <div>
              <label style={S.label}>CREDENTIAL TITLE *</label>
              <input name="credentialTitle" value={form.credentialTitle} onChange={handleChange}
                placeholder="B.Tech Computer Science" required style={S.input}
                onFocus={e => e.target.style.borderColor = "#c9a84c"}
                onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
              />
            </div>

            {/* Type + Issue Date + Expiry */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div>
                <label style={S.label}>TYPE *</label>
                <select name="credentialType" value={form.credentialType} onChange={handleChange} style={S.select}>
                  <option value="DEGREE">Degree</option>
                  <option value="CERTIFICATE">Certificate</option>
                  <option value="BADGE">Badge</option>
                  <option value="LICENSE">License</option>
                </select>
              </div>
              <div>
                <label style={S.label}>ISSUE DATE *</label>
                <input type="date" name="issueDate" value={form.issueDate} onChange={handleChange}
                  required style={S.input}
                  onFocus={e => e.target.style.borderColor = "#c9a84c"}
                  onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
                />
              </div>
              <div>
                <label style={S.label}>EXPIRY DATE</label>
                <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange}
                  style={S.input}
                  onFocus={e => e.target.style.borderColor = "#c9a84c"}
                  onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={S.label}>DESCRIPTION</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                rows={3} placeholder="Additional details about this credential..."
                style={{ ...S.input, resize: "vertical" }}
                onFocus={e => e.target.style.borderColor = "#c9a84c"}
                onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
              />
            </div>

            {/* Divider */}
            <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)" }} />

            {/* What happens info */}
            <div style={{
              background: "rgba(201,168,76,0.05)",
              border: "1px solid rgba(201,168,76,0.1)",
              borderRadius: "10px", padding: "14px 16px",
              display: "flex", gap: "16px", fontSize: "12px",
              color: "rgba(201,168,76,0.6)",
            }}>
              {["Metadata uploaded to IPFS", "NFT minted on Ethereum", "Email sent to recipient"].map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "#c9a84c" }}>0{i + 1}</span> {step}
                </div>
              ))}
            </div>

            {/* Submit */}
            <button type="submit" disabled={status.loading} style={{
              background: status.loading
                ? "rgba(201,168,76,0.3)"
                : "linear-gradient(135deg, #c9a84c, #d4b96a)",
              border: "none", borderRadius: "12px",
              padding: "16px", fontSize: "15px", fontWeight: "600",
              color: status.loading ? "rgba(2,8,24,0.4)" : "#020818",
              cursor: status.loading ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', sans-serif",
              width: "100%", letterSpacing: "0.02em",
              transition: "all 0.2s ease",
              boxShadow: status.loading ? "none" : "0 8px 24px rgba(201,168,76,0.2)",
            }}>
              {status.loading ? "Uploading to IPFS + Minting on Blockchain..." : "Issue Credential on Blockchain"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}