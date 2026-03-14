import { listSampleOrders } from '@/lib/actions/samples';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import SamplesClient from './SamplesClient';

export default async function SamplesPage() {
  const orders = await listSampleOrders();

  return (
    <PlatformLayout>
      <SamplesClient orders={orders} />
    </PlatformLayout>
  );
}
