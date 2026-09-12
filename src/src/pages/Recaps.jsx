import React, { useState, useMemo, useEffect } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import Papa from 'papaparse';
import BoxscoreModal from '../components/BoxscoreModal';
import { slugifyMatchup, parseScoreFromCSV } from '../utils/boxscoreEngine';

const csvFiles = import.meta.glob('../data/boxscores/**/*.csv', { query: '?raw', import: 'default' });
const jsonFiles = import.meta.glob('../data/boxscores/**/*.json', { eager: true });
const recapFiles = import.meta.glob('../data/recaps/*.json', { eager: true });

const TEAM_COLORS = {
  TAN:    '#d2b48c',
  YELLOW: '#ffc107',
  PURPLE: '#6f42c1',
  BLUE:   '#007bff',
  GRAY:   '#6c757d',
  WHITE:  '#adb5bd',
  BLACK:  '#1a1a1a',
  PINK:   '#e83e8c',
  GREEN:  '#28a745',
  RED:    '#ff4d4d',
  ORANGE: '#fd7e14',
};

const LIGHT_TEAMS = new Set(['YELLOW', 'WHITE', 'TAN']);

const getTeamColor = (name) => {
  const key = name?.toUpperCase().trim().split(' ')[0];
  return TEAM_COLORS[key] || '#1a1a1a';
};

const isLightTeam = (name) => {
  const key = name?.toUpperCase().trim().split(' ')[0];
  return LIGHT_TEAMS.has(key);
};

const TeamPill = ({ name }) => (
  <span style={{
    background: getTeamColor(name),
    color: isLightTeam(name) ? '#1a1a1a' : '#fff',
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 800,
    fontStyle: 'italic',
    fontSize: '0.65rem',
    letterSpacing: '0.06em',
    padding: '3px 11px',
    borderRadius: '100px',
    textTransform: 'uppercase',
    display: 'inline-block',
    lineHeight: 1.7,
    whiteSpace: 'nowrap',
  }}>
    {name}
  </span>
);

const PerformerLine = ({ line }) => {
  const [name, stats] = line.split(/\s*—\s*/);
  if (!stats) return null;
  const statParts = stats.split(',').map(s => s.trim());

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '12px 0',
      borderBottom: '1px solid #f0f0f0',
      textAlign: 'left'
    }}>
      <span style={{
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 800,
        fontSize: '0.82rem',
        color: '#1a1a1a',
        lineHeight: 1.2,
      }}>
        {name.trim()}
      </span>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '6px',
        justifyContent: 'flex-start'
      }}>
        {statParts.map((s, i) => (
          <span key={i} style={{
            background: i === 0 ? '#1a1a1a' : '#f4f4f4',
            color: i === 0 ? '#fff' : '#444',
            fontSize: '0.65rem',
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            letterSpacing: '0.02em',
            padding: '3px 10px',
            borderRadius: '4px',
            whiteSpace: 'nowrap'
          }}>{s}</span>
        ))}
      </div>
    </div>
  );
};

const PerformersPanel = ({ performers }) => {
  if (!performers || Object.keys(performers).length === 0) return null;
  const teams = Object.keys(performers);

  return (
    <Row className="g-3 mt-2">
      {teams.map((team) => {
        const lines = performers[team].split(';').map(l => l.trim()).filter(Boolean);
        return (
          <Col key={team} xs={12} md={6}>
            <div style={{
              background: '#fafafa',
              border: '1px solid #eeeeee',
              borderTop: `4px solid ${getTeamColor(team)}`,
              borderRadius: '10px',
              padding: '16px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <TeamPill name={team} />
                <span style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.6rem',
                  letterSpacing: '0.12em',
                  color: '#888',
                  textTransform: 'uppercase',
                }}>Top Performers</span>
              </div>
              {lines.map((line, i) => <PerformerLine key={i} line={line} />)}
            </div>
          </Col>
        );
      })}
    </Row>
  );
};

const GameCard = ({ game, onOpenBoxscore, gameDataMap }) => {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const matchupClean = game.matchup.replace(/^Game \d+:\s*/i, '').trim();
  const gameLabel = game.matchup.match(/^Game \d+/i)?.[0]?.toUpperCase() || 'GAME';
  const teams = matchupClean.split(/\s+vs\.?\s+/i).map(t => t.trim());
  const hasBoxscore = !!gameDataMap[slugifyMatchup(matchupClean)];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: '0.75rem',
        border: expanded ? '2px solid #1a1a1a' : hovered ? '2px solid #ff4d4d' : '2px solid #e0e0e0',
        overflow: 'hidden',
        background: '#fff',
        transition: 'all 0.2s ease',
        boxShadow: hovered && !expanded ? '0 6px 20px rgba(255,77,77,0.12)' : expanded ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.05)',
        transform: hovered && !expanded ? 'translateY(-2px)' : 'none',
      }}
    >
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          cursor: 'pointer',
          background: expanded ? '#f8f9fa' : hovered ? '#fff9f9' : '#fff',
          borderBottom: expanded ? '2px solid #eeeeee' : 'none',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 900,
            fontSize: '0.58rem',
            letterSpacing: '0.2em',
            color: '#ff4d4d',
            textTransform: 'uppercase',
          }}>{gameLabel}</span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {teams.map((t, i) => (
              <React.Fragment key={i}>
                <TeamPill name={t} />
                {i < teams.length - 1 && (
                  <span style={{
                    fontFamily: "'Montserrat', sans-serif",
                    fontWeight: 900,
                    fontStyle: 'italic',
                    fontSize: '0.6rem',
                    color: '#ccc',
                  }}>VS</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: '0.6rem',
            letterSpacing: '0.08em',
            color: expanded ? '#1a1a1a' : '#aaa',
            textTransform: 'uppercase',
          }}>{expanded ? 'Close' : 'Read Recap'}</span>
          <span style={{
            color: expanded ? '#1a1a1a' : '#bbb',
            fontSize: '0.75rem',
            transform: expanded ? 'rotate(180deg)' : 'none',
            display: 'inline-block',
            transition: 'transform 0.2s'
          }}>▾</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '20px 18px 22px', textAlign: 'left' }}>
          <p style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '0.92rem',
            lineHeight: 1.75,
            color: '#333',
            margin: '0 0 20px 0',
            textAlign: 'left'
          }}>{game.text}</p>

          <PerformersPanel performers={game.performers} />

          {hasBoxscore && (
            <div style={{ marginTop: '22px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenBoxscore(matchupClean);
                }}
                className="btn btn-primary"
                style={{ fontSize: '0.72rem', padding: '8px 24px' }}
              >
                Full Boxscore →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SponsorBlock = ({ sponsors, closing }) => {
  if (!sponsors?.length && !closing) return null;

  return (
    <div style={{
      marginTop: '32px',
      border: '1px solid #eeeeee',
      borderTop: '4px solid #1a1a1a',
      borderRadius: '0.75rem',
      overflow: 'hidden',
      background: '#fafafa',
      textAlign: 'left'
    }}>
      <div style={{
        background: '#1a1a1a',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <span style={{ color: '#ff4d4d', fontWeight: 900 }}>★</span>
        <span style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 900,
          fontStyle: 'italic',
          fontSize: '0.65rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#fff',
        }}>A Word From Our Sponsors</span>
      </div>

      <div style={{ padding: '20px 20px 8px' }}>
        {sponsors?.map((s, i) => (
          <div key={i} style={{
            marginBottom: '20px',
            paddingBottom: '20px',
            borderBottom: i < sponsors.length - 1 ? '1px solid #eeeeee' : 'none',
          }}>
            <div style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: '0.85rem',
              color: '#1a1a1a',
              marginBottom: '6px',
              textTransform: 'uppercase',
            }}>{s.name}</div>
            <p style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: '0.82rem',
              color: '#555',
              lineHeight: 1.7,
              margin: 0,
            }}>{s.message}</p>
            {s.quote && (
              <blockquote style={{
                margin: '12px 0 8px',
                padding: '10px 16px',
                borderLeft: '3px solid #ff4d4d',
                background: '#fff',
                borderRadius: '0 6px 6px 0',
              }}>
                <p style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontStyle: 'italic',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  color: '#333',
                  margin: 0,
                  lineHeight: 1.7,
                }}>"{s.quote}"</p>
              </blockquote>
            )}
            {s.url && (
              <p style={{
                fontFamily: "'Montserrat', sans-serif",
                fontSize: '0.75rem',
                color: '#888',
                margin: '6px 0 0',
              }}>
                Learn more about Warden's Wisdom and begin your mindfulness journey at:{' '}
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#ff4d4d',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                >{s.urlLabel || s.url}</a>.
              </p>
            )}
          </div>
        ))}
        {closing && (
          <p style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontStyle: 'italic',
            fontSize: '0.85rem',
            color: '#1a1a1a',
            margin: '8px 0 20px',
          }}>{closing}</p>
        )}
      </div>
    </div>
  );
};

const WeekSection = ({ recap, gameDataMap, onOpenBoxscore, defaultOpen }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ marginBottom: '60px', textAlign: 'left' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
          cursor: 'pointer',
          paddingBottom: '16px',
          borderBottom: '3px solid #1a1a1a',
          marginBottom: '24px',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span className="week-badge">WEEK {recap.week}</span>
          <div>
            <div style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 900,
              fontStyle: 'italic',
              fontSize: '1.35rem',
              color: '#1a1a1a',
              textTransform: 'uppercase',
              lineHeight: 1.1,
              letterSpacing: '-0.02em'
            }}>{recap.title}</div>
            <div style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600,
              fontSize: '0.7rem',
              color: '#999',
              marginTop: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>{recap.date}</div>
          </div>
        </div>
        <span style={{
          color: '#bbb',
          fontSize: '1rem',
          transform: open ? 'rotate(180deg)' : 'none',
          display: 'inline-block',
          transition: 'transform 0.2s'
        }}>▾</span>
      </div>

      {open && (
        <>
          {recap.content && (
            <p style={{
              fontFamily: "'Montserrat', sans-serif",
              fontStyle: 'italic',
              fontWeight: 500,
              fontSize: '1rem',
              lineHeight: 1.75,
              color: '#444',
              textAlign: 'left',
              marginBottom: '28px',
              paddingBottom: '24px',
              borderBottom: '1px solid #eeeeee',
            }}>{recap.content}</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recap.games?.map((game, i) => (
              <GameCard
                key={i}
                game={game}
                onOpenBoxscore={onOpenBoxscore}
                gameDataMap={gameDataMap}
              />
            ))}
          </div>

          <SponsorBlock sponsors={recap.sponsors} closing={recap.closing} />
        </>
      )}
    </div>
  );
};

const Recaps = () => {
  const [loading, setLoading] = useState(true);
  const [gameDataMap, setGameDataMap] = useState({});
  const [showBoxscore, setShowBoxscore] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const combinedMap = {};
      for (const path in jsonFiles) {
        const data = jsonFiles[path].default || jsonFiles[path];
        if (data.game) {
          const key = slugifyMatchup(data.game);
          combinedMap[key] = { ...data };
        }
      }
      for (const path in csvFiles) {
        const rawContent = await csvFiles[path]();
        const results = Papa.parse(rawContent, { skipEmptyLines: true });
        const rows = results.data;
        const matchupLine = rows.find(r => r[0]?.includes('vs.'))?.[0] || '';
        const key = slugifyMatchup(matchupLine);
        if (combinedMap[key]) {
          combinedMap[key].scores = parseScoreFromCSV(rows);
        }
      }
      setGameDataMap(combinedMap);
      setLoading(false);
    };
    loadData();
  }, []);

  const allRecaps = useMemo(() => {
    return Object.values(recapFiles)
      .map(file => file.default || file)
      .sort((a, b) => b.week - a.week);
  }, []);

  const handleOpenBoxscore = (matchup) => {
    const key = slugifyMatchup(matchup);
    if (gameDataMap[key]) {
      setSelectedGame(gameDataMap[key]);
      setShowBoxscore(true);
    }
  };

  if (loading) return (
    <div className="text-center py-5">
      <Spinner animation="border" variant="danger" />
    </div>
  );

  return (
    <div className="px-3 px-md-5 py-5" style={{ textAlign: 'left' }}>
      <div className="mb-5" style={{ textAlign: 'left' }}>
        <h1 className="rosters-heading" style={{ textAlign: 'left', margin: '0', fontSize: '2.5rem' }}>Game Recaps</h1>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {allRecaps.map((recap, idx) => (
          <WeekSection
            key={idx}
            recap={recap}
            gameDataMap={gameDataMap}
            onOpenBoxscore={handleOpenBoxscore}
            defaultOpen={idx === 0}
          />
        ))}
      </div>

      <BoxscoreModal
        show={showBoxscore}
        onHide={() => setShowBoxscore(false)}
        gameData={selectedGame}
      />
    </div>
  );
};

export default Recaps;