'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { Style } from '../lib/types';
import { inputClass } from './ui';

export function StyleCombobox({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string;
}) {
  const [styles, setStyles] = useState<Style[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<Style | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<Style[]>('/styles?limit=500')
      .then((res) => {
        setStyles(res.data);
        if (defaultValue) {
          const found = res.data.find(
            (s) => String(s.style_id) === String(defaultValue),
          );
          if (found) {
            setSelected(found);
            setSearchQuery(`${found.style_no} · ${found.buyer_name}`);
          }
        }
      })
      .catch(() => undefined);
  }, [defaultValue]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        if (selected) {
          setSearchQuery(`${selected.style_no} · ${selected.buyer_name}`);
        } else {
          setSearchQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [selected]);

  const filtered = styles.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.style_no.toLowerCase().includes(q) ||
      s.buyer_name.toLowerCase().includes(q) ||
      String(s.style_id).includes(q)
    );
  });

  const select = (style: Style) => {
    setSelected(style);
    setSearchQuery(`${style.style_no} · ${style.buyer_name}`);
    setOpen(false);
  };

  const showDropdown = open && (filtered.length > 0 || searchQuery.length > 0);

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={selected?.style_id ?? ''} />
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelected(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search style no. or buyer…"
          className={`${inputClass} pr-8`}
          autoComplete="off"
          aria-label="Search style"
          aria-expanded={open}
          aria-autocomplete="list"
          role="combobox"
        />
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
      </div>

      {showDropdown ? (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-[200] mt-1 max-h-56 overflow-y-auto rounded-lg border border-line bg-white shadow-lg"
        >
          {filtered.length > 0 ? (
            filtered.slice(0, 50).map((s) => (
              <li
                key={s.style_id}
                role="option"
                aria-selected={selected?.style_id === s.style_id}
              >
                <button
                  type="button"
                  className={`flex w-full items-baseline gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-slate-50 ${
                    selected?.style_id === s.style_id ? 'bg-brand/5' : ''
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(s);
                  }}
                >
                  <span className="shrink-0 font-mono text-[11px] font-semibold text-muted">
                    #{s.style_id}
                  </span>
                  <span className="font-semibold text-navy">{s.style_no}</span>
                  <span className="truncate text-xs text-muted">
                    {s.buyer_name}
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-3 text-sm text-muted">
              {styles.length === 0
                ? 'Loading styles…'
                : `No styles match "${searchQuery}"`}
            </li>
          )}
        </ul>
      ) : null}
    </div>
  );
}
