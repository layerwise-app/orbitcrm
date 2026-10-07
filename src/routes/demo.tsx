import { createFileRoute } from '@tanstack/react-router';
import { CrmApp } from '~/components/crm/crm-app';
import { validateCrmSearch } from '~/lib/crm';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/demo')({
  validateSearch: validateCrmSearch,
  head: () => ({ meta: seo({ title: 'Try the Demo · Orbit CRM', description: 'Explore Orbit with sample contacts, deals, and tasks. No account needed.' }) }),
  component: DemoPage,
});

function DemoPage() {
  const { view, record } = Route.useSearch();
  // The public demo always uses sample data, even if a user is signed in.
  return <CrmApp user={null} basePath='/demo' view={view} recordId={record} />;
}
