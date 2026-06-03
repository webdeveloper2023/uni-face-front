import { useCallback, useEffect, useState } from "react";
import ReferencePanel from "./components/ReferencePanel";
import VerifyModal from "./components/VerifyModal";
import { API_BASE_URL, getHealth, type HealthResponse } from "./api";

type BackendStatus = "checking" | "online" | "offline";

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [status, setStatus] = useState<BackendStatus>("checking");
  const [modalOpen, setModalOpen] = useState(false);

  const refreshHealth = useCallback(async () => {
    try {
      const data = await getHealth();
      setHealth(data);
      setStatus("online");
    } catch {
      setHealth(null);
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    void refreshHealth();
  }, [refreshHealth]);

  const referenceSet = health?.reference_set ?? false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1 text-xs font-medium text-sky-300">
            UniFace · Face Verification
          </div>
          <h1 className="mt-4 bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 bg-clip-text pb-1 text-4xl font-bold tracking-tight text-transparent">
            Yuzni tekshirish
          </h1>

          {/* Backend status bar */}
          <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-2 text-sm">
            <span className="flex items-center gap-2">
              <span
                className={
                  "inline-block h-2.5 w-2.5 rounded-full " +
                  (status === "online"
                    ? "bg-emerald-400 animate-pulse"
                    : status === "offline"
                      ? "bg-rose-500"
                      : "bg-amber-400 animate-pulse")
                }
              />
              <span className="text-slate-300">
                {status === "online"
                  ? "Backend ulangan"
                  : status === "offline"
                    ? "Backend ulanmadi"
                    : "Tekshirilmoqda..."}
              </span>
            </span>
            <span className="hidden text-slate-600 sm:inline">|</span>
            <span className="font-mono text-xs text-slate-500">{API_BASE_URL}</span>
            {health && (
              <>
                <span className="hidden text-slate-600 sm:inline">|</span>
                <span className="text-slate-400">
                  chegara:{" "}
                  <span className="font-mono text-slate-200">
                    {health.threshold.toFixed(2)}
                  </span>
                </span>
              </>
            )}
          </div>

          {status === "offline" && (
            <div className="mx-auto mt-4 max-w-xl rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              Backendga ulanib bo'lmadi.{" "}
              <code className="font-mono">uni-face</code> serveri{" "}
              <span className="font-mono">{API_BASE_URL}</span> da ishlab
              turganiga ishonch hosil qiling.
            </div>
          )}
        </header>

        {/* Yagona panel — shablon rasm yuklash */}
        <main className="mx-auto max-w-md">
          <ReferencePanel
            referenceSet={referenceSet}
            onUploaded={refreshHealth}
            onVerifyClick={() => setModalOpen(true)}
          />
        </main>

        <footer className="mt-10 text-center text-xs text-slate-600">
          UniFace API · SCRFD + ArcFace · uniface kutubxonasi asosida
        </footer>
      </div>

      {/* Jonlilik tekshiruvi modal'i */}
      {modalOpen && referenceSet && (
        <VerifyModal onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}

export default App;
