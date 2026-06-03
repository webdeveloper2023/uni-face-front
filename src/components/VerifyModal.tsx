import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Eye,
  Loader2,
  ShieldAlert,
  Smile,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { dataUrlToBlob, verifyImage, type VerifyResponse } from "../api";

type Props = {
  onClose: () => void;
};

const videoConstraints = {
  width: 480,
  height: 480,
  facingMode: "user",
};

// Jonlilik (liveness) uchun buyruqlar. Har safar tasodifiy tartibda 3 tasi
// tanlanadi — bu oldindan yozib olingan videoni qaytarishni qiyinlashtiradi.
const LIVENESS_STEPS: { icon: LucideIcon; text: string }[] = [
  { icon: Eye, text: "Ko'zingizni 2 marta pirpirating" },
  { icon: Smile, text: "Tabassum qiling" },
  { icon: ArrowLeft, text: "Boshingizni sekin chapga buring" },
  { icon: ArrowRight, text: "Boshingizni sekin o'ngga buring" },
  { icon: ArrowUp, text: "Boshingizni biroz tepaga ko'taring" },
];

const STEP_MS = 2800;

type Phase =
  | "loading"
  | "running"
  | "capturing"
  | "verifying"
  | "result"
  | "error";

function speak(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "uz-UZ";
    u.rate = 1;
    synth.speak(u);
  } catch {
    /* speechSynthesis mavjud bo'lmasligi mumkin */
  }
}

export default function VerifyModal({ onClose }: Props) {
  const webcamRef = useRef<Webcam | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [cameraReady, setCameraReady] = useState(false);
  const [steps, setSteps] = useState<typeof LIVENESS_STEPS>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ESC bilan yopish + ochilganda body scroll'ni bloklash
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, [onClose]);

  const start = useCallback(() => {
    const shuffled = [...LIVENESS_STEPS]
      .map((s) => ({ s, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .slice(0, 3)
      .map((x) => x.s);
    setSteps(shuffled);
    setStepIndex(0);
    setSnapshot(null);
    setResult(null);
    setError(null);
    setPhase("running");
  }, []);

  // Qayta tekshirish — kamerani qayta tayyorlab, avtomatik boshlanadi.
  const restart = useCallback(() => {
    setSnapshot(null);
    setResult(null);
    setError(null);
    setStepIndex(0);
    setCameraReady(false);
    setPhase("loading");
  }, []);

  // Kamera tayyor bo'lishi bilan jonlilik tekshiruvi avtomatik boshlanadi.
  useEffect(() => {
    if (phase === "loading" && cameraReady) start();
  }, [phase, cameraReady, start]);

  const doCapture = useCallback(async () => {
    const image = webcamRef.current?.getScreenshot();
    if (!image) {
      setError("Kameradan rasm olib bo'lmadi. Qayta urinib ko'ring.");
      setPhase("error");
      return;
    }
    setSnapshot(image);
    setPhase("verifying");
    try {
      const blob = dataUrlToBlob(image);
      const res = await verifyImage(blob);
      setResult(res);
      setPhase("result");
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        setError(e.response?.data?.detail ?? e.message);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Noma'lum xatolik");
      }
      setPhase("error");
    }
  }, []);

  // Buyruqlar ketma-ketligi
  useEffect(() => {
    if (phase !== "running") return;
    if (stepIndex >= steps.length) {
      setPhase("capturing");
      return;
    }
    speak(steps[stepIndex].text);
    const id = window.setTimeout(() => setStepIndex((i) => i + 1), STEP_MS);
    return () => window.clearTimeout(id);
  }, [phase, stepIndex, steps]);

  // Rasmga olishdan oldingi sanoq
  useEffect(() => {
    if (phase !== "capturing") return;
    speak("Qimirlamang, rasmga olinmoqda");
    let n = 3;
    setCountdown(n);
    const id = window.setInterval(() => {
      n -= 1;
      if (n <= 0) {
        window.clearInterval(id);
        void doCapture();
      } else {
        setCountdown(n);
      }
    }, 800);
    return () => window.clearInterval(id);
  }, [phase, doCapture]);

  const showSnapshot =
    !!snapshot &&
    (phase === "verifying" || phase === "result" || phase === "error");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
          <h2 className="text-base font-semibold text-white">
            Jonlilik tekshiruvi
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            aria-label="Yopish"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Kamera / snapshot */}
          <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-xl border border-slate-700 bg-black">
            {showSnapshot ? (
              <img
                src={snapshot ?? undefined}
                alt="snapshot"
                className="h-full w-full object-cover"
              />
            ) : (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                mirrored
                videoConstraints={videoConstraints}
                onUserMedia={() => setCameraReady(true)}
                onUserMediaError={() => {
                  setError(
                    "Kameraga ruxsat berilmadi yoki kamera topilmadi. Brauzer ruxsatini tekshiring.",
                  );
                  setPhase("error");
                }}
                className="h-full w-full object-cover"
              />
            )}

            {/* Yuz uchun yo'naltiruvchi oval */}
            {(phase === "loading" || phase === "running") && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-3/4 w-3/5 rounded-[50%] border-2 border-dashed border-white/40" />
              </div>
            )}

            {/* Loading overlay — kamera tayyor bo'lishi bilan avtomatik boshlanadi */}
            {phase === "loading" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 text-sm text-slate-200">
                <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
                <span>Kamera tayyorlanmoqda...</span>
              </div>
            )}

            {/* Running — buyruq overlay */}
            {phase === "running" && steps[stepIndex] && (
              <>
                <div className="absolute inset-x-0 top-0 flex flex-col items-center gap-1 bg-linear-to-b from-black/70 to-transparent px-4 pb-8 pt-4 text-center">
                  {(() => {
                    const Icon = steps[stepIndex].icon;
                    return <Icon className="h-11 w-11 text-white drop-shadow" />;
                  })()}
                  <div className="text-base font-semibold text-white drop-shadow">
                    {steps[stepIndex].text}
                  </div>
                  <div className="text-xs text-slate-300">
                    {stepIndex + 1} / {steps.length}
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/40">
                  <div
                    key={stepIndex}
                    className="h-full bg-sky-500"
                    style={{ animation: `lv-grow ${STEP_MS}ms linear forwards` }}
                  />
                </div>
              </>
            )}

            {/* Capturing — sanoq */}
            {phase === "capturing" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="text-7xl font-bold text-white drop-shadow-lg">
                  {countdown}
                </span>
              </div>
            )}

            {/* Verifying */}
            {phase === "verifying" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
                <Loader2 className="h-10 w-10 animate-spin text-sky-400" />
                <span className="text-sm text-slate-200">Tekshirilmoqda...</span>
              </div>
            )}
          </div>

          {/* Holat matni / natija / xato */}
          <div className="mt-4">
            {phase === "running" && (
              <p className="text-center text-sm text-slate-400">
                Buyruqlarni bajaring — so'ng avtomatik rasmga olinadi.
              </p>
            )}

            {phase === "error" && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {error}
              </div>
            )}

            {phase === "result" && result && <ResultCard result={result} />}

            {/* Tugmalar */}
            {(phase === "result" || phase === "error") && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={restart}
                  className="flex-1 rounded-lg bg-sky-600 py-2.5 font-medium text-white transition hover:bg-sky-500"
                >
                  Qayta tekshirish
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 rounded-lg bg-slate-700 py-2.5 font-medium text-white transition hover:bg-slate-600"
                >
                  Yopish
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ result }: { result: VerifyResponse }) {
  const percent = (result.confidence * 100).toFixed(1);
  const isSpoof = result.live === false;

  // Soxta yuz aniqlangan holat — alohida ogohlantirish
  if (isSpoof) {
    return (
      <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4">
        <div className="mb-2 flex items-center gap-1.5 text-lg font-semibold text-amber-300">
          <ShieldAlert className="h-5 w-5" /> Soxta yuz aniqlandi
        </div>
        <p className="text-sm text-amber-200/80">
          Ekran yoki fotosuratdan foydalanilgan bo'lishi mumkin. Iltimos, jonli
          yuzingiz bilan qayta urinib ko'ring.
        </p>
        {result.live_confidence !== undefined && (
          <div className="mt-2 text-xs text-slate-400">
            Jonlilik ishonchi:{" "}
            <span className="font-mono text-slate-200">
              {(result.live_confidence * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={
        "rounded-xl border p-4 " +
        (result.match
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-rose-500/40 bg-rose-500/10")
      }
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className={
            "flex items-center gap-1.5 text-lg font-semibold " +
            (result.match ? "text-emerald-300" : "text-rose-300")
          }
        >
          {result.match ? (
            <>
              <CheckCircle2 className="h-5 w-5" /> Bir xil odam
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5" /> Boshqa odam
            </>
          )}
        </span>
        <span className="text-sm text-slate-400">
          chegara: {result.threshold.toFixed(2)}
        </span>
      </div>
      <div className="space-y-1 text-sm text-slate-300">
        <div>
          Similarity:{" "}
          <span className="font-mono text-white">
            {result.similarity.toFixed(4)}
          </span>
        </div>
        <div>
          Ishonch: <span className="font-mono text-white">{percent}%</span>
        </div>
        {result.live && (
          <div className="flex items-center gap-1 text-emerald-300/90">
            <CheckCircle2 className="h-3.5 w-3.5" /> Jonli yuz tasdiqlandi
          </div>
        )}
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-900/60">
        <div
          className={"h-full " + (result.match ? "bg-emerald-500" : "bg-rose-500")}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
