import React, { useState, useMemo } from 'react';
import rosterData from '../data/players.json';
import statsHeaders from '../data/stats.json';
import { getAllPlayerStats } from '../data/dataLoader';
import { calculateSeasonStats } from '../utils/statCalculations';

const Stats = () => {
  const [statFilter, setStatFilter] = useState('PPG'); 
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  const allGameRows = useMemo(() => getAllPlayerStats(), []);

  const dynamicColumns = useMemo(() => {
    const otherStats = statsHeaders.filter(h => h !== statFilter);
    return [statFilter, ...otherStats];
  }, [statFilter]);

  const processedPlayers = useMemo(() => {
    return (rosterData.players || []).map(player => {
      const fullName = `${player.first_name} ${player.last_name}`.trim();
      const playerGames = allGameRows.filter(row => 
        row['Player Name']?.trim().toUpperCase() === fullName.toUpperCase()
      );
      
      const calculatedStats = calculateSeasonStats(playerGames);

      return {
        ...player,
        fullName,
        stats: calculatedStats || {},
        gp: calculatedStats["Games Played"]
      };
    });
  }, [allGameRows]);

  const sortedPlayers = useMemo(() => {
    let items = [...processedPlayers];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(p => 
        p.fullName.toLowerCase().includes(term) || p.team.toLowerCase().includes(term)
      );
    }

    items.sort((a, b) => {
      const sortMap = { 
        "PPG":          "PPG",
        "Points":       "points",     // Updated to sort by cumulative points
        "Assists":      "assists",    // Updated to sort by cumulative assists
        "REB":          "rebounds",   // Updated to sort by cumulative rebounds
        "2PT":          "twoM",     
        "3PT":          "threePM",
        "FG":           "fgm",      
        "FT":           "ftm",
        "Steals":       "steals",
        "Blocks":       "blocks",
        "Deflections":  "deflections",
        "Fouls":        "fouls",
        "Charge Taken": "charges",
        "Airball":      "airballs",
        "Games Played": "Games Played"
      };
      
      const activeKey = sortMap[statFilter] || statFilter;
      const clean = (v) => {
        if (!v) return 0;
        return parseFloat(String(v).replace('%', ''));
      };
      
      const aVal = clean(a.stats[activeKey]);
      const bVal = clean(b.stats[activeKey]);

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return items;
  }, [processedPlayers, statFilter, sortDirection, searchTerm]);

  const handleSortRequest = (key) => {
    if (statFilter === key) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setStatFilter(key);
      setSortDirection('desc');
    }
  };

  const renderCellContent = (player, header) => {
    const s = player.stats;
    switch(header) {
      case "2PT": return renderStacked(s.twoM, s.twoA, s["2FG%"]);
      case "3PT": return renderStacked(s.threePM, s.threePA, s["3FG%"]);
      case "FG":  return renderStacked(s.fgm, s.fga, s["FG%"]);
      case "FT":  return renderStacked(s.ftm, s.fta, s["FT%"]);
      case "REB": return <span style={primaryText}>{s.rebounds || 0}</span>;
      case "Points": return <span style={primaryText}>{s.points || 0}</span>;
      case "PPG": return <span style={primaryText}>{s.PPG || 0}</span>;
      case "Assists": return <span style={primaryText}>{s.assists || 0}</span>;
      case "Steals": return <span style={primaryText}>{s.steals || 0}</span>;
      case "Blocks": return <span style={primaryText}>{s.blocks || 0}</span>;
      case "Deflections": return <span style={primaryText}>{s.deflections || 0}</span>;
      case "Fouls": return <span style={primaryText}>{s.fouls || 0}</span>;
      case "Charge Taken": return <span style={primaryText}>{s.charges || 0}</span>;
      case "Airball": return <span style={primaryText}>{s.airballs || 0}</span>;
      default: 
        return <span style={primaryText}>{s[header] || 0}</span>;
    }
  };

  const renderStacked = (m, a, p) => (
    <div style={cellStack}>
      <span style={primaryText}>{m || 0}/{a || 0}</span>
      <span style={pctBadge}>{p || '0%'}</span>
    </div>
  );

  return (
    <div style={pageContainer}>
      <div className="stats-header-container">
        <h1 style={titleStyle}>LEAGUE LEADERS</h1>
        <input 
          placeholder="Search Players..." 
          className="stats-search-input"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={tableWrapper}>
        <table style={tableMain}>
          <thead>
            <tr style={theadRow}>
              <th style={stickyHeader}>PLAYER</th>
              {dynamicColumns.map(h => (
                <th 
                  key={h} 
                  onClick={() => handleSortRequest(h)}
                  style={{ ...thStyle, backgroundColor: statFilter === h ? '#ff4d4d' : '#111' }}
                >
                  {h} {statFilter === h ? (sortDirection === 'desc' ? '▼' : '▲') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedPlayers.map(p => (
              <tr key={p.fullName} style={rowStyle}>
                <td style={stickyNameCell}>
                  <div style={{ fontWeight: '900' }}>{p.fullName}</div>
                  <div style={{ fontSize: '10px', color: '#ff4d4d', textTransform: 'uppercase' }}>{p.team}</div>
                </td>
                {dynamicColumns.map(h => (
                  <td key={h} style={{ ...tdStyle, backgroundColor: statFilter === h ? '#fff5f5' : 'transparent' }}>
                    {renderCellContent(p, h)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Styles
const pageContainer = { padding: '40px 20px', backgroundColor: '#fff' };
const titleStyle = { fontWeight: '900', letterSpacing: '-2px', fontSize: '2.5rem' };
const tableWrapper = { overflowX: 'auto', border: '2px solid #111', borderRadius: '4px' };
const tableMain = { width: '100%', borderCollapse: 'collapse', fontSize: '14px' };
const theadRow = { backgroundColor: '#111', color: '#fff' };
const thStyle = { padding: '15px 10px', textAlign: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: '900', borderRight: '1px solid #333' };
const stickyHeader = { ...thStyle, position: 'sticky', left: 0, zIndex: 10, backgroundColor: '#111', textAlign: 'left', paddingLeft: '20px' };
const tdStyle = { padding: '12px 10px', textAlign: 'center', borderRight: '1px solid #eee', borderBottom: '1px solid #eee' };
const stickyNameCell = { ...tdStyle, position: 'sticky', left: 0, zIndex: 5, backgroundColor: '#fff', textAlign: 'left', paddingLeft: '20px', borderRight: '3px solid #111' };
const cellStack = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' };
const primaryText = { fontWeight: '800', color: '#111' };
const pctBadge = { fontSize: '10px', backgroundColor: '#111', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontWeight: '900' };
const rowStyle = { transition: 'background 0.2s' };

export default Stats;