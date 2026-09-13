import { useEffect, useRef, useState } from "react";
import type { CategoriaGasto, TipoCategoria } from "../types";

interface Opcion {
  id: number;
  etiqueta: string;
}

// Combobox con buscador: al escribir filtra las categorías por nombre, en vez del <select>
// plano de antes donde había que desplazarse por todas las categorías/subcategorías a mano.
//
// - Con `tipo` (Transacciones): agrupa por categoría raíz y muestra sus subcategorías como
//   "Raíz › Subcategoría", igual que el <select> con <optgroup> que reemplaza.
// - Sin `tipo` (Órdenes permanentes, Transacciones programadas): lista plana con "(GASTO/INGRESO)".
export function SelectorCategoria({
  categorias,
  tipo,
  valor,
  onSeleccionar,
}: {
  categorias: CategoriaGasto[];
  tipo?: TipoCategoria;
  valor: string;
  onSeleccionar: (categoria: CategoriaGasto) => void;
}) {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const filtradas = tipo ? categorias.filter((c) => c.tipo === tipo) : categorias;

  let opciones: Opcion[];
  if (tipo) {
    const raices = filtradas.filter((c) => !c.categoriaPadreId);
    opciones = raices.flatMap((raiz) => {
      const subs = filtradas.filter((c) => c.categoriaPadreId === raiz.id);
      return [
        { id: raiz.id, etiqueta: `${raiz.nombre} (general)` },
        ...subs.map((s) => ({ id: s.id, etiqueta: `${raiz.nombre} › ${s.nombre}` })),
      ];
    });
  } else {
    opciones = filtradas.map((c) => ({ id: c.id, etiqueta: `${c.nombre} (${c.tipo})` }));
  }

  const opcionSeleccionada = opciones.find((o) => o.id === Number(valor));

  // Sincroniza el texto visible con la opción seleccionada cuando el combobox está cerrado
  // (selección externa, o se cerró sin elegir nada — lo que debe descartar la búsqueda sin
  // terminar). Se ajusta durante el render en vez de en un useEffect, siguiendo el patrón
  // recomendado por React para evitar el doble render de un setState dentro de un efecto.
  const [ultimoSincronizado, setUltimoSincronizado] = useState({ valor, abierto });
  if (!abierto && (ultimoSincronizado.valor !== valor || ultimoSincronizado.abierto !== abierto)) {
    setUltimoSincronizado({ valor, abierto });
    setTexto(opcionSeleccionada?.etiqueta ?? "");
  }

  useEffect(() => {
    function onClickFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener("mousedown", onClickFuera);
    return () => document.removeEventListener("mousedown", onClickFuera);
  }, []);

  const opcionesFiltradas = opciones.filter((o) => o.etiqueta.toLowerCase().includes(texto.toLowerCase()));

  return (
    <div ref={contenedorRef} className="selector-buscar">
      <input
        placeholder="Escribe para buscar..."
        value={texto}
        onFocus={() => setAbierto(true)}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
      />
      {abierto && (
        <div className="selector-buscar-lista">
          {opcionesFiltradas.length === 0 && <div className="selector-buscar-vacio">Sin resultados</div>}
          {opcionesFiltradas.map((o) => (
            <div
              key={o.id}
              className="selector-buscar-opcion"
              onMouseDown={(e) => {
                e.preventDefault();
                const cat = filtradas.find((c) => c.id === o.id);
                if (cat) onSeleccionar(cat);
                setTexto(o.etiqueta);
                setAbierto(false);
              }}
            >
              {o.etiqueta}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
