'use client';

import {
  AlertTriangle,
  Gauge,
  RefreshCw,
  Shirt,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button, Card, ErrorBanner, PageHeader } from '../../components/ui';
import { api } from '../../lib/api';
import type { Dashboard } from '../../lib/types';

function Progress({ value }: { value: number }) {
  const width = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-brand transition-all"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  note,
  icon: Icon,
  tone = 'brand',
}: {
  label: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
  tone?: 'brand' | 'danger' | 'amber' | 'emerald';
}) {
  const tones = {
    brand: 'bg-brand/10 text-brand',
    danger: 'bg-red-50 text-danger',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  } as const;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-medium text-muted">{label}</span>
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tones[tone]}`}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
      </div>
      <div
        className={`mt-3 text-3xl font-bold tracking-tight ${
          tone === 'danger' ? 'text-danger' : 'text-navy'
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted">{note}</div>
    </Card>
  );
}

export default function Overview() {
  const [data, setData] = useState<Dashboard>();
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    api<Dashboard>('/dashboard/summary')
      .then((x) => setData(x.data))
      .catch((x) =>
        setError(x instanceof Error ? x.message : 'Unable to load dashboard'),
      );
  };

  useEffect(() => {
    void load();
  }, []);

  const header = (
    <PageHeader
      title="Executive overview"
      subtitle="Live production, capacity, fleet and style completion."
      action={
        <Button variant="secondary" onClick={load}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </Button>
      }
    />
  );

  if (!data) {
    return (
      <>
        {header}
        {error ? (
          <>
            <ErrorBanner message={error} />
            <Card className="p-10 text-center">
              <p className="text-sm text-muted">The dashboard could not be loaded.</p>
              <Button className="mt-4" onClick={load}>
                Try again
              </Button>
            </Card>
          </>
        ) : (
          <Card className="flex items-center justify-center gap-3 p-12 text-sm text-muted">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
            Loading executive metrics…
          </Card>
        )}
      </>
    );
  }

  return (
    <>
      {header}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Factory efficiency"
          value={`${data.overallEfficiency.percentage}%`}
          note={`${data.overallEfficiency.totalOutput} pieces produced`}
          icon={Gauge}
          tone="brand"
        />
        <Kpi
          label="Critical bottleneck lines"
          value={data.bottleneckLines.length}
          note="Operating below 65%"
          icon={AlertTriangle}
          tone={data.bottleneckLines.length ? 'danger' : 'emerald'}
        />
        <Kpi
          label="Fleet utilization"
          value={`${data.fleetUtilization.percentage}%`}
          note={`${data.fleetUtilization.dispatchedVehicles} dispatched · ${data.fleetUtilization.idleVehicles} idle`}
          icon={Truck}
          tone="amber"
        />
        <Kpi
          label="Style completion"
          value={data.styleCompletion.length}
          note="Styles in current portfolio"
          icon={Shirt}
          tone="emerald"
        />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-5">
          <h3 className="text-base font-semibold text-navy">Style completion</h3>
          <div className="mt-4 grid gap-4">
            {data.styleCompletion.slice(0, 6).map((style) => (
              <div key={style.style_id}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-ink">
                    {style.style_no} · {style.buyer_name}
                  </span>
                  <b className="shrink-0 text-navy">{style.completionPercentage}%</b>
                </div>
                <Progress value={style.completionPercentage} />
              </div>
            ))}
            {!data.styleCompletion.length ? (
              <p className="py-6 text-center text-sm text-muted">
                No styles in the portfolio yet.
              </p>
            ) : null}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-base font-semibold text-navy">Fleet snapshot</h3>
          <div className="mt-3 text-3xl font-bold tracking-tight text-navy">
            {data.fleetUtilization.totalActiveVehicles}
          </div>
          <p className="text-sm text-muted">Active vehicles</p>
          <Progress value={data.fleetUtilization.percentage} />
          <p className="mt-3 text-xs text-muted">
            {data.fleetUtilization.dispatchedVehicles} currently dispatched ·{' '}
            {data.fleetUtilization.idleVehicles} idle
          </p>
        </Card>
      </section>

      <h2 className="mb-3 mt-6 text-base font-semibold text-navy">
        Critical bottleneck lines
      </h2>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-muted">
              <tr>
                {['Floor', 'Line', 'Style', 'Efficiency', 'Pieces to 65%'].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-4 py-3 font-semibold"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.bottleneckLines.length ? (
                data.bottleneckLines.map((line) => (
                  <tr
                    key={`${line.floor_no}-${line.line_no}-${line.style_no}`}
                    className="hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-3">{line.floor_no}</td>
                    <td className="px-4 py-3">{line.line_no}</td>
                    <td className="px-4 py-3">{line.style_no}</td>
                    <td className="px-4 py-3 font-semibold text-danger">
                      {line.currentEfficiency}%
                    </td>
                    <td className="px-4 py-3">{line.additionalPiecesNeeded}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted">
                    No bottleneck lines found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
