// src/utils/standingsEngine.js

export const calculateStandings = (gameFiles, rosterData) => {
  const teams = {};

  // 1. Initialize all teams from the roster itself to ensure 0-0 teams appear.
  // Conferences are no longer used this season, so derive the team list
  // directly from players.json instead of rosterData.conferences.
  const teamNames = [...new Set(rosterData.players.map(p => p.team.toUpperCase()))];

  const setup = (name) => {
    teams[name.toUpperCase()] = {
      name: name,
      W: 0, L: 0, PF: 0, PA: 0
    };
  };

  teamNames.forEach(t => setup(t));

  // Create a player-to-team lookup map from players.json
  const playerToTeam = {};
  rosterData.players.forEach(p => {
    playerToTeam[p.first_name + " " + p.last_name] = p.team.toUpperCase();
  });

  // 2. Process Game Files
  Object.values(gameFiles).forEach((file) => {
    const gameData = file.default || file;
    if (!gameData.stats) return;

    const gameScores = {}; 

    // Aggregate points by looking up each player's team
    gameData.stats.forEach(row => {
      const playerName = row["Player Name"];
      const teamName = playerToTeam[playerName];
      
      if (teamName) {
        if (!gameScores[teamName]) gameScores[teamName] = 0;
        gameScores[teamName] += (parseInt(row.Points) || 0);
      }
    });

    const competing = Object.keys(gameScores);
    
    // Determine winner and loser based on aggregated player points
    if (competing.length === 2) {
      const [tA, tB] = competing;
      const sA = gameScores[tA];
      const sB = gameScores[tB];

      if (teams[tA] && teams[tB]) {
        teams[tA].PF += sA; teams[tA].PA += sB;
        teams[tB].PF += sB; teams[tB].PA += sA;

        if (sA > sB) { 
          teams[tA].W += 1; 
          teams[tB].L += 1; 
        } else if (sB > sA) { 
          teams[tB].W += 1; 
          teams[tA].L += 1; 
        }
      }
    }
  });

  return Object.values(teams);
};