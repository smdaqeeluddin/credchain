"use client";
import { useState, useEffect } from "react";
import { useWallet } from "../../context/WalletContext";
import { ethers } from "ethers";

export default function MultiSigPage() {
  const { account, contract, isIssuer, issuerName, connectWallet } = useWallet();
  const [activeTab, setActiveTab] = useState("create");
  const [proposals, setProposals] = useState([]);
  const [form, setForm] = useState({
    recipientAddress: "", recipientName: "", credentialTitle: "",
    credentialType: "DEGREE", issueDate: "", requiredApprovers: "",
  });
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  useEffect(() => { if (account) loadProposals(); }, [account]);

  const loadProposals = () => {
    try {
      const all = [];
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("credchain_multisig_")) {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.creator.toLowerCase() === account.toLowerCase() ||
            data.approvers.some(a => a.toLowerCase() === account.toLowerCase())) {
            all.push(data);
          }
        }
      });
      setProposals(all.sort((a, b) => b.createdAt - a.createdAt));
    } catch (_) {}
  };

  const handleCreate = async () => {
    if (!form.recipientAddress || !form.recipientName || !form.credentialTitle || !form.requiredApprovers)
      return alert("Fill all fields");
    const approvers = form.requiredApprovers.split(",").map(a => a.trim()).filter(Boolean);
    if (approvers.length < 1) return alert("Add at least one approver address");
    setCreating(true);
    try {
      const proposal = {
        id: Date.now().toString(), creator: account, creatorName: issuerName,
        recipientAddress: form.recipientAddress, recipientName: form.recipientName,
        credentialTitle: form.credentialTitle, credentialType: form.credentialType,
        issueDate: form.issueDate, approvers, approvals: [], denials: [],
        status: "PENDING", createdAt: Date.now(), requiredCount: approvers.length,
      };
      localStorage.setItem(`credchain_multisig_${proposal.id}`, JSON.stringify(proposal));
      setCreated(true);
      setForm({ recipientAddress: "", recipientName: "", credentialTitle: "", credentialType: "DEGREE", issueDate: "", requiredApprovers: "" });
      loadProposals();
      setTimeout(() => setCreated(false), 3000);
    } catch (err) { alert("Failed: " + err.message); }
    finally { setCreating(false); }
  };

  const handleApprove = async (proposalId, approved) => {
    try {
      const key = `credchain_multisig_${proposalId}`;
      const proposal = JSON.parse(localStorage.getItem(key));
      if (approved) { if (!proposal.approvals.includes(account)) proposal.approvals.push(account); }
      else { if (!proposal.denials.includes(account)) proposal.denials.push(account); }
      if (proposal.approvals.length >= proposal.requiredCount) proposal.status = "APPROVED";
      else if (proposal.denials.length > 0) proposal.status = "DENIED";
      localStorage.setItem(key, JSON.stringify(proposal));
      loadProposals();
    } catch (err) { alert("Failed: " + err.message); }
  };

  const handleMint = async (proposal) => {
    if (!contract) return alert("Connect wallet first");
    try {
      const metadata = {
        name: proposal.credentialTitle,
        description: "Multi-signature verified credential",
        attributes: {
          recipientName: proposal.recipientName, recipientAddress: proposal.recipientAddress,
          institution: proposal.creatorName, credentialType: proposal.credentialType,
          issueDate: proposal.issueDate, issuer: account,
          multiSigApprovers: proposal.approvals.join(", "),
        },
        issuedAt: new Date().toISOString(),
      };
      const ipfsRes = await fetch("/api/upload-ipfs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata }),
      });
      const { ipfsHash } = await ipfsRes.json();
      const credentialHash = ethers.keccak256(ethers.toUtf8Bytes(
        `${proposal.recipientAddress}${proposal.credentialTitle}${proposal.issueDate}${account}`
      ));
      const tx = await contract.issueCredential(proposal.recipientAddress, ipfsHash, proposal.credentialType, credentialHash, 0);
      await tx.wait();
      const key = `credchain_multisig_${proposal.id}`;
      const data = JSON.parse(localStorage.getItem(key));
      data.status = "MINTED";
      localStorage.setItem(key, JSON.stringify(data));
      loadProposals();
      alert("Credential minted successfully!");
    } catch (err) { alert("Mint failed: " + err.message); }
  };

  const S = {
    page: {
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 30% 20%, rgba(15,36,96,0.4) 0%, transparent 60%), #020818",
      fontFamily: "'DM Sans', sans-serif", padding: "48px 24px",
    },
    card: {
      background: "linear-gradient(135deg, rgba(10,26,74,0.8), rgba(5,15,46,0.9))",
      border: "1px solid rgba(201,168,76,0.15)", borderRadius: "20px", padding: "32px",
    },
    label: {
      display: "block", fontSize: "11px", fontWeight: "600",
      letterSpacing: "0.08em", color: "rgba(201,168,76,0.8)", marginBottom: "8px",
    },
    input: {
      width: "100%", background: "rgba(5,15,46,0.8)",
      border: "1px solid rgba(201,168,76,0.2)", borderRadius: "10px", color: "white",
      fontFamily: "'DM Sans', sans-serif", fontSize: "14px", padding: "12px 16px",
      outline: "none", boxSizing: "border-box",
    },
    tabActive: {
      flex: 1, padding: "10px", borderRadius: "10px",
      border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.12)",
      color: "#e2ce94", fontWeight: "600", fontSize: "13px",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    },
    tabInactive: {
      flex: 1, padding: "10px", borderRadius: "10px",
      border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)",
      color: "rgba(180,195,230,0.5)", fontWeight: "500", fontSize: "13px",
      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    },
  };

  if (!account) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>✍️</div>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: "700", color: "white", marginBottom: "8px" }}>
          Multi-Sig Issuance
        </p>
        <p style={{ color: "rgba(180,195,230,0.6)", marginBottom: "28px", fontSize: "14px" }}>
          Connect wallet to access multi-signature issuance.
        </p>
        <button onClick={connectWallet} style={{
          background: "linear-gradient(135deg, #c9a84c, #d4b96a)", border: "none",
          borderRadius: "10px", padding: "12px 28px", fontSize: "14px",
          fontWeight: "600", color: "#020818", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
        }}>Connect Wallet</button>
      </div>
    </div>
  );

  if (!isIssuer) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)",
        borderRadius: "20px", padding: "48px", maxWidth: "440px", textAlign: "center",
      }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚫</div>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "#f87171", marginBottom: "8px" }}>Access Denied</p>
        <p style={{ color: "rgba(248,113,113,0.7)", fontSize: "14px" }}>Only approved issuers can create multi-sig proposals.</p>
      </div>
    </div>
  );

  const pendingCount = proposals.filter(p => p.status === "PENDING").length;

  return (
    <div style={S.page}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: "20px", padding: "4px 14px", marginBottom: "16px",
            fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", color: "#c9a84c",
          }}>✦ MULTI-SIGNATURE ISSUANCE</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "36px", fontWeight: "700", color: "white", marginBottom: "8px",
          }}>Multi-Sig Credential Approval</h1>
          <p style={{ fontSize: "14px", color: "rgba(180,195,230,0.6)" }}>
            Require multiple approvers before a credential is minted. Enterprise-grade compliance.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <button onClick={() => setActiveTab("create")} style={activeTab === "create" ? S.tabActive : S.tabInactive}>
            Create Proposal
          </button>
          <button onClick={() => { setActiveTab("proposals"); loadProposals(); }} style={{
            ...(activeTab === "proposals" ? S.tabActive : S.tabInactive),
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
          }}>
            Proposals
            {pendingCount > 0 && (
              <span style={{
                background: "#f87171", color: "white", borderRadius: "999px",
                padding: "1px 7px", fontSize: "10px", fontWeight: "700",
              }}>{pendingCount}</span>
            )}
          </button>
        </div>

        <div style={S.card}>

          {/* Create Tab */}
          {activeTab === "create" && (
            <div>
              <p style={{ fontSize: "13px", color: "rgba(180,195,230,0.5)", marginBottom: "24px" }}>
                Create a proposal requiring approval from multiple signers before minting.
              </p>

              {created && (
                <div style={{
                  background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.3)",
                  borderRadius: "10px", padding: "14px 16px", marginBottom: "20px",
                  color: "#34d399", fontWeight: "600", fontSize: "13px",
                }}>✓ Proposal created! Approvers can now see it in their proposals tab.</div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div>
                  <label style={S.label}>RECIPIENT WALLET ADDRESS</label>
                  <input value={form.recipientAddress} onChange={e => setForm({ ...form, recipientAddress: e.target.value })}
                    placeholder="0x..." style={{ ...S.input, fontFamily: "'DM Mono', monospace", fontSize: "13px" }}
                    onFocus={e => e.target.style.borderColor = "#c9a84c"}
                    onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={S.label}>RECIPIENT NAME</label>
                    <input value={form.recipientName} onChange={e => setForm({ ...form, recipientName: e.target.value })}
                      placeholder="Jane Doe" style={S.input}
                      onFocus={e => e.target.style.borderColor = "#c9a84c"}
                      onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
                    />
                  </div>
                  <div>
                    <label style={S.label}>CREDENTIAL TITLE</label>
                    <input value={form.credentialTitle} onChange={e => setForm({ ...form, credentialTitle: e.target.value })}
                      placeholder="B.Tech Computer Science" style={S.input}
                      onFocus={e => e.target.style.borderColor = "#c9a84c"}
                      onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={S.label}>TYPE</label>
                    <select value={form.credentialType} onChange={e => setForm({ ...form, credentialType: e.target.value })}
                      style={{ ...S.input, cursor: "pointer" }}
                      onFocus={e => e.target.style.borderColor = "#c9a84c"}
                      onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
                    >
                      {["DEGREE", "CERTIFICATE", "BADGE", "LICENSE"].map(t => (
                        <option key={t} value={t} style={{ background: "#050f2e" }}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>ISSUE DATE</label>
                    <input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })}
                      style={S.input}
                      onFocus={e => e.target.style.borderColor = "#c9a84c"}
                      onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
                    />
                  </div>
                </div>

                <div>
                  <label style={S.label}>REQUIRED APPROVER ADDRESSES (COMMA SEPARATED)</label>
                  <textarea value={form.requiredApprovers} onChange={e => setForm({ ...form, requiredApprovers: e.target.value })}
                    placeholder="0xApprover1, 0xApprover2" rows={2}
                    style={{ ...S.input, resize: "vertical", fontFamily: "'DM Mono', monospace", fontSize: "12px" }}
                    onFocus={e => e.target.style.borderColor = "#c9a84c"}
                    onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
                  />
                  <p style={{ fontSize: "11px", color: "rgba(180,195,230,0.35)", marginTop: "6px" }}>
                    All approvers must sign before the credential can be minted.
                  </p>
                </div>

                <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.2), transparent)" }} />

                <button onClick={handleCreate} disabled={creating} style={{
                  background: creating ? "rgba(201,168,76,0.3)" : "linear-gradient(135deg, #c9a84c, #d4b96a)",
                  border: "none", borderRadius: "12px", padding: "14px",
                  fontSize: "14px", fontWeight: "600",
                  color: creating ? "rgba(2,8,24,0.4)" : "#020818",
                  cursor: creating ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', sans-serif", width: "100%",
                }}>
                  {creating ? "Creating..." : "Create Multi-Sig Proposal"}
                </button>
              </div>
            </div>
          )}

          {/* Proposals Tab */}
          {activeTab === "proposals" && (
            <div>
              <p style={{ fontSize: "13px", color: "rgba(180,195,230,0.5)", marginBottom: "20px" }}>
                Proposals you created or need to approve.
              </p>

              {proposals.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px", color: "rgba(180,195,230,0.4)" }}>
                  <p style={{ fontSize: "48px", marginBottom: "12px" }}>📋</p>
                  <p style={{ fontSize: "14px" }}>No proposals yet.</p>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {proposals.map((p) => {
                  const statusColors = {
                    PENDING: { color: "#c9a84c", bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.25)" },
                    APPROVED: { color: "#34d399", bg: "rgba(52,211,153,0.06)", border: "rgba(52,211,153,0.25)" },
                    MINTED: { color: "#60a5fa", bg: "rgba(96,165,250,0.06)", border: "rgba(96,165,250,0.25)" },
                    DENIED: { color: "#f87171", bg: "rgba(248,113,113,0.06)", border: "rgba(248,113,113,0.25)" },
                  };
                  const sc = statusColors[p.status] || statusColors.PENDING;
                  const canApprove = p.status === "PENDING" &&
                    p.approvers.some(a => a.toLowerCase() === account.toLowerCase()) &&
                    !p.approvals.includes(account) && !p.denials.includes(account);

                  return (
                    <div key={p.id} style={{
                      background: sc.bg, border: `1px solid ${sc.border}`,
                      borderRadius: "16px", padding: "22px",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                        <div>
                          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "17px", fontWeight: "700", color: "white", marginBottom: "3px" }}>
                            {p.credentialTitle}
                          </p>
                          <p style={{ fontSize: "12px", color: "rgba(180,195,230,0.5)" }}>For: {p.recipientName}</p>
                        </div>
                        <span style={{
                          background: `${sc.color}18`, border: `1px solid ${sc.color}40`,
                          borderRadius: "20px", padding: "3px 10px",
                          fontSize: "10px", fontWeight: "700", color: sc.color, letterSpacing: "0.06em",
                        }}>{p.status}</span>
                      </div>

                      {/* Approval Progress */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                        <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: "999px", height: "5px" }}>
                          <div style={{
                            height: "5px", borderRadius: "999px", background: "#34d399",
                            width: `${(p.approvals.length / p.requiredCount) * 100}%`,
                            transition: "width 0.4s ease",
                          }} />
                        </div>
                        <span style={{ fontSize: "12px", color: "rgba(180,195,230,0.6)", whiteSpace: "nowrap" }}>
                          {p.approvals.length}/{p.requiredCount} approved
                        </span>
                      </div>

                      {canApprove && (
                        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                          <button onClick={() => handleApprove(p.id, true)} style={{
                            flex: 1, background: "rgba(52,211,153,0.1)",
                            border: "1px solid rgba(52,211,153,0.3)",
                            borderRadius: "8px", padding: "9px",
                            fontSize: "13px", fontWeight: "600", color: "#34d399",
                            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                          }}>Approve</button>
                          <button onClick={() => handleApprove(p.id, false)} style={{
                            flex: 1, background: "rgba(248,113,113,0.1)",
                            border: "1px solid rgba(248,113,113,0.3)",
                            borderRadius: "8px", padding: "9px",
                            fontSize: "13px", fontWeight: "600", color: "#f87171",
                            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                          }}>Deny</button>
                        </div>
                      )}

                      {p.status === "APPROVED" && p.creator.toLowerCase() === account.toLowerCase() && (
                        <button onClick={() => handleMint(p)} style={{
                          width: "100%", background: "linear-gradient(135deg, #c9a84c, #d4b96a)",
                          border: "none", borderRadius: "10px", padding: "11px",
                          fontSize: "13px", fontWeight: "600", color: "#020818",
                          cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                        }}>
                          Mint Credential on Blockchain
                        </button>
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