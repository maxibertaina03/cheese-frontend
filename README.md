# Cheese Frontend

Frontend del sistema de stock de quesos y elementos de **Las Tres Estrellas**.

Es una aplicacion React + TypeScript que consume el backend `cheese-backend` y permite operar el inventario diario, consultar historial, administrar productos y usuarios, ver metricas y gestionar un modulo adicional de elementos o insumos.

## Que hace la aplicacion

La app esta pensada para el uso interno del negocio. Desde la interfaz se puede:

- iniciar sesion con usuario y contrasena
- visualizar el stock actual de quesos
- registrar nuevos ingresos al inventario
- editar observaciones de una unidad
- realizar cortes parciales o egresos totales
- consultar historial completo de movimientos
- filtrar por texto, fechas y tipo de queso
- administrar productos y usuarios si el rol es `admin`
- ver un dashboard analitico con metricas y graficos
- exportar informacion del dashboard a Excel y PDF
- gestionar un stock paralelo de elementos o insumos

## Como se organiza el sistema en pantalla

### Inventario

Es la vista principal.

Muestra las unidades activas en stock y permite:

- cargar nuevas unidades
- ver producto, peso y estado
- editar observaciones
- cortar una pieza
- eliminar una unidad

### Historial

Concentra las unidades historicas y cerradas, junto con filtros y metricas para revisar lo vendido o agotado.

### Dashboard

Muestra una vista analitica del negocio con:

- unidades activas
- peso total en stock
- cortes totales
- top de productos vendidos
- distribucion del inventario por tipo
- exportacion a Excel
- exportacion a PDF

### Panel de administracion

Disponible para usuarios con rol `admin`.

Incluye:

- gestion de productos
- gestion de usuarios

### Modulo de elementos

Sirve para llevar stock de materiales o insumos fuera del inventario de quesos.

Permite:

- crear elementos
- editar datos basicos
- registrar ingresos
- registrar egresos con motivo
- consultar historial de movimientos
- detectar elementos con stock bajo

## Roles

- `admin`: puede operar y administrar productos, usuarios, quesos y elementos
- `usuario`: puede ingresar al sistema y consultar, con permisos mas limitados segun la vista

## Integracion con el backend

La aplicacion consume una API REST autenticada por JWT.

Endpoints usados con frecuencia:

- `/api/auth/login`
- `/api/unidades`
- `/api/unidades/historial`
- `/api/productos`
- `/api/tipos-queso`
- `/api/motivos`
- `/api/usuarios`
- `/api/reportes/dashboard`
- `/api/elementos`

## Stack

- React
- TypeScript
- Create React App
- Recharts
- jsPDF
- xlsx

## Variable de entorno

El repo incluye `.env.example`.

Variable requerida:

- `REACT_APP_API_URL`: URL base del backend

Ejemplo:

```env
REACT_APP_API_URL=http://localhost:3000
```

## Scripts

- `npm start`: levanta la app en desarrollo
- `npm run build`: genera el build de produccion
- `npm test`: ejecuta tests

## Puesta en marcha local

1. Instalar dependencias con `npm install`
2. Crear `.env` a partir de `.env.example`
3. Asegurar que el backend este corriendo
4. Ejecutar `npm start`

Por defecto, la app abre en `http://localhost:3000` o el puerto que asigne CRA.

## Relacion con el proyecto

Este repositorio representa la capa visual del sistema. Toda la logica de persistencia, autenticacion, inventario, reportes y movimientos vive en `cheese-backend`, mientras que este frontend resuelve la operacion diaria del usuario final.
