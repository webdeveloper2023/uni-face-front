import { useRef, useState } from "react";
import axios from "axios";
import { ScanFace } from "lucide-react";
import { uploadReference } from "../api";

type Props = {
  referenceSet: boolean;
  onUploaded: () => void;
  onVerifyClick: () => void;
};

export default function ReferencePanel({
  referenceSet,
  onUploaded,
  onVerifyClick,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setOkMessage(null);
    setPreviewUrl(URL.createObjectURL(file));
    setLoading(true);
    try {
      const res = await uploadReference(file);
      setOkMessage(res.message);
      onUploaded();
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
  }

  return (
    <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">1. Reference (shablon) rasm</h2>
        <span
          className={
            "text-xs px-2 py-1 rounded-full " +
            (referenceSet
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              : "bg-amber-500/20 text-amber-300 border border-amber-500/40")
          }
        >
          {referenceSet ? "O'rnatilgan" : "O'rnatilmagan"}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div
          className="aspect-square w-full max-w-xs mx-auto rounded-xl border-2 border-dashed border-slate-600 bg-slate-900/50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-sky-500 transition"
          onClick={() => inputRef.current?.click()}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="reference" className="w-full h-full object-cover" />
          ) : (
            <div className="text-slate-500 text-sm text-center px-4">
              Rasm tanlash uchun bu yerga bosing
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        <button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="bg-sky-600 hover:bg-sky-500 disabled:bg-slate-600 text-white font-medium py-2.5 rounded-lg transition"
        >
          {loading
            ? "Yuklanmoqda..."
            : referenceSet
              ? "Boshqa rasm tanlash"
              : "Rasm tanlash"}
        </button>

        {okMessage && (
          <div className="text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
            {okMessage}
          </div>
        )}
        {error && (
          <div className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Shablon rasm o'rnatilgach — jonlilik tekshiruvini ochuvchi tugma */}
        {referenceSet && (
          <>
            <div className="my-1 border-t border-slate-700/70" />
            <button
              onClick={onVerifyClick}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg transition"
            >
              <ScanFace className="h-5 w-5" />
              Tekshirish
            </button>
          </>
        )}
      </div>
    </div>
  );
}
