'use client';

import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, query } from '../lib/api';
import { ConfirmDialog } from './ConfirmDialog';
import {
  Button,
  Card,
  ErrorBanner,
  PageHeader,
  controlClass,
  inputClass,
} from './ui';

type Field = {
  key: string;
  label: string;
  type?: string;
  options?: string[];
  renderInput?: (defaultValue: string) => React.ReactNode;
};
type Col = {
  key: string;
  label: string;
  render?: (v: any, row: any) => React.ReactNode;
};

export function Crud({
  title,
  path,
  fields,
  columns,
  filters = [],
}: {
  title: string;
  path: string;
  fields: Field[];
  columns: Col[];
  filters?: Field[];
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [page, setPage] = useState(1);
  const [terms, setTerms] = useState<Record<string, string>>({});
  const [edit, setEdit] = useState<any | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const shortTitle = title.replace(' Management', '');
  const rowId = (row: any) => row[columns[0].key] ?? row.id;
  const val = (row: any, key: string) => row[key] ?? '';

  const closeModal = () => setOpen(false);

  const load = () => {
    setLoading(true);
    setError('');
    api<any[]>(`${path}?${query({ ...terms, page, limit: 10 })}`)
      .then((x) => {
        setRows(x.data);
        setMeta(x.meta);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : 'Unable to load records'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [page, JSON.stringify(terms)]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    const form = new FormData(e.currentTarget);
    const body: any = {};
    fields.forEach((field) => {
      const value = String(form.get(field.key) || '');
      body[field.key] = field.type === 'number' ? Number(value) : value;
    });
    try {
      await api(edit ? `${path}/${rowId(edit)}` : path, {
        method: edit ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      closeModal();
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError('');
    try {
      await api(`${path}/${rowId(deleteTarget)}`, { method: 'DELETE' });
      setDeleteTarget(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader
        title={title}
        subtitle="Connected directly to the operational database through the secured API."
        action={
          <Button
            onClick={() => {
              setEdit(null);
              setFormError('');
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add {shortTitle}
          </Button>
        }
      />

      {error ? <ErrorBanner message={error} /> : null}

      {filters.length ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {filters.map((filter) =>
            filter.options ? (
              <select
                key={filter.key}
                aria-label={filter.label}
                className={`${controlClass} min-w-[140px] flex-1 sm:flex-none`}
                onChange={(e) => {
                  setPage(1);
                  setTerms({ ...terms, [filter.key]: e.target.value });
                }}
              >
                <option value="">All {filter.label}</option>
                {filter.options.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            ) : (
              <input
                key={filter.key}
                type={filter.type || 'text'}
                aria-label={filter.label}
                placeholder={filter.type === 'date' ? undefined : filter.label}
                className={`${controlClass} min-w-[150px] flex-1 sm:flex-none`}
                onChange={(e) => {
                  setPage(1);
                  setTerms({ ...terms, [filter.key]: e.target.value });
                }}
              />
            ),
          )}
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-muted">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="whitespace-nowrap px-4 py-3 font-semibold"
                  >
                    {column.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-14 text-center text-muted"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
                      Loading records…
                    </span>
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((row) => (
                  <tr key={rowId(row)} className="hover:bg-slate-50/60">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className="whitespace-nowrap px-4 py-3 text-ink"
                      >
                        {column.render
                          ? column.render(val(row, column.key), row)
                          : val(row, column.key)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          aria-label="Edit record"
                          className="grid h-8 w-8 place-items-center rounded-md border border-line text-muted transition hover:bg-slate-50 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                          onClick={() => {
                            setEdit(row);
                            setFormError('');
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete record"
                          className="grid h-8 w-8 place-items-center rounded-md border border-red-200 text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          onClick={() => setDeleteTarget(row)}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-4 py-14 text-center text-muted"
                  >
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {meta ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm text-muted">
            <span>{meta.total} records</span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Prev
              </Button>
              <span className="px-1 text-xs font-medium">
                {page} / {meta.totalPage || 1}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= meta.totalPage}
                onClick={() => setPage(page + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ) : null}
      </Card>

      {open ? (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-navy/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${edit ? 'Edit' : 'Add'} ${shortTitle}`}
        >
          <div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-6">
            <form
              onSubmit={save}
              className="relative w-full max-w-2xl rounded-t-2xl border border-line bg-white shadow-2xl sm:rounded-xl"
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
                <h2 className="text-base font-bold tracking-tight text-navy">
                  {edit ? 'Edit' : 'Add'} {shortTitle}
                </h2>
                <button
                  type="button"
                  aria-label="Close dialog"
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-slate-100 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  onClick={closeModal}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="px-5 py-5 sm:px-6">
                {formError ? <ErrorBanner message={formError} /> : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  {fields.map((field) => (
                    <label
                      key={field.key}
                      className="grid gap-1.5 text-sm font-semibold text-ink"
                    >
                      {field.label}
                      {field.renderInput ? (
                        field.renderInput(val(edit || {}, field.key))
                      ) : field.options ? (
                        <select
                          name={field.key}
                          defaultValue={val(edit || {}, field.key)}
                          className={inputClass}
                          required
                        >
                          {field.options.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          name={field.key}
                          type={field.type || 'text'}
                          defaultValue={val(edit || {}, field.key)}
                          className={inputClass}
                          required
                        />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4 sm:px-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? 'Saving…' : 'Save changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete record"
        message="Delete this record? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        busy={deleting}
        onConfirm={() => void del()}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
