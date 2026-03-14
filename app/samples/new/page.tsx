import { listFormulations } from '@/lib/actions/formulations';
import { listProjects } from '@/lib/actions/projects';
import PlatformLayout from '@/components/PlatformLayout/PlatformLayout';
import SampleOrderClient from './SampleOrderClient';

export default async function SampleOrderPage() {
  const [formulations, projects] = await Promise.all([
    listFormulations(),
    listProjects(),
  ]);

  const formulationList = (formulations ?? []).map((f: { id: string; name: string; version: string; category: string | null }) => ({
    id: f.id,
    name: f.name,
    version: f.version,
    category: f.category ?? '',
  }));

  const projectList = (projects ?? []).map((p: { id: string; name: string }) => ({
    id: p.id,
    name: p.name,
  }));

  return (
    <PlatformLayout>
      <SampleOrderClient formulations={formulationList} projects={projectList} />
    </PlatformLayout>
  );
}
