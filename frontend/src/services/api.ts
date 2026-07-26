import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

export function mensajeError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error || err.message || "Ocurrió un error inesperado.";
  }
  return "Ocurrió un error inesperado.";
}
