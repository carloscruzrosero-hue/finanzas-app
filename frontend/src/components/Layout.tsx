import { NavLink, Outlet } from "react-router-dom";

const ITEMS = [
  { to: "/", label: "Panel principal", end: true },
  { to: "/transacciones", label: "Transacciones" },
  { to: "/ordenes-permanentes", label: "Órdenes permanentes" },
  { to: "/transacciones-programadas", label: "Programadas" },
  { to: "/cierres-mensuales", label: "Cierres mensuales" },
  { to: "/cuentas", label: "Cuentas" },
  { to: "/categorias", label: "Categorías" },
];

export function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>💰 Mis Finanzas</h1>
        <nav>
          {ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? "active" : "")}>
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
