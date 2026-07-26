export function Alerta({ tipo, mensaje, onClose }: { tipo: "error" | "success"; mensaje: string; onClose?: () => void }) {
  return (
    <div className={`alert alert-${tipo}`} onClick={onClose} style={onClose ? { cursor: "pointer" } : undefined}>
      {mensaje}
    </div>
  );
}
