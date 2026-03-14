import { notFound } from 'next/navigation';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import { getPackaging } from '@/lib/actions/packaging';
import PackagingDetail from './PackagingDetail';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PackagingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const packaging = await getPackaging(id);

  if (!packaging) {
    notFound();
  }

  return (
    <PlatformLayout>
      <PackagingDetail packaging={packaging} />
    </PlatformLayout>
  );
}
