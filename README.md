# Tienda Fresh Check

Tienda en línea oficial de **Fresh Check**, indicador de tiempo y temperatura para recipientes herméticos.
Proyecto académico, curso Proyectos Empresariales 2, Universidad Galileo.

## Qué hace

- Catálogo con los kits Fresh Check Básico (Q99) y Fresh Check Hogar (Q299), y el Repuesto de 6 pastillas (Q30).
- Carrito de compras que se guarda en el navegador.
- Formulario de pedido con validación de nombre, teléfono, correo, zona, dirección y forma de pago.
- Registro real del pedido en el servidor (`/api/pedido`). El servidor recalcula precios y descuentos y devuelve el número de pedido (`FC-AAAAMMDD-XXXX`).
- Al confirmar, muestra el número de pedido y el aviso de **página en desarrollo**.
- Promociones del plan de mercado, activables con una fecha:
  - Días 1 a 15: precios de lanzamiento (Q89, Q270 y Q25).
  - Días 16 a 30: 2 kits Básico por Q179.

## Estructura

```
index.html        Página de la tienda (estilos y funciones incluidos)
api/pedido.js     Función de Vercel que recibe y registra los pedidos
assets/           Imágenes del producto
```

## Publicar en Vercel

1. Entrar a vercel.com con la cuenta de GitHub.
2. **Add New → Project** e importar este repositorio.
3. Framework: **Other**. No requiere comando de compilación. Pulsar **Deploy**.
4. Cada cambio que se suba a GitHub se publica solo.

## Dónde ver los pedidos

En Vercel: proyecto → **Logs**. Cada pedido aparece como una línea `PEDIDO_FRESH_CHECK {...}` con cliente, productos y total.

Opcional: para recibir los pedidos en una hoja de cálculo u otro servicio, crear en Vercel la variable de entorno `PEDIDOS_WEBHOOK` con la dirección que debe recibirlos (por ejemplo, un Apps Script de Google Sheets).

## Activar las promociones

En `index.html`, en la sección de configuración del script, escribir la fecha de lanzamiento:

```js
var LANZAMIENTO = "2026-12-01";
```

Si queda vacía, se usan los precios regulares.
