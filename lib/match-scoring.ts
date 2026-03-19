// Pure match scoring computation, extracted from lib/actions/matching.ts
// so it can be unit-tested without database dependencies.
//
//  score = (matched_requirements / total_requirements) x 100
//
//  Rules:
//  - Matched = supplier has verified cert of that type AND not expired
//  - Expired cert = counts as MISSING
//  - Brief with 0 requirements = score is null (N/A)
//  - Extra certs not in brief = ignored
//  - Exact match on cert type required

export function computeMatchScorePure(
  supplierCerts: { certType: string; verificationStatus: string; expiryDate: Date | null }[],
  requiredCerts: string[],
): { score: number | null; breakdown: Record<string, boolean> } {
  if (requiredCerts.length === 0) return { score: null, breakdown: {} };

  const now = new Date();
  const breakdown: Record<string, boolean> = {};
  let matched = 0;

  for (const required of requiredCerts) {
    const cert = supplierCerts.find(c => c.certType === required);
    const isMatched =
      cert !== undefined &&
      cert.verificationStatus === 'verified' &&
      (cert.expiryDate === null || cert.expiryDate > now);

    breakdown[required] = isMatched;
    if (isMatched) matched++;
  }

  const score = Math.round((matched / requiredCerts.length) * 100);
  return { score, breakdown };
}
