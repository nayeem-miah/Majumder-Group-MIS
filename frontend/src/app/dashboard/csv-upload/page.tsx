'use client';

import {
  CheckCircle2,
  Download,
  FileText,
  Info,
  UploadCloud,
  X,
} from 'lucide-react';
import { useState } from 'react';
import {
  Button,
  Card,
  ErrorBanner,
  PageHeader,
} from '../../../components/ui';
import { api, ApiError } from '../../../lib/api';

const REQUIRED_COLUMNS = [
  { key: 'prod_date', note: 'YYYY-MM-DD' },
  { key: 'floor_no', note: 'integer' },
  { key: 'line_no', note: 'integer' },
  { key: 'style_no', note: 'text' },
  { key: 'operators_present', note: 'integer' },
  { key: 'working_minutes', note: 'integer' },
  { key: 'output_qty', note: 'integer' },
  { key: 'defect_qty', note: 'integer' },
];

// Header row plus one clearly fake sample row. The sample row uses a seeded
// style so uploading it unedited still succeeds in a fresh demo database.
const TEMPLATE_CSV =
  [
    REQUIRED_COLUMNS.map((column) => column.key).join(','),
    '2026-11-27,1,1,HM-TSHIRT-2026-A1,32,480,420,6',
  ].join('\n') + '\n';

type RowError = {
  row?: number;
  field?: string;
  message?: string;
};

export default function Csv() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>();
  const [error, setError] = useState('');
  const [rowErrors, setRowErrors] = useState<RowError[]>([]);

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'garmentflow-production-template.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function selectFile(selected: File | null) {
    setFile(selected);
    setResult(undefined);
    setError('');
    setRowErrors([]);

    if (!selected) return;

    // Friendly early warning: the most common mistakes are a header-only file
    // (downloaded template left untouched) or a file with no rows at all.
    try {
      const text = await selected.text();
      const dataLines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .slice(1);
      if (dataLines.length === 0) {
        setError(
          'This file has only a header row, so there is nothing to import. Add at least one production row below the header — or download the template below, which includes a ready sample row.',
        );
      }
    } catch {
      // If the browser cannot read it, let the server produce the message.
    }
  }

  async function upload() {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    setRowErrors([]);
    setResult(undefined);
    const form = new FormData();
    form.append('file', file);
    try {
      const response = await api<any>('/production/bulk-upload', {
        method: 'POST',
        body: form,
      });
      setResult(response.data);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        setRowErrors(
          Array.isArray(e.errors) ? (e.errors as RowError[]) : [],
        );
      } else {
        setError(e instanceof Error ? e.message : 'Upload failed');
      }
    } finally {
      setBusy(false);
    }
  }

  const clear = () => {
    setFile(null);
    setResult(undefined);
    setError('');
    setRowErrors([]);
  };

  return (
    <>
      <PageHeader
        title="Bulk CSV Upload"
        subtitle="The whole upload is atomic — the server rolls every row back if any validation fails."
      />

      {error ? (
        <>
          <ErrorBanner message={error} />
          {rowErrors.length > 0 ? (
            <div className="mb-4 overflow-hidden rounded-lg border border-red-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-red-50 text-xs font-semibold uppercase tracking-wide text-red-700">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">Field</th>
                    <th className="px-3 py-2">Problem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100">
                  {rowErrors.map((rowError, index) => (
                    <tr key={`${rowError.row}-${rowError.field}-${index}`}>
                      <td className="px-3 py-2 font-mono text-xs text-ink">
                        {rowError.row ?? '—'}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-ink">
                        {rowError.field ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-red-700">
                        {rowError.message ?? 'Invalid value'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
        {/* Upload panel */}
        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <h3 className="text-base font-semibold text-navy">
              Upload production CSV
            </h3>

            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line bg-slate-50/60 px-6 py-12 text-center transition hover:border-brand/50 hover:bg-brand/5">
              {file ? (
                <>
                  <FileText className="h-10 w-10 text-brand" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-navy">{file.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {(file.size / 1024).toFixed(1)} KB · Click to change
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <UploadCloud className="h-10 w-10 text-brand" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      Choose a CSV file
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      Click to browse or drag and drop
                    </p>
                  </div>
                </>
              )}
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(e) => {
                  void selectFile(e.target.files?.[0] || null);
                }}
              />
            </label>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button onClick={upload} disabled={!file || busy}>
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                {busy ? 'Uploading…' : 'Upload CSV'}
              </Button>
              {file ? (
                <Button variant="ghost" onClick={clear}>
                  <X className="h-4 w-4" aria-hidden="true" />
                  Clear
                </Button>
              ) : null}
              <Button variant="secondary" onClick={downloadTemplate}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Download template
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted">
              Starting fresh? Download the template — it includes all required
              headers plus one sample row you can edit or replace.
            </p>
          </Card>

          {/* Success result */}
          {result ? (
            <Card className="border-emerald-200 bg-emerald-50/40 p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                <p className="font-semibold text-emerald-800">
                  Upload committed successfully
                </p>
              </div>
              <pre className="mt-4 max-h-80 overflow-auto rounded-lg border border-emerald-100 bg-white p-3 text-xs text-ink">
                {JSON.stringify(result, null, 2)}
              </pre>
            </Card>
          ) : null}
        </div>

        {/* Format guide sidebar */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy">
              <Info className="h-4 w-4 text-brand" aria-hidden="true" />
              Required columns
            </div>
            <p className="mt-2 text-xs text-muted">
              Your CSV header row must include all of these columns (in any order):
            </p>
            <ul className="mt-3 space-y-2">
              {REQUIRED_COLUMNS.map((col) => (
                <li key={col.key} className="flex items-center justify-between gap-2">
                  <code className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-navy">
                    {col.key}
                  </code>
                  <span className="text-xs text-muted">{col.note}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-semibold text-navy">How it works</p>
            <ol className="mt-3 space-y-2 text-xs text-muted">
              <li className="flex gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
                  1
                </span>
                Choose a CSV file with the required column headers, or download
                the template above to start from a ready example.
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
                  2
                </span>
                Click <strong className="text-ink">Upload CSV</strong>. The server validates every row.
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
                  3
                </span>
                If any row fails, the entire batch is rolled back — no partial imports.
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
                  4
                </span>
                On success, all rows are committed as a single transaction.
              </li>
            </ol>
          </Card>
        </div>
      </div>
    </>
  );
}
