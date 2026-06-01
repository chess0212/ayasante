import React from 'react';
import { Enfant } from '../types';
import { Sparkles, TrendingUp, Apple, CheckCircle } from 'lucide-react';

interface GrowthChartProps {
  enfant: Enfant;
}

export default function GrowthChart({ enfant }: GrowthChartProps) {
  const points = enfant.historique_poids || [];
  
  // WHO Standard weight benchmarks for the first 12 months (in kg)
  // Green healthy range, yellow surveillance, red caution
  const whoStandard = [
    { ageInMonths: 0, minNormal: 2.5, maxNormal: 4.4 },
    { ageInMonths: 2, minNormal: 4.3, maxNormal: 7.1 },
    { ageInMonths: 4, minNormal: 5.6, maxNormal: 8.7 },
    { ageInMonths: 6, minNormal: 6.4, maxNormal: 9.8 },
    { ageInMonths: 8, minNormal: 7.0, maxNormal: 10.5 },
    { ageInMonths: 10, minNormal: 7.4, maxNormal: 11.2 },
    { ageInMonths: 12, minNormal: 7.8, maxNormal: 11.8 },
  ];

  // Helper to calculate approximate age in months between dob and a checkup date
  const computeAgeInMonthsAtDate = (checkupDateStr: string, dobStr: string): number => {
    const dob = new Date(dobStr);
    const checkDate = new Date(checkupDateStr);
    const diffTime = checkDate.getTime() - dob.getTime();
    if (diffTime <= 0) return 0;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.round((diffDays / 30.4) * 10) / 10;
  };

  // Convert checkup log history into chart-friendly values (X: Age in months, Y: weight value)
  const chartData = points.map(pt => {
    const ageMonths = computeAgeInMonthsAtDate(pt.date, enfant.date_naissance);
    return {
      age: Math.min(12, ageMonths),
      weight: pt.valeur,
      date: pt.date
    };
  }).sort((a, b) => a.age - b.age);

  // SVG dimensions
  const width = 360;
  const height = 180;
  const paddingLeft = 32;
  const paddingBottom = 24;
  const paddingTop = 12;
  const paddingRight = 12;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Max scale constants: X-axis 0 to 12 months, Y-axis 0 to 14 kg
  const maxX = 12;
  const maxY = 14;

  const getXCoord = (age: number) => paddingLeft + (Math.max(0, Math.min(maxX, age)) / maxX) * chartWidth;
  const getYCoord = (weight: number) => paddingTop + chartHeight - (Math.max(0, Math.min(maxY, weight)) / maxY) * chartHeight;

  // 1. Generate line path for WHO healthy lower limit
  const lowerLimitPath = whoStandard.map((std, idx) => {
    const x = getXCoord(std.ageInMonths);
    const y = getYCoord(std.minNormal);
    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // 2. Generate line path for WHO healthy upper limit
  const upperLimitPath = whoStandard.map((std, idx) => {
    const x = getXCoord(std.ageInMonths);
    const y = getYCoord(std.maxNormal);
    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // 3. Generate child's actual growth progression line path
  const actualPath = chartData.map((pt, idx) => {
    const x = getXCoord(pt.age);
    const y = getYCoord(pt.weight);
    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Underweight status message
  const lastCheck = chartData[chartData.length - 1];
  let isUnderweight = false;
  if (lastCheck) {
    // Find expected min normal weight for this approximate age
    const stdRef = whoStandard.reduce((prev, curr) => {
      return Math.abs(curr.ageInMonths - lastCheck.age) < Math.abs(prev.ageInMonths - lastCheck.age) ? curr : prev;
    });
    if (lastCheck.weight < stdRef.minNormal) {
      isUnderweight = true;
    }
  }

  return (
    <div id={`growth-chart-${enfant.id}`} className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h4 className="text-xs font-bold text-stone-700 tracking-tight flex items-center gap-1.5 uppercase">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Courbe de Croissance Staturo-Pondérale (0 - 12 mois)
          </h4>
          <p className="text-[10px] text-stone-500 font-sans">Suivi OMS du poids (kg) par rapport à l'âge (mois)</p>
        </div>
        {points.length > 0 && (
          <span className="text-[10.5px] px-2.5 py-0.5 bg-white ring-1 ring-stone-200 text-stone-700 rounded-md font-semibold font-mono">
            Dernier poids : {points[points.length - 1].valeur} kg
          </span>
        )}
      </div>

      {/* SVG Canvas Chart */}
      <div className="relative bg-white border border-stone-100 rounded-lg p-1.5 flex justify-center overflow-x-auto shadow-inner">
        <svg width={width} height={height} className="overflow-visible font-sans text-[8.5px] font-mono text-stone-400">
          {/* Horizontal Gridlines */}
          {[2, 4, 6, 8, 10, 12, 14].map(w => {
            const y = getYCoord(w);
            return (
              <g key={w}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#f1f3f5" strokeWidth={1} />
                <text x={paddingLeft - 6} y={y + 3} textAnchor="end" className="fill-stone-400">{w}kg</text>
              </g>
            );
          })}

          {/* Vertical Gridlines (months) */}
          {[0, 2, 4, 6, 8, 10, 12].map(m => {
            const x = getXCoord(m);
            return (
              <g key={m}>
                <line x1={x} y1={paddingTop} x2={x} y2={height - paddingBottom} stroke="#f1f3f5" strokeWidth={1} />
                <text x={x} y={height - paddingBottom + 12} textAnchor="middle" className="fill-stone-400">{m}m</text>
              </g>
            );
          })}

          {/* WHO Target Normal Range Backdrop Polygon Area */}
          <path
            d={`${lowerLimitPath} L ${getXCoord(12)} ${getYCoord(11.8)} L ${getXCoord(10)} ${getYCoord(11.2)} L ${getXCoord(8)} ${getYCoord(10.5)} L ${getXCoord(6)} ${getYCoord(9.8)} L ${getXCoord(4)} ${getYCoord(8.7)} L ${getXCoord(2)} ${getYCoord(7.1)} L ${getXCoord(0)} ${getYCoord(4.4)} Z`}
            fill="#10b981"
            fillOpacity={0.07}
          />

          {/* WHO Lower Healthy Line */}
          <path d={lowerLimitPath} fill="none" stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 3" />
          
          {/* WHO Upper Healthy Line */}
          <path d={upperLimitPath} fill="none" stroke="#10b981" strokeWidth={1.2} strokeDasharray="2 2" />

          {/* Actual growth line of child */}
          {points.length > 1 && (
            <path
              d={actualPath}
              className="growth-actual-line"
              fill="none"
              stroke={isUnderweight ? '#df4732' : '#047857'}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          )}

          {/* Bullet points for actual visits */}
          {chartData.map((pt, index) => (
            <g key={index}>
              <circle
                cx={getXCoord(pt.age)}
                cy={getYCoord(pt.weight)}
                r={4}
                className={isUnderweight ? 'fill-red-600' : 'fill-emerald-800'}
                stroke="#fff"
                strokeWidth={1.5}
              />
              {index === chartData.length - 1 && (
                <text
                  x={getXCoord(pt.age)}
                  y={getYCoord(pt.weight) - 8}
                  textAnchor="middle"
                  className={`font-sans font-bold ${isUnderweight ? 'fill-red-650' : 'fill-emerald-800'}`}
                >
                  {pt.weight} kg
                </text>
              )}
            </g>
          ))}

          {/* Legend */}
          <g transform={`translate(${paddingLeft + 152}, ${paddingTop + 14})`}>
            <rect x={0} y={0} width={150} height={32} rx={4} fill="#fff" fillOpacity={0.9} stroke="#f0f0f0" strokeWidth={1} />
            <circle cx={8} cy={10} r={3} fill="#10b981" />
            <text x={16} y={13} className="fill-stone-500 font-sans text-[7.5px]">Seuil Optimal OMS</text>
            <circle cx={8} cy={22} r={3} fill="#ef4444" />
            <text x={16} y={25} className="fill-stone-500 font-sans text-[7.5px]">Surveillance requise</text>
          </g>
        </svg>
      </div>

      {/* WHO clinical diagnostics helper */}
      {isUnderweight ? (
        <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-1.5 text-xs text-red-800">
          <Apple className="w-4 h-4 text-red-600 shrink-0 mt-0.5 animate-bounce" />
          <div>
            <strong className="font-bold">⚠️ Alerte Vigilance Malnutrition :</strong> Le poids de {enfant.nom} ({points[points.length - 1].valeur} kg) se situe sous la courbe de croissance recommandée de l’OMS. 
            Veuillez proposer des suppléments de farine enrichie locale (bouillie) et appeler un pédiatre agréé.
          </div>
        </div>
      ) : (
        <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1.5 text-[10.5px] text-emerald-800">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Bravo ! Bon développement staturo-pondéral. {enfant.nom} grandit conformément aux objectifs de santé nationaux PNDS.</span>
        </div>
      )}
    </div>
  );
}
