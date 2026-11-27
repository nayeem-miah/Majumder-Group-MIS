'use client';

import { CheckCircle2, FileText, Info, UploadCloud, X } from 'lucide-react';
import { useState } from 'react';
import {
  Button,
  Card,
  ErrorBanner,
  PageHeader,
} from '../../../components/ui';
import { api } from '../../../lib/api';

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

export default function Csv() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>();
  const [error, setError] = useState('');

  async function upload() {
    if (!file || busy) return;
    setBusy(true);
    setError('');
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
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  const clear = () => {
    setFile(null);
    setResult(undefined);
    setError('');
  };

  return (
    <>
      <PageHeader
        title="Bulk CSV Upload"
        subtitle="The whole upload is atomic — the server rolls every row back if any validation fails."
      />

      {error ? (
        <ErrorBanner message={error} />
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
                  setFile(e.target.files?.[0] || null);
                  setResult(undefined);
                  setError('');
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
            </div>
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
                Choose a CSV file with the required column headers.
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
