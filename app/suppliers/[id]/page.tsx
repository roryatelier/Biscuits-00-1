import { notFound } from 'next/navigation';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import { getAosSupplier } from '@/lib/actions/suppliers';
import { getPermissionLevel } from '@/lib/actions/certifications';
import { listSupplierActivities } from '@/lib/actions/supplier-activities';
import SupplierProfileClient from './SupplierProfileClient';

export default async function SupplierProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplierResult = await getAosSupplier(id);

  if (!supplierResult || 'error' in supplierResult) notFound();

  const supplier = supplierResult;

  const [permissionLevel, activitiesResult] = await Promise.all([
    getPermissionLevel(supplier.id),
    listSupplierActivities(supplier.id),
  ]);

  const activities = Array.isArray(activitiesResult) ? activitiesResult : [];

  const serialized = {
    id: supplier.id,
    companyName: supplier.companyName,
    qualificationStage: supplier.qualificationStage,
    categories: (supplier.categories as string[]) || [],
    subcategories: (supplier.subcategories as string[]) || [],
    moq: supplier.moq,
    keyBrands: (supplier.keyBrands as string[]) || [],
    cautionFlag: supplier.cautionFlag,
    cautionNote: supplier.cautionNote,
    cobaltEnabled: supplier.cobaltEnabled,
    capabilityType: supplier.capabilityType,
    permissionLevel,
    certifications: supplier.certifications.map(c => ({
      id: c.id,
      certType: c.certType,
      certBody: c.certBody,
      scope: c.scope,
      issueDate: c.issueDate ? c.issueDate.toISOString().split('T')[0] : null,
      expiryDate: c.expiryDate ? c.expiryDate.toISOString().split('T')[0] : null,
      documentRef: c.documentRef,
      verificationStatus: c.verificationStatus,
    })),
    agreements: supplier.agreements.map(a => ({
      id: a.id,
      agreementType: a.agreementType,
      status: a.status,
      sentAt: a.sentAt ? a.sentAt.toISOString().split('T')[0] : null,
      signedAt: a.signedAt ? a.signedAt.toISOString().split('T')[0] : null,
    })),
    briefAssignments: supplier.briefAssignments.map(ba => ({
      id: ba.id,
      matchScore: ba.matchScore,
      brief: {
        id: ba.supplierBrief.id,
        name: ba.supplierBrief.name,
        customerName: ba.supplierBrief.customerName,
        category: ba.supplierBrief.category,
      },
    })),
    cobaltSupplier: supplier.cobaltSupplier ? {
      id: supplier.cobaltSupplier.id,
      companyName: supplier.cobaltSupplier.companyName,
      matchedProductsCount: supplier.cobaltSupplier.matchedProductsCount,
    } : null,
  };

  const serializedActivities = activities.map(a => ({
    id: a.id,
    type: a.type,
    description: a.description,
    metadata: a.metadata as Record<string, string> | null,
    userName: a.user.name || 'Unknown',
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <PlatformLayout>
      <SupplierProfileClient supplier={serialized} activities={serializedActivities} />
    </PlatformLayout>
  );
}
