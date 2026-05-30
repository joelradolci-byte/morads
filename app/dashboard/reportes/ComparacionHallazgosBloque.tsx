"use client";

import { AlertTriangle, CheckCircle2, Zap, type LucideIcon } from "lucide-react";
import { diffHallazgos, type HallazgoComparable } from "./comparacionHallazgos";

type ColumnaConfig = {
  titulo: string;
  subtitulo: string;
  Icon: LucideIcon;
  headerBg: string;
  headerBorder: string;
  iconWrap: string;
  iconColor: string;
  titleColor: string;
  cardBorder: string;
  cardBorderLeft: string;
  lineThrough?: boolean;
  emptyText: string;
};

type ComparacionHallazgosBloqueProps = {
  tituloSeccion: string;
  listaA: HallazgoComparable[];
  listaB: HallazgoComparable[];
  columnas: {
    aplicadas: ColumnaConfig;
    persistentes: ColumnaConfig;
    nuevas: ColumnaConfig;
  };
};

export default function ComparacionHallazgosBloque({
  tituloSeccion,
  listaA,
  listaB,
  columnas,
}: ComparacionHallazgosBloqueProps) {
  const { aplicadas, persistentes, nuevas } = diffHallazgos(listaA, listaB);

  if (listaA.length === 0 && listaB.length === 0) return null;

  const cols: { items: HallazgoComparable[]; config: ColumnaConfig }[] = [
    { items: aplicadas, config: columnas.aplicadas },
    { items: persistentes, config: columnas.persistentes },
    { items: nuevas, config: columnas.nuevas },
  ];

  return (
    <div className="mt-8">
      <h3 className="text-lg font-black text-[#F5F0EB] mb-6">{tituloSeccion}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {cols.map(({ items, config }) => {
          const Icon = config.Icon;
          return (
            <div key={config.titulo} className="flex flex-col gap-4">
              <div
                className={`p-4 rounded-2xl flex items-center gap-3 border ${config.headerBg} ${config.headerBorder}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.iconWrap}`}
                >
                  <Icon size={16} className={config.iconColor} />
                </div>
                <div>
                  <p className={`font-black text-sm ${config.titleColor}`}>
                    {config.titulo}
                  </p>
                  <p className="text-[10px] text-[#A8A29E] uppercase tracking-widest font-black">
                    {config.subtitulo}
                  </p>
                </div>
              </div>
              {items.length === 0 ? (
                <p className="text-center text-[#A8A29E] text-xs font-bold py-4">
                  {config.emptyText}
                </p>
              ) : (
                items.map((item, i) => (
                  <div
                    key={i}
                    className={`bg-[#292524] border p-5 rounded-2xl shadow-inner border-l-4 ${config.cardBorder} ${config.cardBorderLeft}`}
                  >
                    <p
                      className={`text-[#F5F0EB] text-sm font-black leading-tight ${
                        config.lineThrough ? "line-through opacity-70" : ""
                      }`}
                    >
                      {item.titulo}
                    </p>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
