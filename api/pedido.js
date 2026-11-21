// Función de Vercel: recibe y registra los pedidos de la Tienda Fresh Check.
// Los precios se calculan aquí (no se confía en lo que envía el navegador).
// Cada pedido queda en los registros (Logs) del proyecto en Vercel.
// Opcional: si se define la variable de entorno PEDIDOS_WEBHOOK, el pedido
// también se reenvía a esa dirección (por ejemplo, una hoja de cálculo).

const CATALOGO = {
  basico: { nombre: "Fresh Check Básico", precio: 99, promo: 89 },
  hogar: { nombre: "Fresh Check Hogar", precio: 299, promo: 270 },
  repuesto: { nombre: "Repuesto (6 pastillas)", precio: 30, promo: 25 }
};

function etapa(lanzamiento) {
  if (!lanzamiento || !/^\d{4}-\d{2}-\d{2}$/.test(lanzamiento)) return "";
  const inicio = new Date(lanzamiento + "T00:00:00-06:00");
  const dia = Math.floor((Date.now() - inicio.getTime()) / 86400000) + 1;
  if (dia >= 1 && dia <= 15) return "lanzamiento";
  if (dia >= 16 && dia <= 30) return "dos_basicos";
  return "";
}

function texto(v, max) {
  return String(v == null ? "" : v).replace(/[<>]/g, "").trim().slice(0, max);
}

function generarId() {
  const ahora = new Date(Date.now() - 6 * 3600000); // hora de Guatemala
  const f = ahora.toISOString().slice(0, 10).replace(/-/g, "");
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FC-${f}-${r}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || typeof body !== "object") return res.status(400).json({ error: "Pedido inválido" });

  const c = body.cliente || {};
  const cliente = {
    nombre: texto(c.nombre, 80),
    telefono: texto(c.telefono, 15).replace(/[\s-]/g, ""),
    correo: texto(c.correo, 100),
    entrega: c.entrega === "recoger" ? "recoger" : "domicilio",
    zona: texto(c.zona, 40),
    direccion: texto(c.direccion, 160),
    pago: c.pago === "transferencia" ? "transferencia" : "contra_entrega",
    notas: texto(c.notas, 300)
  };

  const errores = [];
  if (cliente.nombre.length < 3) errores.push("nombre");
  if (!/^\d{8}$/.test(cliente.telefono)) errores.push("telefono");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.correo)) errores.push("correo");
  if (!cliente.zona) errores.push("zona");
  if (cliente.entrega === "domicilio" && cliente.direccion.length < 6) errores.push("direccion");

  const items = [];
  for (const it of Array.isArray(body.items) ? body.items : []) {
    const p = CATALOGO[it && it.id];
    const cantidad = Math.floor(Number(it && it.cantidad));
    if (p && cantidad >= 1 && cantidad <= 50) items.push({ id: it.id, nombre: p.nombre, cantidad });
  }
  if (!items.length) errores.push("items");
  if (errores.length) return res.status(400).json({ error: "Datos incompletos", campos: errores });

  const e = etapa(texto(body.lanzamiento, 10));
  let subtotal = 0;
  for (const it of items) {
    const p = CATALOGO[it.id];
    it.precio = e === "lanzamiento" ? p.promo : p.precio;
    it.importe = it.precio * it.cantidad;
    subtotal += it.importe;
  }
  let descuento = 0;
  const basicos = items.find((i) => i.id === "basico");
  if (e === "dos_basicos" && basicos && basicos.cantidad >= 2) {
    descuento = Math.floor(basicos.cantidad / 2) * (2 * 99 - 179);
  }

  const pedido = {
    id: generarId(),
    fecha: new Date().toISOString(),
    cliente,
    items,
    subtotal,
    descuento,
    total: subtotal - descuento,
    promocion: e || "ninguna"
  };

  console.log("PEDIDO_FRESH_CHECK " + JSON.stringify(pedido));

  if (process.env.PEDIDOS_WEBHOOK) {
    try {
      await fetch(process.env.PEDIDOS_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedido)
      });
    } catch (err) {
      console.error("No se pudo reenviar el pedido:", err.message);
    }
  }

  return res.status(201).json({ id: pedido.id, total: pedido.total });
};
