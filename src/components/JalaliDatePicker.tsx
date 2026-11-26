import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toJalaali, toGregorian, jalaaliMonthLength } from 'jalaali-js';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface JalaliDatePickerProps {
  value: string;
  onChange: (value: string) => void;
}

const jMonthNames = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const weekdayNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

function faNum(n: number | string): string {
  const faDigits = '۰۱۲۳۴۵۶۷۸۹';
  return String(n).replace(/\d/g, d => faDigits[Number(d)]);
}

export default function JalaliDatePicker({ value, onChange }: JalaliDatePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => toJalaali(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()), []);

  const initialMonth = useMemo(() => {
    if (value) {
      const [jy, jm] = value.split('-').map(Number);
      if (jy && jm) return { jy, jm };
    }
    return { jy: today.jy, jm: today.jm };
  }, []);

  const [viewMonth, setViewMonth] = useState(initialMonth);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cells = useMemo(() => {
    const count = jalaaliMonthLength(viewMonth.jy, viewMonth.jm);
    const first = toGregorian(viewMonth.jy, viewMonth.jm, 1);
    const startDow = (new Date(first.gy, first.gm - 1, first.gd).getDay() + 1) % 7;
    const arr: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) arr.push(null);
    for (let d = 1; d <= count; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [viewMonth]);

  const prevMonth = () => {
    setViewMonth(v => (v.jm === 1 ? { jy: v.jy - 1, jm: 12 } : { jy: v.jy, jm: v.jm - 1 }));
  };
  const nextMonth = () => {
    setViewMonth(v => (v.jm === 12 ? { jy: v.jy + 1, jm: 1 } : { jy: v.jy, jm: v.jm + 1 }));
  };

  const selectDay = (d: number) => {
    const jy = viewMonth.jy, jm = viewMonth.jm;
    onChange(`${jy}-${String(jm).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    setOpen(false);
  };

  const isSelected = (d: number) => {
    if (!value) return false;
    return value === `${viewMonth.jy}-${String(viewMonth.jm).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };
  const isToday = (d: number) => viewMonth.jy === today.jy && viewMonth.jm === today.jm && d === today.jd;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/40 focus:border-brand-500 outline-none text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer text-right"
      >
        <Calendar className="w-3.5 h-3.5 text-brand-500 shrink-0" />
        {value
          ? (() => {
              const [jy, jm, jd] = value.split('-').map(Number);
              return <span>{faNum(jd)} {jMonthNames[jm - 1]} {faNum(jy)}</span>;
            })()
          : <span className="text-slate-400">انتخاب تاریخ...</span>}
      </button>

      {open && (
        <div className="absolute z-30 mt-2 left-0 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-slate-900 dark:text-white">
              {jMonthNames[viewMonth.jm - 1]} {faNum(viewMonth.jy)}
            </span>
            <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {weekdayNames.map((d, i) => (
              <span key={i} className="text-2xs font-black text-slate-400 py-1">{d}</span>
            ))}
            {cells.map((d, i) =>
              d === null ? (
                <span key={i} />
              ) : (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(d)}
                  className={`h-8 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    isSelected(d)
                      ? 'bg-brand-600 text-white'
                      : isToday(d)
                      ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {faNum(d)}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
