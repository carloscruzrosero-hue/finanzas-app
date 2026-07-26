import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Cuentas from "./pages/Cuentas";
import Categorias from "./pages/Categorias";
import Transacciones from "./pages/Transacciones";
import OrdenesPermanentes from "./pages/OrdenesPermanentes";
import TransaccionesProgramadas from "./pages/TransaccionesProgramadas";
import CierresMensuales from "./pages/CierresMensuales";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/cuentas" element={<Cuentas />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/transacciones" element={<Transacciones />} />
          <Route path="/ordenes-permanentes" element={<OrdenesPermanentes />} />
          <Route path="/transacciones-programadas" element={<TransaccionesProgramadas />} />
          <Route path="/cierres-mensuales" element={<CierresMensuales />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
