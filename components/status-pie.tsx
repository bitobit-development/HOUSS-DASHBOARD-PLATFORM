'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type Summary = {
  normal: number;
  offline: number;
  fault: number;
};

const COLORS = ['#000000', '#f42727', '#faff00']; // green-500, orange-500, red-500

export function StatusPieCard({ title, summary }: { title: string; summary: Summary }) {
  const data = [
    { name: 'Normal',  value: summary.normal },
    { name: 'Offline', value: summary.offline },
    { name: 'Fault',   value: summary.fault },
  ];

  return (
    <div className="rounded-xl bg-card shadow-sm p-4 flex flex-col">
      <h3 className="mb-2 text-sm font-medium">{title}</h3>

      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={48}
            outerRadius={70}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-2 flex justify-around text-xs text-muted-foreground">
        {data.map(d => (
          <span key={d.name}>
            {d.name}: <strong>{d.value}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
