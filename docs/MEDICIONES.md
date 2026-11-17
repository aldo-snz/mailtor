# Mediciones locales

Entorno: macOS arm64, Apple M4, Node v25.2.1. Comandos: `npm run size` y `npm run bench`; dependencias de desarrollo fijadas en `package-lock.json`. Cada bundle de tamaño se minificó con esbuild 0.25.12 y se comprimió con gzip de Node.

| Bundle | Minificado | Gzip |
|---|---:|---:|
| `validate` | 1.634 B | 789 B |
| `suggest` (incluye validación) | 2.745 B | 1.278 B |
| `inline` (incluye análisis) | 5.554 B | 2.309 B |
| `all` (API sin adaptador) | 2.858 B | 1.323 B |

El bundle inline autocontenido queda por debajo de la meta inicial de 10 kB gzip. Sumar las filas cuenta código compartido varias veces.

Benchmark: 5000 llamadas por función tras 1000 de calentamiento; entradas cíclicas: email válido de proveedor, dominio propio con alias, error de dominio, dominio con puntos consecutivos y cadena de 1025 caracteres. Resultado de **una ejecución**: Mailtor `validate` 4,46 ms; validator.js `isEmail` 3,74 ms; Mailtor `suggest` 34,76 ms; Mailcheck `run` 21,11 ms. Los algoritmos y listas predeterminadas difieren; estas cifras no demuestran superioridad de ninguna librería. El script imprime entradas, entorno y versiones para repetir la medición.
