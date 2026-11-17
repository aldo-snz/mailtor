pyenv: cannot rehash: /Users/aldo_snz/.pyenv/shims isn't writable
# Mailtor

Librería ligera de validación sintáctica y sugerencia **opcional** de dominios de email. Cero dependencias de ejecución, sin red, DNS, telemetría ni servicios externos. No verifica si una casilla existe, recibe mensajes o pertenece a alguien.

> Estado: repositorio listo para desarrollo e integración. `private: true` impide publicar accidentalmente en npm; para una distribución futura habría que decidir el canal y quitar esa marca.

## Instalación local

```sh
npm ci
npm run build
npm test
npm run size
npm run playground
```

Abrí `http://127.0.0.1:4173/playground/`. El playground también se puede servir como sitio estático desde la raíz del repositorio **después de ejecutar `npm run build`**: usa `playground/index.html`, `style.css` y `app.js`. No requiere backend. Para pruebas de navegador: `npx playwright install chromium firefox webkit` y `npm run test:browser`.

## API

```ts
import { validateEmail } from 'mailtor/validate';
import { suggestEmail } from 'mailtor/suggest';
import { analyzeEmail } from 'mailtor/analyze';

validateEmail('Ana.Perez+tag@miempresa.com');
// { valid: true, errors: [], warnings: [], local: 'Ana.Perez+tag', domain: 'miempresa.com' }
suggestEmail('Ana.Perez+tag@gmial.com');
// { address: 'Ana.Perez+tag@gmail.com', domain: 'gmail.com', originalDomain: 'gmial.com' }
analyzeEmail('ana@gmial.com'); // validación + sugerencia
```

`validateEmail(email, {allowUnicodeDomain?: boolean, requireTld?: boolean})` devuelve `valid`, códigos `errors` y `warnings`, y partes `local` y `domain`. `suggestEmail(email, {domains?: string[], maxDistance?: 1|2, ...})` devuelve una sugerencia o `null`. `analyzeEmail` reúne ambos resultados. La lista configurable **solo** define destinos de sugerencia; cualquier dominio propio puede ser sintácticamente válido. La lista se limita a 500 entradas; los candidatos duplicados no crean un empate. La corrección exige el mismo sufijo final y un ganador único a la menor distancia. No hay puntuación de confianza.

### Reglas y límites

- Una sola `@`, partes no vacías, sin espacios ni caracteres de control.
- Parte local ASCII sin puntos iniciales, finales ni consecutivos; permite `+tag` y los caracteres usuales de `dot-atom`. Máximo 64 bytes.
- Dominio con etiquetas ASCII alfanuméricas y guiones interiores; cada etiqueta hasta 63 bytes, dominio hasta 253 bytes. Por defecto exige al menos dos etiquetas y sufijo de 2 o más caracteres.
- Email completo hasta 254 bytes. Entradas de más de 1024 unidades UTF-16 se rechazan antes del análisis.
- Unicode en la parte local y direcciones entre comillas no están soportados. Los dominios Unicode requieren `allowUnicodeDomain: true`, producen `IDN_DOMAIN` y se miden tras convertirlos a ASCII con la API URL del entorno. Literales IP entre corchetes no están soportados. `requireTld: false` permite dominios de una etiqueta con advertencia `SINGLE_LABEL_DOMAIN`.
- Es un perfil práctico de entrada web, **no** cumplimiento completo de RFC 5321/5322/EAI. No normaliza la parte local ni infiere reglas particulares de proveedores.

## Integración inline

```ts
import { attachEmailValidation } from 'mailtor/inline';
const cleanup = attachEmailValidation(document.querySelector('#email')!, {
  mode: 'blur', // 'submit' o 'input'
  domains: ['gmail.com', 'outlook.com', 'mi-proveedor.com']
});
// Al desmontar: cleanup();
```

Con `mode: 'blur'` (predeterminado), el primer mensaje aparece al salir del campo o enviar el formulario. Tras mostrarse, se actualiza mientras el usuario corrige. `submit` espera al envío inicial; `input` valida desde la primera pulsación. El adaptador añade `aria-invalid`, conserva y amplía `aria-describedby`, anuncia mensajes de texto y ofrece botones para aceptar o descartar una sugerencia. No reemplaza el valor sin clic explícito. La limpieza elimina listeners y restaura los atributos anteriores. En un formulario invalido, evita su envío mediante `preventDefault` sin detener otros listeners.

El build ESM está en `dist/`; `dist/mailtor.browser.js` expone `window.Mailtor` para un `<script>` directo. Los subpaths permiten importar solo validación, sugerencias o adaptador. `sideEffects: false` habilita tree shaking con bundlers que lo respeten.

## React sin dependencia de React

```tsx
import {useEffect, useRef} from 'react';
import {attachEmailValidation} from 'mailtor/inline';
export function EmailField() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current ? attachEmailValidation(ref.current) : undefined, []);
  return <label>Email <input ref={ref} name="email" type="text" /></label>;
}
```

## Calidad

`npm test` compara casos representativos con `validator@13.15.35` y `mailcheck@1.1.1` como dependencias de desarrollo. `npm run test:browser` verifica el playground en Chromium, Firefox y WebKit. `npm run size` mide módulos minificados y gzip por separado. `npm run bench` repite entradas conocidas 5000 veces y muestra entorno y versiones; las funciones de sugerencia y validación no realizan exactamente el mismo trabajo que las referencias, así que ese resultado es descriptivo, no una afirmación de superioridad. Las decisiones y atribuciones están en [docs/DECISIONES.md](docs/DECISIONES.md) y [NOTICE.md](NOTICE.md).
