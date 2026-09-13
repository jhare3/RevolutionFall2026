import React, { useState, useMemo, useRef, useEffect } from 'react';
import rosterData from '../data/players.json';
import statsHeaders from '../data/stats.json';
import { getAllPlayerStats } from '../data/dataLoader';
import { calculateSeasonStats } from '../utils/statCalculations';

const Stats = () => {
  const [statFilter, setStatFilter] = useState('PPG'); 
  const [sortDirection, setSortDirection] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState('');

  const scrollRef = useRef(null);
  const dragInfo = useRef({ isDown: false, startX: 0, startScrollLeft: 0, moved: false });
  const [scrollState, setScrollState] = useState({ atStart: true, atEnd: true, scrollable: false, thumbWidthPct: 100, thumbLeftPct: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const allGameRows = useMemo(() => getAllPlayerStats(), []);

  const dynamicColumns = useMemo(() => {
    const otherStats = statsHeaders.filter(h => h !== statFilter);
    return [statFilter, ...otherStats];
  }, [statFilter]);

  const uniqueTeams = useMemo(() => {
    const teams = (rosterData.players || []).map(p => p.team).filter(Boolean);
    return [...new Set(teams)].sort();
  }, []);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    const thumbWidthPct = Math.min(100, (clientWidth / scrollWidth) * 100);
    const thumbLeftPct = maxScroll > 0 ? (scrollLeft / maxScroll) * (100 - thumbWidthPct) : 0;
    setScrollState({
      atStart: scrollLeft <= 4,
      atEnd: scrollLeft >= maxScroll - 4,
      scrollable: scrollWidth > clientWidth + 4,
      thumbWidthPct,
      thumbLeftPct
    });
  };

  // Track scroll position for edge fades + hide the hint once the user engages
  const handleScroll = () => {
    updateScrollState();
    if (!hasInteracted) setHasInteracted(true);
  };

  // Recalculate on resize and whenever the visible columns/rows change
  useEffect(() => {
    updateScrollState();
    window.addEventListener('resize', updateScrollState);
    return () => window.removeEventListener('resize', updateScrollState);
  }, [dynamicColumns]);

  // One-time nudge on mount to hint that the table scrolls sideways
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const timer = setTimeout(() => {
      if (el.scrollWidth > el.clientWidth + 4) {
        el.scrollTo({ left: 70, behavior: 'smooth' });
        setTimeout(() => {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        }, 750);
      }
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // Click-and-drag scrolling for mouse/trackpad users
  const handleMouseDown = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    dragInfo.current = { isDown: true, startX: e.pageX, startScrollLeft: el.scrollLeft, moved: false };
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    const el = scrollRef.current;
    if (!el || !dragInfo.current.isDown) return;
    const delta = e.pageX - dragInfo.current.startX;
    if (Math.abs(delta) > 3) dragInfo.current.moved = true;
    el.scrollLeft = dragInfo.current.startScrollLeft - delta;
  };

  const endDrag = () => {
    dragInfo.current.isDown = false;
    setIsDragging(false);
  };

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
        "OReb":         "oreb",
        "DReb":         "dreb",
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

  useEffect(() => {
    updateScrollState();
  }, [sortedPlayers]);

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
      case "OReb": return <span style={primaryText}>{s.oreb || 0}</span>;
      case "DReb": return <span style={primaryText}>{s.dreb || 0}</span>;
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
      <div className="stats-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: 'clamp(16px, 4vw, 24px)' }}>
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

      <div style={tableOuterWrapper}>
        {scrollState.scrollable && (
          <div style={miniScrollTrack}>
            <div style={{ ...miniScrollThumb, width: `${scrollState.thumbWidthPct}%`, left: `${scrollState.thumbLeftPct}%` }} />
          </div>
        )}

        <div
          ref={scrollRef}
          style={{ ...tableWrapper, cursor: isDragging ? 'grabbing' : 'grab' }}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={endDrag}
          onMouseLeave={endDrag}
        >
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

        <div style={{ ...edgeFadeLeft, opacity: !scrollState.scrollable || scrollState.atStart ? 0 : 1 }} />
        <div style={{ ...edgeFadeRight, opacity: !scrollState.scrollable || scrollState.atEnd ? 0 : 1 }} />

        {scrollState.scrollable && !hasInteracted && (
          <div style={scrollHintArrow}>
            <span style={scrollHintDot}>›</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes statsScrollHintBounce {
          0%, 100% { transform: translate(0, -50%); opacity: 0.55; }
          50% { transform: translate(6px, -50%); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// Styles
const pageContainer = { padding: 'clamp(20px, 5vw, 40px) clamp(10px, 3vw, 20px)', backgroundColor: '#fff' };
const titleStyle = { fontWeight: '700', letterSpacing: '-2px', fontSize: 'clamp(1.8rem, 6vw, 2.5rem)', margin: 0 };
const controlsContainer = { display: 'flex', gap: 'clamp(10px, 2.5vw, 15px)', alignItems: 'center', flexWrap: 'wrap' };
const selectStyle = { padding: '9px 14px', fontSize: '14px', borderRadius: '4px', border: '1.5px solid #111', fontWeight: '600', cursor: 'pointer', outline: 'none' };
const inputStyle = { padding: '9px 14px', fontSize: '14px', borderRadius: '4px', border: '1.5px solid #111', outline: 'none' };
const tableOuterWrapper = { position: 'relative' };
const tableWrapper = { 
  overflowX: 'auto', 
  border: '1.5px solid #111', 
  borderRadius: '6px', 
  scrollBehavior: 'smooth', 
  WebkitOverflowScrolling: 'touch', 
  overscrollBehaviorX: 'contain', 
  cursor: 'grab' 
};
const tableMain = { width: '100%', borderCollapse: 'collapse', fontSize: '14px' };
const theadRow = { backgroundColor: '#111', color: '#fff' };
const thStyle = { padding: '16px 12px', textAlign: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: '700', borderRight: '0.75px solid #333' };
const stickyHeader = { ...thStyle, position: 'sticky', left: 0, zIndex: 10, backgroundColor: '#111', textAlign: 'left', paddingLeft: 'clamp(14px, 4vw, 20px)' };
const tdStyle = { padding: '14px 12px', textAlign: 'center', borderRight: '0.75px solid #eee', borderBottom: '0.75px solid #eee' };
const stickyNameCell = { ...tdStyle, position: 'sticky', left: 0, zIndex: 5, backgroundColor: '#fff', textAlign: 'left', paddingLeft: 'clamp(14px, 4vw, 20px)', borderRight: '2.25px solid #111' };
const cellStack = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' };
const primaryText = { fontWeight: '600', color: '#111' };
const pctBadge = { fontSize: '10px', backgroundColor: '#111', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontWeight: '700' };
const rowStyle = { transition: 'background 0.2s' };
const edgeFadeBase = { position: 'absolute', top: 0, bottom: 0, width: '32px', pointerEvents: 'none', transition: 'opacity 0.25s ease', zIndex: 8, borderRadius: '6px' };
const edgeFadeLeft = { ...edgeFadeBase, left: 0, background: 'linear-gradient(to right, rgba(255,255,255,0.95), rgba(255,255,255,0))' };
const edgeFadeRight = { ...edgeFadeBase, right: 0, width: '22px', background: 'linear-gradient(to left, rgba(255,255,255,0.65), rgba(255,255,255,0))' };
const scrollHintArrow = { position: 'absolute', right: '6px', top: '50%', transform: 'translate(0, -50%)', zIndex: 9, pointerEvents: 'none', animation: 'statsScrollHintBounce 2.1s ease-in-out infinite' };
const scrollHintDot = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#ff4d4d', color: '#fff', fontWeight: '700', fontSize: '15px', lineHeight: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.25)' };
const miniScrollTrack = { position: 'relative', width: '100%', height: '2.5px', backgroundColor: '#eee', borderRadius: '999px', marginBottom: '7px', overflow: 'hidden' };
const miniScrollThumb = { position: 'absolute', top: 0, bottom: 0, backgroundColor: '#ff4d4d', borderRadius: '999px', transition: 'left 0.05s linear' };

export default Stats;