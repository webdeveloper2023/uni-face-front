import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { dataUrlToBlob, verifyImage, type VerifyResponse } from "../api";

type Props = {
  referenceSet: boolean;
};

const videoConstraints = {
  width: 480,
  height: 480,
  facingMode: "user",
};

export default function VerifyPanel({ referenceSet }: Props) {
  const webcamRef = useRef<Webcam | null>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  const capture = useCallback(() => {
    setError(null);
    setResult(null);
    const image = webcamRef.current?.getScreenshot();
    if (image) setSnapshot(image);
  }, []);

  const retake = () => {
    setSnapshot(null);
    setResult(null);
    setError(null);
  };

  const verify = async () => {
    if (!snapshot) return;
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const blob = dataUrlToBlob(snapshot);
      const res = await verifyImage(blob);
      setResult(res);
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        setError(e.response?.data?.detail ?? e.message);
      } else if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Noma'lum xatolik");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">2. Kamera orqali tekshirish</h2>
      </div>

      {!referenceSet && (
        <div className="mb-4 text-amber-300 text-sm bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          Avval reference rasm yuklang — keyin kameradan olingan rasm shu rasm
          bilan solishtiriladi.
        </div>
      )}

      <div className="aspect-square w-full max-w-md mx-auto rounded-xl overflow-hidden bg-black border border-slate-700">
        {snapshot ? (
          <img src={snapshot} alt="snapshot" className="w-full h-full object-cover" />
        ) : (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            mirrored
            videoConstraints={videoConstraints}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="flex gap-3 mt-4">
        {!snapshot ? (
          <button
            onClick={capture}
            className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-medium py-2.5 rounded-lg transition"
          >
            Rasmga olish
          </button>
        ) : (
          <>
            <button
              onClick={retake}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 rounded-lg transition"
            >
              Qayta olish
            </button>
            <button
              onClick={verify}
              disabled={loading || !referenceSet}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white font-medium py-2.5 rounded-lg transition"
            >
              {loading ? "Tekshirilmoqda..." : "Tekshirish"}
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 text-rose-400 text-sm bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {result && <ResultCard result={result} />}
    </div>
  );
}

function ResultCard({ result }: { result: VerifyResponse }) {
  const percent = (result.confidence * 100).toFixed(1);
  return (
    <div
      className={
        "mt-4 rounded-xl p-4 border " +
        (result.match
          ? "bg-emerald-500/10 border-emerald-500/40"
          : "bg-rose-500/10 border-rose-500/40")
      }
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={
            "font-semibold text-lg " +
            (result.match ? "text-emerald-300" : "text-rose-300")
          }
        >
          {result.match ? "✅ Bir xil odam" : "❌ Boshqa odam"}
        </span>
        <span className="text-sm text-slate-400">
          chegara: {result.threshold.toFixed(2)}
        </span>
      </div>
      <div className="text-sm text-slate-300 space-y-1">
        <div>
          Similarity:{" "}
          <span className="font-mono text-white">{result.similarity.toFixed(4)}</span>
        </div>
        <div>
          Ishonch: <span className="font-mono text-white">{percent}%</span>
        </div>
      </div>
      <div className="w-full bg-slate-900/60 rounded-full h-2 mt-3 overflow-hidden">
        <div
          className={
            "h-full " + (result.match ? "bg-emerald-500" : "bg-rose-500")
          }
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
