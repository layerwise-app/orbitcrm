import { createFileRoute, redirect } from '@tanstack/react-router';
import { getAuthSession } from '~/lib/auth.functions';
import { CrmApp } from '~/components/crm/crm-app';
import { validateCrmSearch } from '~/lib/crm';
import { seo } from '~/utils/seo';

export const Route = createFileRoute('/dashboard')({
  validateSearch: validateCrmSearch,
  beforeLoad: async () => {
    const session = await getAuthSession();
    if (!session) throw redirect({ to: '/sign-in' });
    return { user: session.user };
  },
  head: () => ({ meta: seo({ title: 'Your Workspace · Orbit CRM', description: 'Your private, connected CRM workspace.' }) }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = Route.useRouteContext();
  const { view, record } = Route.useSearch();
  return <CrmApp key={user.id} user={user} basePath='/dashboard' view={view} recordId={record} />;
}
