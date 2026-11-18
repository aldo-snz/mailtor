# Mailtor antes de IPQS

## Flujo de registro

1. Mostrá la validación sintáctica y la sugerencia de dominio mientras la persona escribe o después de la primera salida del campo.
2. Si hay sugerencia, ofrecé **Usar sugerencia** y **Descartar**. Nunca reemplaces la dirección sin una acción explícita.
3. En el envío, leé el valor final del campo o del estado del formulario. Enviá ese mismo valor a tu backend y, si tu flujo usa IPQS, hacé que IPQS evalúe ese valor final.
4. Si Mailtor no propone nada, continuá con el flujo habitual. Una dirección sintácticamente válida o corregida no equivale a una casilla existente.

Mailtor puede reducir las direcciones que llegan a IPQS con un typo de dominio **si la persona acepta la sugerencia**. Por sí solo no reduce el número de llamadas a IPQS cuando todas las direcciones enviadas siguen evaluándose. Tampoco convierte automáticamente un resultado de baja entregabilidad en uno alto.

## Reglas revisadas por negocio

```ts
import {attachEmailValidation} from 'mailtor/inline';

const cleanup = attachEmailValidation(document.querySelector('#email')!, {
  mode: 'input',
  protectedDomains: ['miempresa.com'],
  corrections: {
    'hmail.com': 'hotmail.com',
    'gmail.co': 'gmail.com'
  }
});
```

El mapeo exacto se aplica solo si el dominio de origen coincide y el destino tiene formato válido. Revisá cada origen antes de activarlo: un dominio que parece un error también puede existir y ser usado legítimamente. `mail.com` está protegido por defecto. Las reglas por similitud no cruzan sufijos; los mapeos exactos sí pueden hacerlo cuando el equipo haya revisado ese caso. Para quitar listeners al desmontar la vista, llamá `cleanup()`.

## Cómo medir el efecto

Instrumentá la aplicación, no la librería; Mailtor no emite telemetría. Por intento de registro, distinguí:

- dirección original y dirección final, idealmente solo en sistemas con la protección de datos correspondiente;
- si hubo sugerencia, si se aceptó o descartó y qué regla la produjo, sin inferir que era correcta;
- resultado posterior de IPQS, envío de verificación y confirmación real de la persona.

Compará cohortes equivalentes con y sin la sugerencia. La métrica principal es la **tasa de confirmación de email por persona que empezó el registro**, no el porcentaje de direcciones a las que Mailtor sugirió algo. Como guardarraíl, medí correcciones aceptadas que luego no confirman y reportes de dirección equivocada. Separá personas de intentos repetidos y mantené ventanas de observación iguales. Antes de atribuir una mejora a Mailtor, usá una prueba A/B o un despliegue escalonado con una comparación válida.
