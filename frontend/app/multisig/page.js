"use client";
import { useState, useEffect } from "react";
import { useWallet } from "../../context/WalletContext";
import { ethers } from "ethers";

export default function MultiSigPage() {
  const { account, contract, isIssuer, issuerName, connectWallet } = useWallet();
  const [activeTab, setActiveTab] = useState("create");
  const [proposals, setProposals] = useState([]);
  const [form, setForm] = useState({
    recipientAddress: "",
    recipientName: "",
    credentialTitle: "",
    credentialType: "DEGREE",
    issueDate: "",
    requiredApprovers: "",
  });
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    if (!account) return;
    loadProposals();
  }, [account]);

  const loadProposals = () => {
    try {
      const all = [];
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("credchain_multisig_")) {
          const data = JSON.parse(localStorage.getItem(key));
          if (
            data.creator.toLowerCase() === account.toLowerCase() ||
            data.approvers.some(a => a.toLowerCase() === account.toLowerCase())
          ) {
            all.push(data);
          }
        }
      });
      setProposals(all.sort((a, b) => b.createdAt - a.createdAt));
    } catch (_) {}
  };

  const handleCreate = async () => {
    if (!form.recipientAddress || !form.recipientName || !form.credentialTitle || !form.requiredApprovers) {
      return alert("Fill all fields");
    }
    const approvers = form.requiredApprovers.split(",").map(a => a.trim()).filter(Boolean);
    if (approvers.length < 1) return alert("Add at least one approver address");

    setCreating(true);
    try {
      const proposal = {
        id: Date.now().toString(),
        creator: account,
        creatorName: issuerName,
        recipientAddress: form.recipientAddress,
        recipientName: form.recipientName,
        credentialTitle: form.credentialTitle,
        credentialType: form.credentialType,
        issueDate: form.issueDate,
        approvers,
        approvals: [],
        denials: [],
        status: "PENDING",
        createdAt: Date.now(),
        requiredCount: approvers.length,
      };

      localStorage.setItem(`credchain_multisig_${proposal.id}`, JSON.stringify(proposal));
      setCreated(true);
      setForm({
        recipientAddress: "",
        recipientName: "",
        credentialTitle: "",
        credentialType: "DEGREE",
        issueDate: "",
        requiredApprovers: "",
      });
      loadProposals();
      setTimeout(() => setCreated(false), 3000);
    } catch (err) {
      alert("Failed: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async (proposalId, approved) => {
    try {
      const key = `credchain_multisig_${proposalId}`;
      const proposal = JSON.parse(localStorage.getItem(key));

      if (approved) {
        if (!proposal.approvals.includes(account)) {
          proposal.approvals.push(account);
        }
      } else {
        if (!proposal.denials.includes(account)) {
          proposal.denials.push(account);
        }
      }

      if (proposal.approvals.length >= proposal.requiredCount) {
        proposal.status = "APPROVED";
      } else if (proposal.denials.length > 0) {
        proposal.status = "DENIED";
      }

      localStorage.setItem(key, JSON.stringify(proposal));
      loadProposals();
    } catch (err) {
      alert("Failed: " + err.message);
    }
  };

  const handleMint = async (proposal) => {
    if (!contract) return alert("Connect wallet first");
    try {
      const metadata = {
        name: proposal.credentialTitle,
        description: "Multi-signature verified credential",
        attributes: {
          recipientName: proposal.recipientName,
          recipientAddress: proposal.recipientAddress,
          institution: proposal.creatorName,
          credentialType: proposal.credentialType,
          issueDate: proposal.issueDate,
          issuer: account,
          multiSigApprovers: proposal.approvals.join(", "),
        },
        issuedAt: new Date().toISOString(),
      };

      const ipfsRes = await fetch("/api/upload-ipfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata }),
      });
      const { ipfsHash } = await ipfsRes.json();

      const credentialHash = ethers.keccak256(
        ethers.toUtf8Bytes(
          `${proposal.recipientAddress}${proposal.credentialTitle}${proposal.issueDate}${account}`
        )
      );

      const tx = await contract.issueCredential(
        proposal.recipientAddress,
        ipfsHash,
        proposal.credentialType,
        credentialHash,
        0
      );
      await tx.wait();

      const key = `credchain_multisig_${proposal.id}`;
      const data = JSON.parse(localStorage.getItem(key));
      data.status = "MINTED";
      localStorage.setItem(key, JSON.stringify(data));
      loadProposals();
      alert("Credential minted successfully!");
    } catch (err) {
      alert("Mint failed: " + err.message);
    }
  };

  if (!account) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-4">✍️</p>
        <p className="text-gray-600 mb-4">Connect wallet to access multi-signature issuance.</p>
        <button onClick={connectWallet} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Connect Wallet
        </button>
      </div>
    </div>
  );

  if (!isIssuer) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
        <p className="text-red-700 font-semibold text-lg mb-2">Access Denied</p>
        <p className="text-red-600 text-sm">Only approved issuers can create multi-sig proposals.</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold mb-3">
          MULTI-SIGNATURE ISSUANCE
        </div>
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Multi-Sig Credential Approval</h1>
        <p className="text-gray-500">Require multiple approvers before a credential is minted. Enterprise-grade compliance.</p>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${activeTab === "create" ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Create Proposal
        </button>
        <button
          onClick={() => { setActiveTab("proposals"); loadProposals(); }}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${activeTab === "proposals" ? "bg-orange-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
        >
          Proposals {proposals.filter(p => p.status === "PENDING").length > 0 && (
            <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {proposals.filter(p => p.status === "PENDING").length}
            </span>
          )}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-8">
        {activeTab === "create" && (
          <div>
            <p className="text-sm text-gray-500 mb-6">Create a credential proposal that requires approval from multiple signers before minting.</p>

            {created && (
              <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-4 text-green-700 font-semibold">
                Proposal created! Approvers will see it in their proposals tab.
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Wallet Address</label>
                <input
                  value={form.recipientAddress}
                  onChange={(e) => setForm({ ...form, recipientAddress: e.target.value })}
                  placeholder="0x..."
                  className="w-full border rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
                <input
                  value={form.recipientName}
                  onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                  placeholder="Jane Doe"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Credential Title</label>
                <input
                  value={form.credentialTitle}
                  onChange={(e) => setForm({ ...form, credentialTitle: e.target.value })}
                  placeholder="B.Tech Computer Science"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={form.credentialType}
                    onChange={(e) => setForm({ ...form, credentialType: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="DEGREE">Degree</option>
                    <option value="CERTIFICATE">Certificate</option>
                    <option value="BADGE">Badge</option>
                    <option value="LICENSE">License</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Required Approver Addresses (comma separated)</label>
                <textarea
                  value={form.requiredApprovers}
                  onChange={(e) => setForm({ ...form, requiredApprovers: e.target.value })}
                  placeholder="0xApprover1, 0xApprover2"
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-400 mt-1">All approvers must approve before credential can be minted.</p>
              </div>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Multi-Sig Proposal"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "proposals" && (
          <div>
            <p className="text-sm text-gray-500 mb-6">Proposals you created or need to approve.</p>

            {proposals.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <p className="text-4xl mb-3">📋</p>
                <p>No proposals yet.</p>
              </div>
            )}

            <div className="space-y-4">
              {proposals.map((p) => (
                <div key={p.id} className={`border rounded-xl p-5 ${
                  p.status === "PENDING" ? "border-orange-200 bg-orange-50" :
                  p.status === "APPROVED" ? "border-green-200 bg-green-50" :
                  p.status === "MINTED" ? "border-blue-200 bg-blue-50" :
                  "border-red-200 bg-red-50"
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-gray-800">{p.credentialTitle}</p>
                      <p className="text-gray-500 text-sm">For: {p.recipientName}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      p.status === "PENDING" ? "bg-orange-100 text-orange-700" :
                      p.status === "APPROVED" ? "bg-green-100 text-green-700" :
                      p.status === "MINTED" ? "bg-blue-100 text-blue-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(p.approvals.length / p.requiredCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 font-semibold">
                      {p.approvals.length}/{p.requiredCount} approved
                    </span>
                  </div>

                  {p.status === "PENDING" && p.approvers.includes(account) && !p.approvals.includes(account) && !p.denials.includes(account) && (
                    <div className="flex gap-3 mb-3">
                      <button
                        onClick={() => handleApprove(p.id, true)}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprove(p.id, false)}
                        className="flex-1 bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition text-sm"
                      >
                        Deny
                      </button>
                    </div>
                  )}

                  {p.status === "APPROVED" && p.creator.toLowerCase() === account.toLowerCase() && (
                    <button
                      onClick={() => handleMint(p)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition text-sm"
                    >
                      Mint Credential on Blockchain
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}