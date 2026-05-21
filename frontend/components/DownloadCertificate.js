"use client";
import { useState } from "react";
import jsPDF from "jspdf";

export default function DownloadCertificate({ cred, metadata, tokenId }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const w = doc.internal.pageSize.getWidth();
      const h = doc.internal.pageSize.getHeight();

      // Deep navy background
      doc.setFillColor(8, 24, 68);
      doc.rect(0, 0, w, h, "F");

      // Gold outer border
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(4);
      doc.rect(8, 8, w - 16, h - 16, "S");

      // Thin inner border
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.8);
      doc.rect(12, 12, w - 24, h - 24, "S");

      // Top decorative band
      doc.setFillColor(20, 50, 120);
      doc.rect(12, 12, w - 24, 22, "F");

      // CredChain branding in band
      doc.setTextColor(212, 175, 55);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("C R E D C H A I N", w / 2, 20, { align: "center" });
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 200, 255);
      doc.text("BLOCKCHAIN-VERIFIED CREDENTIAL PLATFORM", w / 2, 27, { align: "center" });

      // Certificate of Achievement text
      doc.setTextColor(212, 175, 55);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("CERTIFICATE OF ACHIEVEMENT", w / 2, 44, { align: "center" });

      // Gold decorative line with diamonds
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      doc.line(40, 48, w / 2 - 15, 48);
      doc.line(w / 2 + 15, 48, w - 40, 48);
      doc.setFillColor(212, 175, 55);
      doc.circle(w / 2, 48, 1.5, "F");

      // This certifies that
      doc.setTextColor(160, 180, 220);
      doc.setFontSize(11);
      doc.setFont("helvetica", "italic");
      doc.text("This is to proudly certify that", w / 2, 60, { align: "center" });

      // Recipient name - large and prominent
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(32);
      doc.setFont("helvetica", "bold");
      const recipientName = metadata?.attributes?.recipientName || "Recipient Name";
      doc.text(recipientName, w / 2, 78, { align: "center" });

      // Underline for name
      const nameWidth = doc.getTextWidth(recipientName);
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.8);
      doc.line(w / 2 - nameWidth / 2, 81, w / 2 + nameWidth / 2, 81);

      // Has successfully completed
      doc.setTextColor(160, 180, 220);
      doc.setFontSize(11);
      doc.setFont("helvetica", "italic");
      doc.text("has successfully completed and been awarded", w / 2, 92, { align: "center" });

      // Credential title - gold and prominent
      doc.setTextColor(212, 175, 55);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(metadata?.name || "Credential Title", w / 2, 106, { align: "center" });

      // Credential type badge
      const credType = metadata?.attributes?.credentialType || "CERTIFICATE";
      doc.setFillColor(20, 50, 120);
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      const badgeW = 40;
      doc.roundedRect(w / 2 - badgeW / 2, 110, badgeW, 8, 2, 2, "FD");
      doc.setTextColor(212, 175, 55);
      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.text(credType, w / 2, 115.5, { align: "center" });

      // Issued by
      doc.setTextColor(160, 180, 220);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Issued by", w / 2, 126, { align: "center" });
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(metadata?.attributes?.institution || "Institution", w / 2, 134, { align: "center" });

      // Bottom decorative line
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(0.5);
      doc.line(30, 140, w - 30, 140);

      // Bottom details row
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      // Issue date (left)
      doc.setTextColor(160, 180, 220);
      doc.text("DATE OF ISSUE", 45, 148);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text(metadata?.attributes?.issueDate || "N/A", 45, 154);

      // Token ID (center)
      doc.setTextColor(160, 180, 220);
      doc.setFontSize(8);
      doc.text("TOKEN ID", w / 2, 148, { align: "center" });
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text("#" + tokenId, w / 2, 154, { align: "center" });

      // Issuer wallet (right)
      doc.setTextColor(160, 180, 220);
      doc.setFontSize(8);
      doc.text("ISSUER ADDRESS", w - 45, 148, { align: "right" });
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      const issuerAddr = cred[1] ? cred[1].slice(0, 10) + "..." + cred[1].slice(-8) : "N/A";
      doc.text(issuerAddr, w - 45, 154, { align: "right" });

      // Blockchain verified footer
      doc.setFillColor(10, 35, 90);
      doc.rect(12, 158, w - 24, 14, "F");

      doc.setTextColor(100, 220, 100);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("✓ VERIFIED ON ETHEREUM BLOCKCHAIN", w / 2 - 10, 164, { align: "center" });
      doc.setTextColor(100, 120, 180);
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.text("IPFS: " + (cred[3] || "N/A"), w / 2 - 10, 169, { align: "center" });

      doc.save(`CredChain-${recipientName.replace(/ /g, "-")}-Certificate.pdf`);
    } catch (err) {
      console.error("PDF error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 transition disabled:opacity-50"
    >
      {loading ? "Generating..." : "📄 Download Certificate"}
    </button>
  );
}