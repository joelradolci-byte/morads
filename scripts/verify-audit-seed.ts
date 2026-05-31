/**
 * Valida que el motor de auditoría produce hallazgos con datos live + fixture.
 * Las métricas enriquecidas (fixture) son solo para este script; la app usa datos reales.
 *
 * Uso: npx tsx --env-file=.env.local scripts/verify-audit-seed.ts
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { generarEsqueletoAuditoria } from "../lib/motorMora";
import { buildDatosAuditoriaFromGoogleAds } from "../lib/googleAds/liveExtract";
import type { CampaignManifestEntry } from "../lib/googleAds/seedFixtureData";

function env(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Falta ${name}`);
  return v;
}

function loadManifest(): CampaignManifestEntry[] {
  const path = resolve(process.cwd(), "scripts/output/seed-manifest.json");
  if (!existsSync(path)) {
    console.warn("Sin seed-manifest.json — se infiere manifest desde nombres de campaña.");
    return [];
  }
  const raw = JSON.parse(readFileSync(path, "utf8")) as {
    campaigns?: CampaignManifestEntry[];
  };
  return Array.isArray(raw.campaigns) ? raw.campaigns : [];
}

async function main() {
  console.log("Modo verificación: useFixtureMetrics=true (métricas de prueba por nombre de campaña seed).");

  const refreshToken = env("GOOGLE_ADS_REFRESH_TOKEN");
  const customerId = env("GOOGLE_ADS_CUSTOMER_ID").replace(/-/g, "");
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "");

  const manifest = loadManifest();
  const datos = await buildDatosAuditoriaFromGoogleAds({
    refreshToken,
    customerId,
    loginCustomerId: loginCustomerId || null,
    manifest: manifest.length > 0 ? manifest : undefined,
    marca_cliente: "Mora Academia",
    useFixtureMetrics: true,
  });

  console.log("--- Datos de entrada ---");
  console.log(`Campañas: ${datos.campanas.length}`);
  console.log(`Términos: ${datos.terminos?.length ?? 0}`);
  console.log(`Horarios: ${datos.horarios?.length ?? 0}`);
  console.log(
    `Cuenta: gasto=${datos.gasto_total_cuenta} clics=${datos.clics_totales} conv=${datos.conversiones_totales}`
  );

  const esqueleto = generarEsqueletoAuditoria(datos);
  const hallazgos = esqueleto.hallazgos as {
    graves_rojo?: unknown[];
    debiles_amarillo?: unknown[];
    bien_verde?: unknown[];
  };

  console.log("\n--- Motor Mora ---");
  console.log(`Health score: ${esqueleto.health_score}`);
  console.log(`Rojos: ${hallazgos.graves_rojo?.length ?? 0}`);
  console.log(`Amarillos: ${hallazgos.debiles_amarillo?.length ?? 0}`);
  console.log(`Verdes: ${hallazgos.bien_verde?.length ?? 0}`);
  console.log(`Destripador términos: ${esqueleto.destripador?.terminos?.length ?? 0}`);
  console.log(`Dayparting franjas: ${esqueleto.dayparting?.franjas_con_fuga ?? 0}`);
  console.log(
    `Robin Hood: ${(esqueleto as { robin_hood?: { estado?: string } }).robin_hood?.estado ?? "n/a"}`
  );

  const ok =
    (hallazgos.graves_rojo?.length ?? 0) >= 1 &&
    (hallazgos.debiles_amarillo?.length ?? 0) >= 1;

  if (!ok) {
    console.error("\nVerificación fallida: se esperaba al menos 1 hallazgo rojo y 1 amarillo.");
    process.exit(1);
  }

  console.log("\nVerificación OK.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
