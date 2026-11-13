import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Icono } from "./Iconos";
import type { NombreIcono } from "./Iconos";

interface ItemNavegacion {
  to: string;
  label: string;
  // Etiqueta corta para la barra inferior del móvil, donde el espacio es reducido.
  corto: string;
  icono: NombreIcono;
  end?: boolean;
}

const ITEMS: ItemNavegacion[] = [
  { to: "/", label: "Panel principal", corto: "Inicio", icono: "inicio", end: true },
  { to: "/transacciones", label: "Transacciones", corto: "Movimientos", icono: "movimientos" },
  { to: "/deudas", label: "Deudas pendientes", corto: "Deudas", icono: "deudas" },
  { to: "/ordenes-permanentes", label: "Órdenes permanentes", corto: "Órdenes", icono: "ordenes" },
  { to: "/transacciones-programadas", label: "Programadas", corto: "Programadas", icono: "programadas" },
  { to: "/reportes", label: "Reportes", corto: "Reportes", icono: "reportes" },
  { to: "/cuentas", label: "Cuentas", corto: "Cuentas", icono: "cuentas" },
  { to: "/categorias", label: "Categorías", corto: "Categorías", icono: "categorias" },
];

// En el móvil, la barra inferior muestra los destinos más usados; el resto vive en "Más".
const RUTAS_BARRA_INFERIOR = ["/", "/transacciones", "/deudas", "/reportes"];
const ITEMS_BARRA_INFERIOR = ITEMS.filter((i) => RUTAS_BARRA_INFERIOR.includes(i.to));
const ITEMS_MAS = ITEMS.filter((i) => !RUTAS_BARRA_INFERIOR.includes(i.to));

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
  const { pathname } = useLocation();
  // La hoja "Más" queda abierta solo en la ruta donde se abrió: cualquier navegación
  // (un destino de la hoja o el botón atrás del teléfono) la cierra sola.
  const [masAbiertoEn, setMasAbiertoEn] = useState<string | null>(null);
  const masAbierto = masAbiertoEn === pathname;
  const setMasAbierto = (abrir: boolean) => setMasAbiertoEn(abrir ? pathname : null);
  const enSeccionDeMas = ITEMS_MAS.some((i) => pathname.startsWith(i.to));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <IsotipoBondia />
            <div>
              <h1>BONDIA</h1>
              <p className="brand-subtitle">Finanzas Personales</p>
            </div>
          </div>
        </div>
        <nav>
          {ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? "active" : "")}>
              <Icono nombre={item.icono} tamano={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <header className="topbar-movil">
        <IsotipoBondia />
        <span className="topbar-nombre">BONDIA</span>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {ITEMS_BARRA_INFERIOR.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}>
            <Icono nombre={item.icono} tamano={22} />
            <span>{item.corto}</span>
          </NavLink>
        ))}
        <button
          type="button"
          className={`bottom-nav-item ${enSeccionDeMas || masAbierto ? "active" : ""}`}
          onClick={() => setMasAbierto(!masAbierto)}
          aria-expanded={masAbierto}
          aria-controls="hoja-mas"
        >
          <Icono nombre="mas" tamano={22} />
          <span>Más</span>
        </button>
      </nav>

      {masAbierto && (
        <>
          <div className="overlay-movil" onClick={() => setMasAbierto(false)} />
          <div id="hoja-mas" className="hoja-mas" role="dialog" aria-label="Más secciones">
            <div className="hoja-mas-header">
              <span>Más secciones</span>
              <button type="button" className="hoja-mas-cerrar" onClick={() => setMasAbierto(false)} aria-label="Cerrar">
                <Icono nombre="cerrar" tamano={20} />
              </button>
            </div>
            <div className="hoja-mas-grid">
              {ITEMS_MAS.map((item) => (
                <NavLink key={item.to} to={item.to} className={({ isActive }) => `hoja-mas-item ${isActive ? "active" : ""}`}>
                  <span className="hoja-mas-icono">
                    <Icono nombre={item.icono} tamano={22} />
                  </span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
