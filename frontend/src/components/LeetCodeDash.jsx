// src/components/LeetCodeDash.jsx
import { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from "recharts";
import "./LeetCodeDash.css";

/** props:
 *  stats: { ranking, totalSolved, easy, medium, hard }
 *  calendar: { days:[{date:'YYYY-MM-DD',count:number}], currentStreak, maxStreak }
 */
export default function LeetCodeDash({ stats, calendar }) {
  const totalSolved = stats?.totalSolved ?? 0;

  // 30-day daily series
  const last30 = useMemo(() => {
    const src = calendar?.days || [];
    return src.slice(-30).map(d => ({ date: d.date.slice(5), solved: d.count }));
  }, [calendar]);

  // 12-week totals
  const weekly = useMemo(() => {
    const src = calendar?.days || [];
    if (!src.length) return [];
    const out = [];
    let sum = 0, days = 0;
    const start = Math.max(0, src.length - 84);
    for (let i = start; i < src.length; i++) {
      sum += src[i].count; days++;
      if (days === 7) { out.push({ week: `W${out.length + 1}`, solved: sum }); sum = 0; days = 0; }
    }
    if (days) out.push({ week: `W${out.length + 1}`, solved: sum });
    return out;
  }, [calendar]);

  const diffs = useMemo(() => ([
    { name: "Easy",   value: stats?.easy   || 0 },
    { name: "Medium", value: stats?.medium || 0 },
    { name: "Hard",   value: stats?.hard   || 0 },
  ]), [stats]);

  const goal = Math.max(100, Math.ceil(totalSolved / 50) * 50); // autotune goal

  return (
    <div className="lcdash">
      {/* KPIs */}
      <div className="kpi-row">
        <KPI label="Rank" value={stats?.ranking ?? "—"} />
        <KPI label="Total Solved" value={totalSolved} />
        <KPI label="Current Streak" value={calendar?.currentStreak ?? 0} />
        <KPI label="Max Streak" value={calendar?.maxStreak ?? 0} />
      </div>

      <div className="charts-grid">
        {/* Donut */}
        <div className="chart lcd-card">
          <h3>Progress</h3>
          <div className="chart-box donut-box">
            <ResponsiveContainer>
              <RadialBarChart
                innerRadius="60%"
                outerRadius="100%"
                data={[{ name: "Solved", value: totalSolved, fill: "var(--accent)" }]}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, goal]} tick={false} />
                <RadialBar dataKey="value" background cornerRadius={12} clockWise />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <div className="donut-value">{totalSolved}</div>
              <div className="donut-sub">/ {goal}</div>
            </div>
          </div>
          <div className="donut-caption">Weekly goal auto-scales</div>
        </div>

        {/* Difficulty Pie */}
        <div className="chart card">
          <h3>By Difficulty</h3>
          <div className="chart-box">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={diffs} dataKey="value" nameKey="name" outerRadius={90} label>
                  {diffs.map((_, i) => <Cell key={i} className={`pie c${i}`} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 30-day Area */}
        <div className="chart lcd-card span-2">
          <h3>Daily solves (30 days)</h3>
          <div className="chart-box">
            <ResponsiveContainer>
              <AreaChart data={last30}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopOpacity={0.6} className="grad1"/>
                    <stop offset="95%" stopOpacity={0} className="grad2"/>
                  </linearGradient>
                </defs>
                    <CartesianGrid stroke="rgba(255,255,255,.08)" />
                    <XAxis tick={{ fill: '#a9b6d3' }} />
                    <YAxis tick={{ fill: '#a9b6d3' }} />
                    <Legend wrapperStyle={{ color: '#a9b6d3' }} />
                    <Tooltip contentStyle={{ background:'#0f182b', border:'1px solid rgba(255,255,255,.08)', color:'#e8eefc' }} />

                <Area type="monotone" dataKey="solved" stroke="var(--accent)" fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 12-week Bar */}
        <div className="chart card span-2">
          <h3>Weekly total (12 weeks)</h3>
          <div className="chart-box">
            <ResponsiveContainer>
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis allowDecimals={false} />
                <Tooltip /><Legend />
                <Bar dataKey="solved" className="bar-primary" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value }) {
  return (
    <div className="kpi">
      <div className="k">{label}</div>
      <div className="v">{value}</div>
    </div>
  );
}
