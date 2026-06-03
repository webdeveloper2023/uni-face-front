import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

export type HealthResponse = {
  status: string;
  reference_set: boolean;
  threshold: number;
};

export type VerifyResponse = {
  match: boolean;
  similarity: number;
  confidence: number;
  threshold: number;
  live?: boolean;
  live_confidence?: number;
};

export type SetReferenceResponse = {
  ok: boolean;
  message: string;
};

export async function getHealth(): Promise<HealthResponse> {
  const { data } = await api.get<HealthResponse>("/");
  return data;
}

export async function uploadReference(file: Blob): Promise<SetReferenceResponse> {
  const formData = new FormData();
  formData.append("file", file, "reference.jpg");
  const { data } = await api.post<SetReferenceResponse>("/reference", formData);
  return data;
}

export async function verifyImage(
  file: Blob,
  threshold?: number,
): Promise<VerifyResponse> {
  const formData = new FormData();
  formData.append("file", file, "probe.jpg");
  const params = threshold !== undefined ? { threshold } : undefined;
  const { data } = await api.post<VerifyResponse>("/verify", formData, { params });
  return data;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, base64] = dataUrl.split(",");
  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
