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
        ethers.toUtf8Bytes(
          `${form.recipientAddress}${form.credentialTitle}${form.issueDate}${account}`
        )
      );

      const expiresAt = form.expiryDate 
        ? Math.floor(new Date(form.expiryDate).getTime() / 1000)
        : 0;

      const tx = await contract.issueCredential(
        form.recipientAddress,
        ipfsHash,
        form.credentialType,
        credentialHash,
        expiresAt
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find((l) => l.fragment?.name === "CredentialIssued");
      const tokenId = event ? event.args[0].toString() : "unknown";

      // Send email notification
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
} catch (emailErr) {
  console.log("Email failed:", emailErr);
}

      setStatus({ loading: false, success: true, error: null, tokenId });
      setForm({ recipientAddress: "", recipientName: "", recipientEmail: "", credentialTitle: "", credentialType: "DEGREE", institution: "", issueDate: "", expiryDate: "", description: "" });
    } catch (err) {
      setStatus({ loading: false, success: false, error: err.message, tokenId: null });
    }
  };

  if (!account) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 mb-4">Please connect your MetaMask wallet to continue.</p>
        <button onClick={connectWallet} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Connect Wallet</button>
      </div>
    </div>
  );

  if (!isIssuer) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-md text-center">
        <p className="text-red-700 font-semibold text-lg mb-2">Access Denied</p>
        <p className="text-red-600">Your wallet is not registered as an approved issuer.</p>
        <p className="text-xs text-gray-500 mt-4 font-mono break-all">{account}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-blue-900 mb-1">Issue Credential</h1>
        <p className="text-gray-500 mb-6">Issuing as: <span className="font-semibold text-green-700">{issuerName}</span></p>

        {status.success && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-semibold">Credential Issued Successfully!</p>
            <p className="text-green-700 text-sm">Token ID: <span className="font-mono">{status.tokenId}</span></p>
          </div>
        )}
        {status.error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-600 text-sm break-all">{status.error}</p>
          </div>
        )}

        <form onSubmit={handleIssue} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Wallet Address *</label>
            <input name="recipientAddress" value={form.recipientAddress} onChange={handleChange} placeholder="0x..." required className="w-full border rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Full Name *</label>
  <input name="recipientName" value={form.recipientName} onChange={handleChange} placeholder="Jane Doe" required className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
</div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Email *</label>
  <input type="email" name="recipientEmail" value={form.recipientEmail} onChange={handleChange} placeholder="jane@example.com" required className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
</div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credential Title *</label>
            <input name="credentialTitle" value={form.credentialTitle} onChange={handleChange} placeholder="B.Tech Computer Science" required className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credential Type *</label>
              <select name="credentialType" value={form.credentialType} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="DEGREE">Degree</option>
                <option value="CERTIFICATE">Certificate</option>
                <option value="BADGE">Badge</option>
                <option value="LICENSE">License</option>
              </select>
            </div>
            <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
  <input type="date" name="issueDate" value={form.issueDate} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
</div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (optional)</label>
  <input type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Additional details..." className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={status.loading} className="w-full bg-blue-700 text-white py-3 rounded-xl font-bold hover:bg-blue-800 transition disabled:opacity-50 text-lg">
            {status.loading ? "Issuing (uploading to IPFS + blockchain)..." : "Issue Credential on Blockchain"}
          </button>
        </form>
      </div>
    </div>
  );
}