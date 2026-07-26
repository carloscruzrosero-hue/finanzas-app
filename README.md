# Finanzas App

Aplicación web de control de finanzas personales (cuentas, categorías, transacciones,
órdenes permanentes/recurrentes, movimientos programados y cierres mensuales).

## Stack técnico

- **Frontend**: React 19 + Vite + TypeScript, React Router, Axios.
- **Backend**: Node.js + Express + TypeScript (API REST).
- **Base de datos**: PostgreSQL (alojada en Supabase), vía **Prisma ORM**.
- **Calidad de código**: ESLint + Prettier en ambos proyectos.
- **Despliegue**: Backend en Render, frontend en Vercel, base de datos en Supabase
  (ver sección [Despliegue en producción](#despliegue-en-producción) más abajo).

## Estructura de carpetas

```
finanzas-app/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Modelo de datos (Cuenta, CategoriaGasto, Transaccion, ...)
│   │   └── migrations/         # Historial de migraciones SQL
│   ├── src/
│   │   ├── routes/             # Endpoints de la API REST
│   │   ├── middleware/         # Middlewares de Express (manejo de errores, etc.)
│   │   ├── utils/              # Utilidades y constantes compartidas
│   │   ├── db.ts               # Cliente de Prisma
│   │   └── server.ts           # Punto de entrada de la API
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/               # Vistas de la aplicación (una por entidad + Dashboard)
    │   ├── components/          # Layout, componentes reutilizables
    │   ├── services/            # Cliente HTTP (Axios) hacia la API
    │   ├── types/                # Tipos TypeScript compartidos
    │   ├── utils/                 # Formato de moneda/fechas
    │   ├── App.tsx
    │   └── main.tsx
    ├── .env.example
    └── package.json
```

## Modelo de datos

- **Cuenta**: fuentes de dinero (efectivo, banco, tarjeta de crédito) con su saldo y moneda.
  El saldo se actualiza automáticamente cuando una transacción pasa a estado CONFIRMADA
  (y se revierte si se edita, se marca de vuelta a pendiente, o se elimina).
- **CategoriaGasto**: categorías de gasto/ingreso, con color/ícono opcional.
- **Transaccion**: movimientos ya registrados (gasto/ingreso), asociados a una cuenta y
  categoría, con el mes/año contable al que pertenecen (para el cierre mensual) y su
  estado (pendiente/confirmada). Incluye referencia opcional a la orden permanente o
  transacción programada que la originó, si aplica.
- **OrdenPermanente**: pagos o cobros fijos recurrentes (arriendo, suscripciones, nómina),
  con frecuencia mensual/quincenal/anual y un rango de vigencia opcional. El endpoint
  `POST /api/ordenes-permanentes/generar` las replica como transacciones pendientes del
  mes indicado (por defecto el actual), sin duplicar si ya se generaron ese periodo.
- **TransaccionProgramada**: movimientos puntuales a futuro que aún no han ocurrido. El
  endpoint `POST /api/transacciones-programadas/:id/ejecutar` la convierte en una
  transacción real y confirmada.
- **CierreMensual**: resumen de ingresos/gastos/saldo neto por mes (calculado a partir de
  las transacciones confirmadas de ese periodo), con estado abierto/cerrado. Se puede
  reabrir con `POST /api/cierres-mensuales/reabrir`.

> Los campos de tipo/estado se modelan como `String` (no `enum` nativo de Prisma) y se
> validan en la API con Zod contra las listas de valores permitidos, documentadas en
> `backend/src/utils/constants.ts` y como comentario junto a cada campo en `schema.prisma`.

## Requisitos previos

- Node.js 18 o superior.
- npm.
- Una base de datos PostgreSQL accesible (ver [Despliegue en producción](#despliegue-en-producción)
  para crear una gratis en Supabase — se necesita también para desarrollar localmente,
  ya que no hay una base local separada).

## Instalación y ejecución

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env       # coloca tu DATABASE_URL real de Supabase
npm run prisma:migrate     # aplica las migraciones sobre esa base
npm run dev                 # levanta la API en http://localhost:4000
```

Otros comandos útiles del backend:

```bash
npm run build            # compila TypeScript a dist/
npm start                # ejecuta la versión compilada (dist/server.js)
npm run lint              # ESLint
npm run format             # Prettier (escribe los cambios)
npm run prisma:studio     # explorador visual de la base de datos
```

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
cp .env.example .env      # ajusta VITE_API_URL si el backend corre en otro puerto
npm run dev                # levanta la app en http://localhost:5173
```

Otros comandos útiles del frontend:

```bash
npm run build             # build de producción en dist/
npm run preview           # sirve el build de producción localmente
npm run lint               # ESLint
npm run format              # Prettier (escribe los cambios)
```

## Variables de entorno

### `backend/.env`

| Variable       | Descripción                                          | Ejemplo                                        |
| -------------- | ----------------------------------------------------- | ----------------------------------------------- |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL (Supabase)             | `postgresql://usuario:clave@host:5432/postgres` |
| `PORT`         | Puerto donde escucha la API                            | `4000`                                          |
| `CORS_ORIGIN`  | Origen(es) permitidos para CORS (separados por coma)   | `http://localhost:5173`                         |

### `frontend/.env`

| Variable       | Descripción                    | Ejemplo                        |
| -------------- | -------------------------------- | --------------------------------- |
| `VITE_API_URL` | URL base de la API del backend   | `http://localhost:4000/api`      |

## Despliegue en producción

Ver la guía paso a paso más abajo (Supabase → Render → Vercel).

## Estado del proyecto

- [x] Configuración inicial (frontend, backend, PostgreSQL + Prisma, ESLint/Prettier).
- [x] Modelo de datos (`schema.prisma`) con las 6 entidades principales.
- [x] Endpoints de la API REST (CRUD completo + lógica de negocio: saldo automático,
      generación de órdenes permanentes, ejecución de transacciones programadas, cierre
      mensual).
- [x] Interfaz de usuario (panel principal + una vista por entidad).
- [ ] Desplegado en producción (Supabase + Render + Vercel).
