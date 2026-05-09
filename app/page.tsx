import HomePageContent from "@/components/HomePageContent";
import ModeratorDashboardContent from "@/components/moderator/ModeratorDashboardContent";
import ModeratorLayout from "@/components/moderator/ModeratorLayout";
import { getSessionFromCookie, viewerCanModerate } from "@/lib/auth";

export default async function HomePage() {
  const viewer = await getSessionFromCookie();
  if (viewerCanModerate(viewer)) {
    return (
      <ModeratorLayout>
        <ModeratorDashboardContent />
      </ModeratorLayout>
    );
  }
  return <HomePageContent />;
}
