import { NextFunction, Request, Response } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  const status = err.status || 500;
  const esProduccion = process.env.NODE_ENV === "production";
  const mensaje = status < 500 || !esProduccion ? err.message || "Error interno del servidor." : "Error interno del servidor.";
  res.status(status).json({ error: mensaje });
}
