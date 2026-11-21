// Función de Vercel: recibe las opiniones de la sección "Tu opinión importa".
// Cada respuesta queda en los registros (Logs) del proyecto en Vercel.
// Opcional: si se define la variable de entorno OPINIONES_WEBHOOK, la respuesta
// también se reenvía a esa dirección (por ejemplo, una hoja de cálculo).

const OPCIONES = {
  conocio: ["Redes sociales", "Supermercado", "Recomendación", "Creador de contenido", "Otro"],
  compraria: ["Sí", "Tal vez", "No"],
  precio: ["Barato", "Justo", "Caro"],
  presentacion: ["Fresh Check Básico", "Fresh Check Hogar", "Repuesto", "Fresh Check Bags", "Fresh Check Containers"]
};

function texto(v, max) {
  return String(v == null ? "" : v).replace(/[<>]/g, "").trim().slice(0, max);
}
function opcion(v, lista) {
  return lista.includes(v) ? v : "";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }
  let b = req.body;
  if (typeof b === "string") {
    try { b = JSON.parse(b); } catch (e) { b = null; }
  }
  if (!b || typeof b !== "object") return res.status(400).json({ error: "Respuesta inválida" });

  const calificacion = Math.floor(Number(b.calificacion));
  const correo = texto(b.correo, 100);
  const opinion = {
    fecha: new Date().toISOString(),
    nombre: texto(b.nombre, 80),
    correo,
    zona: texto(b.zona, 40),
    calificacion: calificacion >= 1 && calificacion <= 5 ? calificacion : 0,
    conocio: opcion(b.conocio, OPCIONES.conocio),
    compraria: opcion(b.compraria, OPCIONES.compraria),
    precio: opcion(b.precio, OPCIONES.precio),
    presentaciones: (Array.isArray(b.presentaciones) ? b.presentaciones : []).filter((p) => OPCIONES.presentacion.includes(p)),
    comentario: texto(b.comentario, 500)
  };

  const faltan = [];
  if (!opinion.calificacion) faltan.push("calificacion");
  if (!opinion.compraria) faltan.push("compraria");
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) faltan.push("correo");
  if (faltan.length) return res.status(400).json({ error: "Datos incompletos", campos: faltan });

  console.log("OPINION_FRESH_CHECK " + JSON.stringify(opinion));

  if (process.env.OPINIONES_WEBHOOK) {
    try {
      await fetch(process.env.OPINIONES_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opinion)
      });
    } catch (err) {
      console.error("No se pudo reenviar la opinión:", err.message);
    }
  }
  return res.status(201).json({ ok: true });
};
