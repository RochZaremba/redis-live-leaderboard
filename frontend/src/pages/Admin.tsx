import { Database, RotateCcw } from "lucide-react";
import { useState } from "react";

import { resetDemo } from "../api/client";

export function Admin() {
  const [status, setStatus] = useState<string | null>(null);

  async function handleReset() {
    setStatus(null);
    const result = await resetDemo();
    setStatus(`Deleted ${result.deletedKeys} keys`);
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
            {status ? <span className="status neutral">{status}</span> : null}
          </div>
        </section>
      </main>
    </>
  );
}
