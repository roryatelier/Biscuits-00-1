// Pure logic for supplier permission levels.
// Extracted from lib/actions/certifications.ts for testability.

export type PermissionLevel = 'none' | 'can_brief' | 'can_sample' | 'can_po';

export type AgreementInput = {
  agreementType: string;
  status: string;
};

export type CertificationInput = {
  certType: string;
  verificationStatus: string;
};

export function computePermissionLevel(
  agreements: AgreementInput[],
  certifications: CertificationInput[],
): PermissionLevel {
  const agreementSigned = (type: string) =>
    agreements.some(a => a.agreementType === type && a.status === 'signed');

  const certVerified = (type: string) =>
    certifications.some(c => c.certType === type && c.verificationStatus === 'verified');

  const ndaSigned = agreementSigned('NDA');
  const msaSigned = agreementSigned('MSA');
  const ipSigned = agreementSigned('IP');
  const paymentSigned = agreementSigned('Payment');
  const gmpVerified = certVerified('GMP');
  const isoVerified = certVerified('ISO');

  if (ndaSigned && msaSigned && ipSigned && paymentSigned && gmpVerified && isoVerified) {
    return 'can_po';
  }
  if (ndaSigned && gmpVerified) {
    return 'can_sample';
  }
  if (ndaSigned) {
    return 'can_brief';
  }
  return 'none';
}
