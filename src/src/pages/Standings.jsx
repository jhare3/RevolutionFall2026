import React, { useMemo, useState } from 'react';
import { calculateStandings } from '../utils/standingsEngine';
import playerConfig from '../data/players.json';

// Dynamically import all boxscore files from the week subfolders
const gameFiles = import.meta.glob('../data/boxscores/**/*.json', { eager: true });

const Standings = () => {
  // State for interactive sorting
  const [sortConfig, setSortConfig] = useState({ key: 'W', direction: 'desc' });

  const standingsData = useMemo(() => {
    // 1. Calculate base stats (W, L, PF, PA) using the standingsEngine logic
    // This uses players.json as the source of truth for team mapping
    const calculatedTeams = calculateStandings(gameFiles, playerConfig);
    
    // 2. Process calculated data for display (Win % and Point Differential)
    let items = calculatedTeams.map(t => {
      const gp = t.W + t.L;
      return {
        ...t,
        PCT: gp > 0 ? (t.W / gp).toFixed(3) : ".000",
        DIFF: t.PF - t.PA
      };
    });

    // 3. Interactive Sort Logic
    items.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'PCT') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      
      // Secondary sort: fall back to DIFF if primary key is tied
      return b.DIFF - a.DIFF;
    });

    return items;
  }, [sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const renderTable = (title, teams) => (
    <div className="mb-5">
      <h2 style={confHeaderStyle}>{title}</h2>
      <div style={tableWrapper}>
        <div style={tableScroll}>
          <table className="table table-hover m-0" style={{ minWidth: '560px' }}>
            <thead style={{ backgroundColor: '#111', color: '#fff' }}>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left' }}>TEAM</th>
                <th style={thStyle} onClick={() => requestSort('W')}>W</th>
                <th style={thStyle} onClick={() => requestSort('L')}>L</th>
                <th style={thStyle} onClick={() => requestSort('PCT')}>PCT</th>
                <th style={thStyle} onClick={() => requestSort('PF')}>PF</th>
                <th style={thStyle} onClick={() => requestSort('PA')}>PA</th>
                <th style={thStyle} onClick={() => requestSort('DIFF')}>DIFF</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.name} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ ...tdStyle, textAlign: 'left', fontWeight: '800' }}>{t.name}</td>
                  <td style={tdStyle}>{t.W}</td>
                  <td style={tdStyle}>{t.L}</td>
                  <td style={tdStyle}>{t.PCT}</td>
                  <td style={tdStyle}>{t.PF}</td>
                  <td style={tdStyle}>{t.PA}</td>
                  <td style={{ 
                    ...tdStyle, 
                    fontWeight: '900', 
                    color: t.DIFF > 0 ? '#28a745' : t.DIFF < 0 ? '#dc3545' : '#222' 
                  }}>
                    {t.DIFF > 0 ? `+${t.DIFF}` : t.DIFF}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container py-5" style={{ fontFamily: 'Inter, sans-serif' }}>
      <h1 className="text-center fw-black mb-5" style={{ letterSpacing: '-2px', fontSize: '3rem' }}>STANDINGS</h1>
      {/* No conference split this season - single combined table */}
      {renderTable('OVERALL', standingsData)}
    </div>
  );
};

// --- STYLES ---
const confHeaderStyle = { fontWeight: '900', color: '#ff4d4d', borderBottom: '4px solid #111', paddingBottom: '8px', marginBottom: '20px' };
const tableWrapper = { borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #eee' };
const tableScroll = { overflowX: 'auto', WebkitOverflowScrolling: 'touch' };
const thStyle = { padding: '15px', textAlign: 'center', fontSize: '12px', fontWeight: '800', cursor: 'pointer' };
const tdStyle = { padding: '15px', textAlign: 'center', verticalAlign: 'middle', fontSize: '14px' };

export default Standings;