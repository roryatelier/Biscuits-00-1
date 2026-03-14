import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import { listPackaging } from '@/lib/actions/packaging';
import PackagingCatalog from './PackagingCatalog';

export default async function PackagingPage() {
  const packaging = await listPackaging();

  return (
    <PlatformLayout>
      <PackagingCatalog packaging={packaging} />
    </PlatformLayout>
  );
}
