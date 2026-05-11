import { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, addDays, addMonths, subMonths, getYear, getMonth } from 'date-fns';
import { Calendar } from 'lucide-react';

const YearMonthSelector = ({ currentDate, onSelectYear, onSelectMonth }) => {
  const year = getYear(currentDate);
  const month = getMonth(currentDate);
  const years = [];
  for (let y = year - 5; y <= year + 5; y++) years.push(y);

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
      <select value={year} onChange={(e) => onSelectYear(Number(e.target.value))}>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      <select value={month} onChange={(e) => onSelectMonth(Number(e.target.value))}>
        {months.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
      </select>
    </div>
  );
};

const DatePicker = ({ value, onChange, placeholder = 'Select date' }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(value ? new Date(value) : null);
  const [displayDate, setDisplayDate] = useState(selected || new Date());
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => { if (value) setSelected(new Date(value)); }, [value]);

  const start = startOfMonth(displayDate);
  const end = endOfMonth(displayDate);
  const startWeek = startOfWeek(start, { weekStartsOn: 0 });

  const days = [];
  for (let i = 0; i < 42; i++) days.push(addDays(startWeek, i));

  const selectDay = (d) => {
    setSelected(d);
    setOpen(false);
    onChange && onChange(d.toISOString());
  };

  const prevMonth = () => setDisplayDate(subMonths(displayDate, 1));
  const nextMonth = () => setDisplayDate(addMonths(displayDate, 1));

  const onYearSelect = (y) => setDisplayDate(new Date(y, getMonth(displayDate), 1));
  const onMonthSelect = (m) => setDisplayDate(new Date(getYear(displayDate), m, 1));

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          value={selected ? format(selected, 'yyyy-MM-dd') : ''}
          onChange={(e) => { const v = e.target.value; try { const d = new Date(v); if (!isNaN(d)) { setSelected(d); onChange && onChange(d.toISOString()); } } catch(e){} }}
          placeholder={placeholder}
          className="form-control"
          style={{ width: '100%', paddingRight: '2.5rem', cursor: 'pointer' }}
          onClick={() => setOpen(true)}
          readOnly
        />
        <button type="button" onClick={() => setOpen(!open)} style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: open ? 'var(--primary-color)' : 'var(--text-secondary)', transition: 'color 0.2s ease' }} aria-label="calendar">
          <Calendar size={18} />
        </button>
      </div>

      {open && (
        <div style={{ 
          position: 'absolute', 
          top: 'calc(100% + 8px)', 
          zIndex: 9999, 
          background: '#161b28',
          border: '1px solid rgba(255,255,255,0.12)',
          padding: '1rem', 
          borderRadius: 'var(--radius-lg)', 
          boxShadow: '0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.15)', 
          minWidth: '280px',
          animation: 'fadeInDown 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <button type="button" onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-primary)', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>‹</button>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select 
                value={getMonth(displayDate)} 
                onChange={(e) => onMonthSelect(Number(e.target.value))}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', outline: 'none', appearance: 'none', textAlign: 'center' }}
              >
                {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, idx) => <option key={m} value={idx} style={{ background: '#1a2235', color: '#fff' }}>{m}</option>)}
              </select>
              <select 
                value={getYear(displayDate)} 
                onChange={(e) => onYearSelect(Number(e.target.value))}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', outline: 'none', appearance: 'none', textAlign: 'center' }}
              >
                {Array.from({length: 11}, (_, i) => getYear(new Date()) - 5 + i).map(y => <option key={y} value={y} style={{ background: '#1a2235', color: '#fff' }}>{y}</option>)}
              </select>
            </div>
            <button type="button" onClick={nextMonth} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-primary)', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>›</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} style={{ fontWeight: 600, paddingBottom: '0.5rem' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
            {days.map((d, idx) => {
              const isSelected = selected && d.toDateString() === selected.toDateString();
              const isCurrentMonth = getMonth(d) === getMonth(displayDate);
              const isToday = d.toDateString() === new Date().toDateString();
              
              const todayEnd = new Date();
              todayEnd.setHours(23, 59, 59, 999);
              const isFuture = d > todayEnd;
              
              return (
                <button 
                  key={idx} 
                  type="button"
                  onClick={() => { if (!isFuture) selectDay(d); }} 
                  style={{ 
                    padding: '8px 0', 
                    borderRadius: '8px', 
                    background: isSelected ? 'var(--primary-color)' : (isToday && !isSelected ? 'rgba(99,102,241,0.1)' : 'transparent'), 
                    color: isSelected ? '#fff' : (isCurrentMonth ? 'var(--text-primary)' : 'rgba(148,163,184,0.3)'), 
                    border: isToday && !isSelected ? '1px solid rgba(99,102,241,0.5)' : '1px solid transparent', 
                    cursor: isFuture ? 'not-allowed' : 'pointer',
                    opacity: isFuture ? 0.3 : 1,
                    fontWeight: isSelected || isToday ? 600 : 400,
                    transition: 'all 0.2s ease',
                    fontSize: '0.85rem'
                  }}
                  onMouseOver={e => { if(!isSelected && !isFuture) e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                  onMouseOut={e => { if(!isSelected && !isFuture) e.currentTarget.style.background = (isToday ? 'rgba(99,102,241,0.1)' : 'transparent') }}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
