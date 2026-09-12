import React, { useState, useMemo } from 'react';
import rosterData from '../data/players.json';
import statsHeaders from '../data/stats.json';
import { getAllPlayerStats } from '../data/dataLoader';
import { calculateSeasonStats } from '../utils/statCalculations';

const Stats = () => {
  const [statFilter, setStatFilter] = useState('PPG'); 
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  const allGameRows = useMemo(() => getAllPlayerStats(), []);

  const dynamicColumns = useMemo(() => {
    const otherStats = statsHeaders.filter(h => h !== statFilter);
    return [statFilter, ...otherStats];
  }, [statFilter]);

  const uniqueTeams = useMemo(() => {
    const teams = (rosterData.players || []).map(p => p.team).filter(Boolean);
    return [...new Set(teams)].sort();
  }, []);

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

    if (teamFilter) {
      items = items.filter(p => p.team.toLowerCase() === teamFilter.toLowerCase());
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(p => 
        p.fullName.toLowerCase().includes(term) || p.team.toLowerCase().includes(term)
      );
    }

    items.sort((a, b) => {
      const sortMap = { 
        "PPG":          "PPG",
        "Points":       "points",     
        "Assists":      "assists",    
        "REB":          "rebounds",   
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
  }, [processedPlayers, statFilter, sortDirection, searchTerm, teamFilter]);

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
      <div className="stats-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={titleStyle}>LEAGUE LEADERS</h1>
        
        <div style={controlsContainer}>
          <select 
            style={selectStyle}
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value="">All Teams</option>
            {uniqueTeams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>

          <input 
            placeholder="Search Players..." 
            className="stats-search-input"
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
        </div>
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
                  <div style={{ fontWeight: '700' }}>{p.fullName}</div>
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
const titleStyle = { fontWeight: '700', letterSpacing: '-2px', fontSize: '2.5rem', margin: 0 };
const controlsContainer = { display: 'flex', gap: '15px', alignItems: 'center' };
const selectStyle = { padding: '8px 12px', fontSize: '14px', borderRadius: '4px', border: '1.5px solid #111', fontWeight: '600', cursor: 'pointer', outline: 'none' };
const inputStyle = { padding: '8px 12px', fontSize: '14px', borderRadius: '4px', border: '1.5px solid #111', outline: 'none' };
const tableWrapper = { overflowX: 'auto', border: '1.5px solid #111', borderRadius: '4px' };
const tableMain = { width: '100%', borderCollapse: 'collapse', fontSize: '14px' };
const theadRow = { backgroundColor: '#111', color: '#fff' };
const thStyle = { padding: '15px 10px', textAlign: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: '700', borderRight: '0.75px solid #333' };
const stickyHeader = { ...thStyle, position: 'sticky', left: 0, zIndex: 10, backgroundColor: '#111', textAlign: 'left', paddingLeft: '20px' };
const tdStyle = { padding: '12px 10px', textAlign: 'center', borderRight: '0.75px solid #eee', borderBottom: '0.75px solid #eee' };
const stickyNameCell = { ...tdStyle, position: 'sticky', left: 0, zIndex: 5, backgroundColor: '#fff', textAlign: 'left', paddingLeft: '20px', borderRight: '2.25px solid #111' };
const cellStack = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' };
const primaryText = { fontWeight: '600', color: '#111' };
const pctBadge = { fontSize: '10px', backgroundColor: '#111', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontWeight: '700' };
const rowStyle = { transition: 'background 0.2s' };

export default Stats;