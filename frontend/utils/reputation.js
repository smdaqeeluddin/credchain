export function calculateReputationScore(cred, verifierCount, metadata) {
  let score = 0;
  let breakdown = [];

  // 1. Credential Status (30 points)
  if (!cred.revoked && !cred.isExpired) {
    score += 30;
    breakdown.push({ label: "Active & Valid", points: 30, max: 30 });
  } else {
    breakdown.push({ label: "Active & Valid", points: 0, max: 30 });
  }

  // 2. Verification Count (25 points)
  const verifyPoints = Math.min(verifierCount * 5, 25);
  score += verifyPoints;
  breakdown.push({ label: "Employer Verifications", points: verifyPoints, max: 25, count: verifierCount });

  // 3. Credential Age - older = more established (20 points)
  const issuedAt = Number(cred[5]);
  const ageInDays = (Date.now() / 1000 - issuedAt) / 86400;
  const agePoints = Math.min(Math.floor(ageInDays / 10), 20);
  score += agePoints;
  breakdown.push({ label: "Credential Age", points: agePoints, max: 20 });

  // 4. Has Expiry Set (10 points) - shows issuer diligence
  const expiresAt = Number(cred[6]);
  if (expiresAt > 0) {
    score += 10;
    breakdown.push({ label: "Expiry Defined", points: 10, max: 10 });
  } else {
    breakdown.push({ label: "Expiry Defined", points: 0, max: 10 });
  }

  // 5. Metadata Quality (15 points)
  let metaPoints = 0;
  if (metadata?.name) metaPoints += 5;
  if (metadata?.attributes?.recipientName) metaPoints += 5;
  if (metadata?.description) metaPoints += 5;
  score += metaPoints;
  breakdown.push({ label: "Metadata Completeness", points: metaPoints, max: 15 });

  return {
    score: Math.min(score, 100),
    breakdown,
    grade: score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B+" : score >= 60 ? "B" : "C",
    label: score >= 90 ? "Excellent" : score >= 80 ? "Strong" : score >= 70 ? "Good" : score >= 60 ? "Fair" : "Weak",
    color: score >= 80 ? "green" : score >= 60 ? "yellow" : "red",
  };
}