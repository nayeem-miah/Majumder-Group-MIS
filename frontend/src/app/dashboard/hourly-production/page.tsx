'use client';

import { useEffect, useState } from 'react';
import {
  Badge,
  Card,
  ErrorBanner,
  PageHeader,
  controlClass,
} from '../../../components/ui';
import { api, query } from '../../../lib/api';
import type { Production } from '../../../lib/types';

export default function Hourly() {
  const [date, setDate] = useState('');
  const [floor, setFloor] = useState('');
  const [line, setLine] = useState('');
  const [rows, setRows] = useState<Production[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Production[]>(
      `/production?${query({
        prod_date: date,
        floor_no: floor,
        line_no: line,
        limit: 100,
      })}`,
    )
      .then((x) => {
        setRows(x.data);
        setError('');
      })
      .catch((x) =>
        setError(x instanceof Error ? x.message : 'Unable to load production'),
      );
  }, [date, floor, line]);

  return (
    <>
      <PageHeader
        title="Hourly Production"
        subtitle="The API supplies hourly entry records. No fabricated time-series aggregation is shown."
      />

      {error ? <ErrorBanner message={error} /> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`${controlClass} flex-1 sm:flex-none`}
          aria-label="Filter by production date"
        />
        <input
          placeholder="Floor"
          value={floor}
          onChange={(e) => setFloor(e.target.value)}
          className={`${controlClass} w-24 flex-1 sm:flex-none`}
          aria-label="Filter by floor"
        />
        <input
          placeholder="Line"
          value={line}
          onChange={(e) => setLine(e.target.value)}
          className={`${controlClass} w-24 flex-1 sm:flex-none`}
          aria-label="Filter by line"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-muted">
              <tr>
                {[
                  'Date',
                  'Floor / Line',
                  'Style',
                  'Output',
                  'Efficiency',
                  'DHU',
                  'Signal',
                ].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-4 py-3 font-semibold"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length ? (
                rows.map((row) => (
                  <tr key={row.prod_id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-3">{row.prod_date}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.floor_no} / {row.line_no}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{row.style_no}</td>
                    <td className="px-4 py-3">{row.output_qty}</td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        row.efficiency < 65 ? 'text-danger' : 'text-emerald-700'
                      }`}
                    >
                      {row.efficiency}%
                    </td>
                    <td className="px-4 py-3">{row.dhu}%</td>
                    <td className="px-4 py-3">
                      {row.efficiency < 65 ? (
                        <Badge tone="warning">Bottleneck</Badge>
                      ) : (
                        <Badge tone="success">On track</Badge>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted">
                    No production entries match these filters.
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
