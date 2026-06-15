import { Database, RotateCcw } from "lucide-react";
import { useState } from "react";

import { resetDemo, seedDemo } from "../api/client";

export function Admin() {
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const [seedStatus, setSeedStatus] = useState<string | null>(null);

  async function handleReset() {
    setResetStatus(null);
    const result = await resetDemo();
    setResetStatus(`Deleted ${result.deletedKeys} keys`);
  }

  async function handleSeed() {
    setSeedStatus(null);
    await seedDemo();
    setSeedStatus("Seeded successfully");
  }

  return (
    <>
      <header className="topBar">
        <div className="brandLockup">
          <span className="brandMark" aria-hidden="true">
            <Database size={23} />
          </span>
          <div>
            <p className="eyebrow">Redis + FastAPI + WebSocket</p>
            <h1>Admin</h1>
          </div>
        </div>
        <div className="topActions">
          <a className="ghostButton" href="/">
            Back to Dashboard
          </a>
        </div>
      </header>
      <main className="appShell">
        <section className="card">
          <h2>Database</h2>
          <p>Wipe all Redis keys. This cannot be undone.</p>
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button className="dangerButton" onClick={handleReset} type="button">
              <RotateCcw size={16} aria-hidden="true" />
              Reset Database
            </button>
            {resetStatus ? <span className="status neutral">{resetStatus}</span> : null}
            <button className="ghostButton" onClick={handleSeed} type="button">
              <Database size={16} aria-hidden="true" />
              Seed
            </button>
            {seedStatus ? <span className="status neutral">{seedStatus}</span> : null}
          </div>
        </section>
      </main>
    </>
  );
}
