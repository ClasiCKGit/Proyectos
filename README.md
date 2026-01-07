# Proyectos

## 🟢 Nivel Inicial (bases sólidas)
### 1️⃣ To-Do List tipada

**Objetivo**: dominar TS + estado en React

**Conceptos**:

- `useState`
- Tipos e interfaces
- Props tipadas
- Eventos (onSubmit, onChange)

**Extra**:

- Filtros (completadas / pendientes)
- Persistencia en localStorage

### 2️⃣ Contador avanzado

Más que un contador simple.

**Conceptos**:
- `useReducer`
- Tipado de acciones
- Botones reutilizables

**Extra**:
- Historial de cambios
- Deshacer / rehacer

### 3️⃣ Buscador de usuarios

**Objetivo**: consumir una API pública (GitHub, RandomUser)

**Conceptos**:
- `fetch`
- `useEffect`
- Tipos para respuestas de API
- Loading y manejo de errores

## 🟡 Nivel Intermedio (apps reales)
### 4️⃣ Gestor de gastos personales

**Conceptos**:
- Formularios controlados
- Tipos complejos
- Cálculos derivados
- Componentes reutilizables

**Extra**:
- Gráficos (Recharts)
- Exportar a CSV

### 5️⃣ CRUD completo (sin backend)

Ejemplo: gestión de productos / clientes
**Conceptos**:

- Crear / editar / eliminar
- Modales
- Estado global simple (Context)

👉 Ideal si querés simular tu plataforma de ventas.

### 6️⃣ App de clima

**Conceptos**:

- APIs externas
- Tipado de respuestas
- Custom hooks (useWeather)
- Manejo de errores reales

### 7️⃣ Dashboard admin

**Conceptos**:

- Layouts
- Rutas protegidas
- Tablas
- Filtros y paginación

**Extra**:

- Dark mode
- Componentes genéricos

## 🔵 Nivel Avanzado (nivel profesional)
### 8️⃣ Plataforma de ventas (mini e-commerce)

Muy alineado con tu proyecto actual.
**Conceptos**:

- Arquitectura por capas
- Estado global (Context / Zustand)
- Órdenes, productos, clientes
- Tipos compartidos

**Extra**:

- Carrito de compras
- Roles (admin / usuario)

### 9️⃣ Sistema de gestión de usuarios y juegos

**Conceptos**:

- Relaciones many-to-many
- Modales de edición
- Estados (jugando, completado)
- Calificación y tiempo jugado

### 🔟 Autenticación completa

**Conceptos**:

- Login / registro
- JWT
- Rutas protegidas
- Guards y middlewares frontend

**Extra**:

- Refresh token
- Persistencia de sesión

## 🔴 Nivel Experto 
### 1️⃣1️⃣ Editor visual (tipo Notion light)

**Conceptos**:
- Estado complejo
- Drag & drop
- Performance
- Tipado avanzado

### 1️⃣2️⃣ App en tiempo real

Ejemplo: chat o tablero colaborativo

**Conceptos**:
- WebSockets
- Sincronización de estado
- Optimistic UI

# CheatSheet para crear Proyectos

Crear proyectos: 

    npm create vite@latest

Bootstrap: Agregar link en el `head` del `index.html`

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">

Prettier: agregar en el `package.json`

    "prettier":{
        "tabWidth": 4,
        "semi": true
    }