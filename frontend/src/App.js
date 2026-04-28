import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function SignalCard({ signal }) {
  const bg = signal.clear === null ? '#000000'
    : signal.clear ? '#000000' : '#000000';
  const border = signal.clear === null ? '#ccc'
    : signal.clear ? '#639922' : '#e24b4a';
  const badge = signal.clear === null ? '#888'
    : signal.clear ? '#3b6d11' : '#a32d2d';
  const label = signal.clear === null ? 'LOADING'
    : signal.clear ? 'CLEAR' : 'CAUTION';

  return (
    <div style={{
      background: bg,
      border: `1.5px solid ${border}`,
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {signal.name}
      </div>
      <div style={{ fontSize: 28, fontWeight: 500, color: '#1a1a1a' }}>
        {signal.value}
      </div>
      <div style={{ fontSize: 13, color: '#444' }}>
        {signal.description}
      </div>
      <div style={{
        marginTop: 4,
        display: 'inline-block',
        fontSize: 11,
        fontWeight: 600,
        color: badge,
        background: 'white',
        border: `1px solid ${border}`,
        borderRadius: 6,
        padding: '2px 8px',
        alignSelf: 'flex-start',
      }}>
        {label}
      </div>
    </div>
  );
}

function SectorBar({ sector, max }) {
  const pct = sector.change;
  const color = pct >= 0 ? '#639922' : '#e24b4a';
  const barWidth = Math.abs(pct) / Math.abs(max) * 120;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
      <div style={{ width: 180, color: '#333' }}>{sector.name}</div>
      <div style={{
        width: barWidth,
        height: 10,
        background: color,
        borderRadius: 4,
        minWidth: 2,
      }} />
      <div style={{ color, fontWeight: 500 }}>
        {pct >= 0 ? '+' : ''}{parseFloat(pct).toFixed(2)}%
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:3001/api/signals')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not connect to server. Make sure node server.js is running.');
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#666' }}>
      Fetching market data...
    </div>
  );

  if (error) return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', color: '#a32d2d' }}>
      {error}
    </div>
  );

  const signals = data.signals;
  const clearCount = signals.filter(s => s.clear).length;
  const total = signals.length;
  const sectorSignal = signals.find(s => s.name === 'Leading Sector');

  const overallColor = clearCount >= 3 ? '#3b6d11' : clearCount === 2 ? '#854f0b' : '#a32d2d';
  const overallBg = clearCount >= 3 ? '#eaf3de' : clearCount === 2 ? '#faeeda' : '#fcebeb';
  const overallLabel = clearCount >= 3 ? 'BUY CONDITIONS' : clearCount === 2 ? 'WAIT' : 'CAUTION';

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0, letterSpacing: '0.04em' }}>
          Market Conditions Tracker
        </h1>
        <div style={{ fontSize: 12, color: '#888' }}>
          {new Date(data.timestamp).toLocaleString()}
        </div>
      </div>

      {/* Score banner */}
      <div style={{
        background: overallBg,
        border: `1.5px solid ${overallColor}`,
        borderRadius: 12,
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        marginBottom: 24,
      }}>
        <div>
          <div style={{ fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Composite signal
          </div>
          <div style={{ fontSize: 32, fontWeight: 500, color: '#1a1a1a' }}>
            {clearCount} / {total}
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', gap: 6 }}>
          {signals.map((s, i) => (
            <div key={i} style={{
              flex: 1, height: 8, borderRadius: 4,
              background: s.clear ? '#639922' : '#e0ddd8',
            }} />
          ))}
        </div>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: overallColor,
          background: 'white',
          border: `1.5px solid ${overallColor}`,
          borderRadius: 8,
          padding: '6px 14px',
        }}>
          {overallLabel}
        </div>
      </div>

      {/* Signal cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 28,
      }}>
        {signals.map((s, i) => <SignalCard key={i} signal={s} />)}
      </div>

      {/* Sector bars */}
      {sectorSignal?.sectors && (
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', marginBottom: 12 }}>
            Sector relative performance (today)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sectorSignal.sectors.map((s, i) => (
              <SectorBar key={i} sector={s} max={Math.max(...sectorSignal.sectors.map(x => Math.abs(x.change)))} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}