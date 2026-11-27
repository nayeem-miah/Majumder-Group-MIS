'use client';

import { Clock, MapPin, Plus, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  ErrorBanner,
  PageHeader,
  controlClass,
  inputClass,
} from '../../../components/ui';
import { api, query } from '../../../lib/api';
import type { Trip, Vehicle } from '../../../lib/types';

const statusTone = {
  Scheduled: 'info',
  Dispatched: 'warning',
  Completed: 'success',
  Cancelled: 'danger',
} as const;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

function TripCard({
  trip,
  onAction,
}: {
  trip: Trip;
  onAction: (trip: Trip, next: 'dispatch' | 'complete' | 'cancel') => void;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy">{trip.route_name}</p>
          <p className="mt-0.5 text-xs text-muted">{trip.reg_no}</p>
        </div>
        <Badge tone={statusTone[trip.status]}>{trip.status}</Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-medium text-ink">Dep:</span>{' '}
            {fmtDate(trip.departure_time)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-medium text-ink">Ret:</span>{' '}
            {fmtDate(trip.estimated_return_time)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {trip.passenger_count}/{trip.seat_capacity} passengers
          </span>
        </div>
      </div>

      {trip.status === 'Scheduled' || trip.status === 'Dispatched' ? (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
          {trip.status === 'Scheduled' ? (
            <>
              <Button size="sm" onClick={() => onAction(trip, 'dispatch')}>
                Dispatch
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => onAction(trip, 'cancel')}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => onAction(trip, 'complete')}>
              Complete
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function Trips() {
  const [rows, setRows] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const closeModal = () => setOpen(false);

  const load = () => {
    api<Trip[]>(`/trips?${query({ status, limit: 50 })}`)
      .then((x) => {
        setRows(x.data);
        setError('');
      })
      .catch((x) =>
        setError(x instanceof Error ? x.message : 'Unable to load trips'),
      );
    api<Vehicle[]>('/vehicles?limit=100')
      .then((x) => setVehicles(x.data))
      .catch(() => undefined);
  };

  useEffect(() => {
    void load();
  }, [status]);

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
    try {
      await api('/trips', {
        method: 'POST',
        body: JSON.stringify({
          vehicle_id: Number(form.get('vehicle_id')),
          route_name: form.get('route_name'),
          departure_time: new Date(
            String(form.get('departure_time')),
          ).toISOString(),
          estimated_return_time: new Date(
            String(form.get('estimated_return_time')),
          ).toISOString(),
          passenger_count: Number(form.get('passenger_count')),
        }),
      });
      closeModal();
      load();
    } catch (x) {
      setFormError(x instanceof Error ? x.message : 'Unable to schedule trip');
    } finally {
      setBusy(false);
    }
  }

  async function action(
    trip: Trip,
    next: 'dispatch' | 'complete' | 'cancel',
  ) {
    if (!confirm(`${next} this trip?`)) return;
    setError('');
    try {
      await api(`/trips/${trip.trip_id}/${next}`, { method: 'PATCH' });
      load();
    } catch (x) {
      setError(x instanceof Error ? x.message : 'Action failed');
    }
  }

  return (
    <>
      <PageHeader
        title="Trip & Dispatch"
        subtitle="Schedule trips; the backend validates availability, capacity and time conflicts."
        action={
          <Button
            onClick={() => {
              setFormError('');
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Schedule trip
          </Button>
        }
      />

      {error ? <ErrorBanner message={error} /> : null}

      <div className="mb-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className={`${controlClass} w-full sm:w-auto`}
          aria-label="Filter by trip status"
        >
          <option value="">All statuses</option>
          {['Scheduled', 'Dispatched', 'Completed', 'Cancelled'].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* Mobile card view */}
      <div className="grid gap-3 lg:hidden">
        {rows.length ? (
          rows.map((trip) => (
            <TripCard key={trip.trip_id} trip={trip} onAction={action} />
          ))
        ) : (
          <Card className="px-4 py-14 text-center text-sm text-muted">
            No trips found.
          </Card>
        )}
      </div>

      {/* Desktop table view */}
      <Card className="hidden overflow-hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-muted">
              <tr>
                {['Route', 'Vehicle', 'Departure', 'Return', 'Passengers', 'Status', 'Actions'].map(
                  (h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length ? (
                rows.map((trip) => (
                  <tr key={trip.trip_id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-navy">
                      {trip.route_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink">
                      {trip.reg_no}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink">
                      {fmtDate(trip.departure_time)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink">
                      {fmtDate(trip.estimated_return_time)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink">
                      {trip.passenger_count}/{trip.seat_capacity}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone[trip.status]}>{trip.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {trip.status === 'Scheduled' ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => action(trip, 'dispatch')}
                            >
                              Dispatch
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => action(trip, 'cancel')}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : null}
                        {trip.status === 'Dispatched' ? (
                          <Button
                            size="sm"
                            onClick={() => action(trip, 'complete')}
                          >
                            Complete
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-muted">
                    No trips found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Schedule trip modal */}
      {open ? (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-navy/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Schedule trip"
        >
          <div className="flex min-h-full items-end justify-center p-4 sm:items-center sm:p-6">
            <form
              onSubmit={save}
              className="relative w-full max-w-2xl rounded-t-2xl border border-line bg-white shadow-2xl sm:rounded-xl"
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
                <h2 className="text-base font-bold tracking-tight text-navy">
                  Schedule trip
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
                  <label className="grid gap-1.5 text-sm font-semibold text-ink">
                    Vehicle
                    <select name="vehicle_id" className={inputClass} required>
                      <option value="">Select active vehicle</option>
                      {vehicles
                        .filter((v) => v.status === 'Active')
                        .map((v) => (
                          <option value={v.vehicle_id} key={v.vehicle_id}>
                            {v.reg_no} · {v.seat_capacity} seats
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold text-ink">
                    Route name
                    <input name="route_name" className={inputClass} required />
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold text-ink">
                    Departure time
                    <input
                      name="departure_time"
                      type="datetime-local"
                      className={inputClass}
                      required
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold text-ink">
                    Estimated return
                    <input
                      name="estimated_return_time"
                      type="datetime-local"
                      className={inputClass}
                      required
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold text-ink">
                    Passenger count
                    <input
                      name="passenger_count"
                      type="number"
                      min="1"
                      className={inputClass}
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-4 sm:px-6">
                <Button type="button" variant="secondary" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? 'Scheduling…' : 'Schedule trip'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
