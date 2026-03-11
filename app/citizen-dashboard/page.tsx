import NivaariExperience from '@/components/nivaari/NivaariExperience';

export default function CitizenDashboardPage() {
  return (
    <NivaariExperience
      initialStatsOpen
      initialFilter="confidence"
      routeLabel="Citizen Dashboard"
    />
  );
}
