import { Dashboard } from "@/components/Dashboard";

export const metadata = {
  title: "Forem Community Observability Dashboard",
  description:
    "A dashboard to monitor and prioritize community moderation tasks based on behavioral scoring.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Dashboard />
    </main>
  );
}
