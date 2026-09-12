import React, { useState, useEffect } from 'react';
import { Table, Badge, Spinner } from 'react-bootstrap';
import Papa from 'papaparse';
import scheduleData from '../data/schedule.json';
import BoxscoreModal from '../components/BoxscoreModal';
import { slugifyMatchup, parseScoreFromCSV } from '../utils/boxscoreEngine';

// Mirror the same glob patterns used in Recaps.jsx
const csvFiles = import.meta.glob('../data/boxscores/**/*.csv', { query: '?raw', import: 'default' });
const jsonFiles = import.meta.glob('../data/boxscores/**/*.json', { eager: true });

const Schedule = () => {
  const [loading, setLoading] = useState(true);
  const [gameDataMap, setGameDataMap] = useState({});
  const [showBoxscore, setShowBoxscore] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const combinedMap = {};

      // Helper to dynamically pull the week (or playoffs/championships) from the folder path
      const getWeekFromPath = (path) => {
        const lowerPath = path.toLowerCase();
        if (lowerPath.includes('/playoffs/')) return 'Playoffs';
        if (lowerPath.includes('/championships/')) return 'Championships';
        const weekMatch = path.match(/week(\d+)/i);
        return weekMatch ? weekMatch[1] : null;
      };

      // 1. Process JSON boxscores
      for (const path in jsonFiles) {
        const data = jsonFiles[path].default || jsonFiles[path];
        if (data.game) {
          const weekFromPath = getWeekFromPath(path);
          const weekNum = data.week || weekFromPath;

          if (weekNum) {
            // CRITICAL: Use week + matchup as a unique key to allow repeat matchups (like PURPLE vs BLUE)
            const key = `${weekNum}-${slugifyMatchup(data.game)}`;
            combinedMap[key] = { ...data, week: weekNum };
          }
        }
      }

      // 2. Merge CSV score metadata
      for (const path in csvFiles) {
        const rawContent = await csvFiles[path]();
        const results = Papa.parse(rawContent, { skipEmptyLines: true });
        const rows = results.data;

        const matchupLine = rows.find(r => r[0]?.includes('vs.'))?.[0] || '';
        const weekFromPath = getWeekFromPath(path);
        
        // Try to pull from CSV, fallback to path logic
        const weekLine = rows.find(r => r[0]?.toLowerCase().includes('week'))?.[0] || '';
        let weekNum = weekLine.match(/\d+/)?.[0] || weekFromPath;

        // Force string overwrite if the game is in a post-season folder
        if (weekFromPath === 'Playoffs' || weekFromPath === 'Championships') {
          weekNum = weekFromPath;
        }

        if (weekNum && matchupLine) {
          const key = `${weekNum}-${slugifyMatchup(matchupLine)}`;
          if (combinedMap[key]) {
            combinedMap[key].scores = parseScoreFromCSV(rows);
          }
        }
      }

      setGameDataMap(combinedMap);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleOpenBoxscore = (weekNum, matchup) => {
    const key = `${weekNum}-${slugifyMatchup(matchup)}`;
    if (gameDataMap[key]) {
      setSelectedGame(gameDataMap[key]);
      setShowBoxscore(true);
    }
  };

  const hasBoxscore = (weekNum, matchup) => {
    return !!gameDataMap[`${weekNum}-${slugifyMatchup(matchup)}`];
  };

  return (
    <div className="px-3 px-md-5 py-5">
      <style>{`
        .schedule-page-heading {
          font-size: 1.75rem;
          font-weight: 900;
          text-transform: uppercase;
          font-style: italic;
          color: #1a1a1a;
          border-bottom: 4px solid #ff4d4d;
          display: inline-block;
          padding-bottom: 5px;
          margin-bottom: 0.5rem;
          font-family: 'Montserrat', sans-serif;
        }

        .schedule-subtext {
          color: #6c757d;
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 2.5rem;
          display: block;
        }

        .week-card {
          background: #ffffff;
          border: 1px solid #eeeeee !important;
          border-radius: 1.25rem !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
          margin-bottom: 2rem;
        }

        .week-card-header {
          background: #1a1a1a;
          border-bottom: 2px solid #ff4d4d;
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .week-label {
          color: #ff4d4d;
          font-weight: 900;
          font-style: italic;
          text-transform: uppercase;
          font-size: 1.1rem;
          font-family: 'Montserrat', sans-serif;
          margin: 0;
        }

        .week-date-badge {
          background: #ff4d4d !important;
          color: white !important;
          font-weight: 700;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
          padding: 0.4em 0.85em;
          border-radius: 100px;
        }

        .location-bar {
          background: #f8f9fa;
          border-bottom: 1px solid #eeeeee;
          padding: 0.5rem 1.5rem;
          font-size: 0.8rem;
          color: #6c757d;
          font-weight: 600;
        }

        .game-time {
          color: #ff4d4d !important;
          font-weight: 800;
          font-family: 'Montserrat', sans-serif;
        }

        .matchup-name {
          font-weight: 700;
          color: #1a1a1a !important;
        }

        .boxscore-badge {
          background: #ff4d4d !important;
          color: white !important;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.35em 0.75em;
          border-radius: 100px;
          cursor: pointer;
        }

        .status-badge {
          background: transparent !important;
          border: 1px solid #ddd !important;
          color: #6c757d !important;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.35em 0.75em;
          border-radius: 100px;
        }

        .bye-bar {
          padding: 0.75rem 1.5rem;
          background: #fffbf0;
          border-top: 1px solid #eeeeee;
          font-size: 0.82rem;
          color: #6c757d;
        }

        @media (max-width: 576px) {
          .week-card-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .week-date-badge {
            text-align: left;
            margin-top: 0.25rem;
          }
        }
      `}</style>

      <div className="text-center mb-5">
        <h1 className="schedule-page-heading">League Schedule</h1>
        <span className="schedule-subtext">Summer 2026 — Regular Season</span>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="danger" />
        </div>
      ) : (
        scheduleData.map((week) => (
          <div key={week.week} className="week-card">
            <div className="week-card-header">
              <h3 className="week-label">Week: {week.week}</h3>
              <Badge className="week-date-badge">{week.date}</Badge>
            </div>

            <div className="location-bar">📍 {week.location}</div>

            <Table responsive hover className="mb-0">
              <thead>
                <tr>
                  <th style={{ width: '140px' }}>Time</th>
                  <th>Matchup</th>
                  <th className="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {week.games.map((game, idx) => {
                  const available = hasBoxscore(week.week, game.matchup);
                  return (
                    <tr
                      key={idx}
                      onClick={() => available && handleOpenBoxscore(week.week, game.matchup)}
                      style={{ cursor: available ? 'pointer' : 'default' }}
                    >
                      <td className="game-time">{game.time}</td>
                      <td className="matchup-name">{game.matchup}</td>
                      <td className="text-center">
                        {available ? (
                          <Badge className="boxscore-badge">BOXSCORE ▸</Badge>
                        ) : (
                          <Badge className="status-badge">UPCOMING</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>

            {week.bye && (
              <div className="bye-bar">
                <strong>Bye:</strong> {week.bye}
              </div>
            )}
          </div>
        ))
      )}

      <BoxscoreModal
        show={showBoxscore}
        onHide={() => setShowBoxscore(false)}
        gameData={selectedGame}
      />
    </div>
  );
};

export default Schedule;