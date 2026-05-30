export function buildPdfFilename(nombreCuenta: string, createdAt?: string): string {
  const safeName = (nombreCuenta || "Cuenta")
    .replace(/\s+/g, "_")
    .replace(/[^\w\-_.áéíóúñÁÉÍÓÚÑ]/gi, "");
  const date = createdAt ? new Date(createdAt).toISOString().slice(0, 10) : "";
  return `Auditoria_Mora_${safeName}${date ? `_${date}` : ""}.pdf`;
}

export function comparacionEsMismaCuenta(
  audits: { nombre_cuenta?: string | null }[]
): boolean {
  if (audits.length !== 2) return true;
  const a = audits[0].nombre_cuenta ?? "";
  const b = audits[1].nombre_cuenta ?? "";
  return a === b;
}
