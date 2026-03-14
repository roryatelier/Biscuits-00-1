import { redirect } from 'next/navigation';

// "Approved Innovations" / "In Development" is now a filtered view of projects
export default function InDevelopmentPage() {
  redirect('/projects?status=In+Development');
}
