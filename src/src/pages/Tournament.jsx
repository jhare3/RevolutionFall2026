import React, { useState, useEffect } from 'react';
import { Badge, Spinner, Container } from 'react-bootstrap';
import TournamentBoxscoreModal from '../components/TournamentBoxscoreModal';
import bracketData from '../data/tournamentBracket.json';

const tournamentFiles = import.meta.glob('../data/TournamentGames/boxscores/*.json', { eager: true });

const Tournament = () => {
  const [loading, setLoading] = useState(true);
  const [gameDataMap, setGameDataMap] = useState({});
  const [showBoxscore, setShowBoxscore] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    const combinedMap = {};
    for (const path in tournamentFiles) {
      const data = tournamentFiles[path].default || tournamentFiles[path];
      if (data && data.gameId) {
        combinedMap[data.gameId] = data;
      }
    }
    setGameDataMap(combinedMap);
    setLoading(false);
  }, []);

  const handleOpen = (id) => {
    const data = gameDataMap[id];
    if (data) {
      setSelectedGame(data);
      setShowBoxscore(true);
    }
  };

  const getTeamScore = (data, teamKey) => {
    if (!data) return null;
    const teamName = data[teamKey];
    return data.scores?.[teamName]?.Total ?? null;
  };

  return (
    <Container fluid className="py-5 bg-light min-vh-100">
      <div className="text-center mb-5">
        <h1 className="schedule-page-heading">Revolution Tournament</h1>
        <span className="schedule-subtext">Championships, Trophies, and Awards</span>
      </div>

      {/* Optimized Highlights Section for Desktop/Mobile */}
      <div className="highlights-grid-container" style={imageGalleryGrid}>
        <div style={leftStack}>
          <div style={imageWrapper}>
            <img src="/winningTeam.png" alt="Tournament Champions" style={highlightImage} />
            <p style={imageCaption}>2026 TOURNAMENT CHAMPIONS</p>
          </div>
          <div style={imageWrapper}>
            <img src="/bracket.jpeg" alt="Bracket Overview" style={highlightImage} />
            <p style={imageCaption}>BRACKET OVERVIEW</p>
          </div>
        </div>

        <div style={rightSide}>
          <div style={imageWrapper}>
            <img src="/dunk.jpeg" alt="Tournament Highlight" style={highlightImage} />
            <p style={imageCaption}>GAME HIGHLIGHT</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="danger" /></div>
      ) : (
        <div className="bracket-container d-flex justify-content-around overflow-auto">
          {bracketData.rounds.map((round) => (
            <div key={round.name} className="bracket-round d-flex flex-column mx-3" style={{ minWidth: '280px' }}>
              <h5 className="text-center fw-black italic text-uppercase border-bottom border-danger border-3 pb-2 mb-4">
                {round.name}
              </h5>
              {round.games.map((game) => {
                const data = gameDataMap[game.id];
                const teams = game.matchup.split(' vs. ');
                const visitorScore = getTeamScore(data, 'visitors');
                const homeScore = getTeamScore(data, 'home');
                const hasOT = data ? Object.keys(data.scores?.[data.visitors] || {}).some(k => k.startsWith('OT')) : false;

                return (
                  <div
                    key={game.id}
                    className="bracket-game bg-white p-3 my-2 shadow-sm border-start border-5 border-danger"
                    style={{ cursor: data ? 'pointer' : 'default', borderRadius: '8px' }}
                    onClick={() => data && handleOpen(game.id)}
                  >
                    <div className="text-muted small mb-1 fw-bold d-flex justify-content-between align-items-center">
                      <span>{game.time}</span>
                      <div className="d-flex gap-1 align-items-center">
                        {hasOT && <Badge bg="warning" text="dark" style={{ fontSize: '0.55rem' }}>OT</Badge>}
                        {data && <Badge bg="danger" style={{ fontSize: '0.6rem' }}>BOXSCORE</Badge>}
                      </div>
                    </div>
                    <div className="d-flex justify-content-between fw-bold small">
                      <span>{teams[0]}</span>
                      {visitorScore !== null && <span className="text-danger">{visitorScore}</span>}
                    </div>
                    <hr className="my-1" />
                    <div className="d-flex justify-content-between fw-bold small">
                      <span>{teams[1]}</span>
                      {homeScore !== null && <span className="text-danger">{homeScore}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <TournamentBoxscoreModal show={showBoxscore} onHide={() => setShowBoxscore(false)} gameData={selectedGame} />
    </Container>
  );
};

// Layout Styles
const imageGalleryGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
  gap: '30px',
  marginBottom: '60px',
  maxWidth: '1200px',
  margin: '0 auto 60px auto'
};

const leftStack = {
  display: 'flex',
  flexDirection: 'column',
  gap: '30px'
};

const rightSide = {
  display: 'flex',
  alignItems: 'center'
};

const imageWrapper = {
  width: '100%',
  textAlign: 'center'
};

const highlightImage = {
  width: '100%',
  height: 'auto',
  borderRadius: '4px',
  border: '4px solid #111',
  boxShadow: '10px 10px 0px #ff4d4d'
};

const imageCaption = {
  fontWeight: '900',
  marginTop: '12px',
  textTransform: 'uppercase',
  fontSize: '14px',
  letterSpacing: '1px'
};

export default Tournament;