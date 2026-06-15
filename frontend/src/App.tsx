import { Admin } from "./pages/Admin";
import { Dashboard } from "./pages/Dashboard";
import { LeaderboardDisplay } from "./pages/LeaderboardDisplay";

export default function App() {
  if (window.location.pathname === "/leaderboard") {
    return <LeaderboardDisplay />;
  }
  if (window.location.pathname === "/admin") {
    return <Admin />;
  }
  return <Dashboard />;
}

