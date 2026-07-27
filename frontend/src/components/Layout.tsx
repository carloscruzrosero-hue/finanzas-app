import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const ITEMS = [
  { to: "/", label: "Panel principal", end: true },
  { to: "/transacciones", label: "Transacciones" },
  { to: "/ordenes-permanentes", label: "Órdenes permanentes" },
  { to: "/transacciones-programadas", label: "Programadas" },
  { to: "/reportes", label: "Reportes" },
  { to: "/cuentas", label: "Cuentas" },
  { to: "/categorias", label: "Categorías" },
];

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
          <h1>💰 Mis Finanzas</h1>
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
