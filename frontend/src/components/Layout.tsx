import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const ITEMS = [
  { to: "/", label: "Panel principal", end: true },
  { to: "/transacciones", label: "Transacciones" },
  { to: "/deudas", label: "Deudas pendientes" },
  { to: "/ordenes-permanentes", label: "Órdenes permanentes" },
  { to: "/transacciones-programadas", label: "Programadas" },
  { to: "/reportes", label: "Reportes" },
  { to: "/cuentas", label: "Cuentas" },
  { to: "/categorias", label: "Categorías" },
];

// Isotipo BONDIA en versión negativa (blanco + turquesa sobre azul marino) — recreado en
// SVG a partir del manual de marca, ya que no se pudo extraer el artwork vectorial
// original del PDF. Los recortes centrales usan el mismo azul marino del sidebar para
// que se vean como espacio negativo, igual que en el manual.
function IsotipoBondia() {
  return (
    <svg viewBox="0 0 64 64" width="30" height="30" aria-hidden="true">
      <defs>
        <linearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#5EEAD4" />
        </linearGradient>
      </defs>
      <path d="M32 6 L54 18 V30 L32 42 L10 30 V18 Z" fill="#fff" />
      <path d="M32 22 L54 34 V46 L32 58 L10 46 V34 Z" fill="url(#brandGrad)" />
      <path d="M32 22 L10 34 V18 Z" fill="var(--color-navy)" />
      <path d="M32 42 L54 30 V46 Z" fill="var(--color-navy)" />
    </svg>
  );
}

export function Layout() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="app-shell">
      <button className="btn-menu-movil" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú">
        ☰
      </button>
      {menuAbierto && <div className="overlay-movil" onClick={() => setMenuAbierto(false)} />}
      <aside className={`sidebar ${menuAbierto ? "abierto" : ""}`}>
        <div className="sidebar-header">
          <div className="brand">
            <IsotipoBondia />
            <div>
              <h1>BONDIA</h1>
              <p className="brand-subtitle">Finanzas Personales</p>
            </div>
          </div>
          <button className="btn-cerrar-movil" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú">
            ✕
          </button>
        </div>
        <nav>
          {ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={() => setMenuAbierto(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
