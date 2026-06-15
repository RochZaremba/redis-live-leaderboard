import { Dashboard } from "./pages/Dashboard";
import { LeaderboardDisplay } from "./pages/LeaderboardDisplay";

export default function App() {
  if (window.location.pathname === "/leaderboard") {
    return <LeaderboardDisplay />;
  }
  return <Dashboard />;
}

