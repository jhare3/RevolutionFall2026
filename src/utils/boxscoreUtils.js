import playersData from '../data/players.json';

export const getPlayerTeam = (playerName) => {
  const player = playersData.players.find(
    p => `${p.first_name} ${p.last_name}`.toLowerCase() === playerName.toLowerCase()
  );
  return player ? player.team : 'Unknown';
};

export const groupStatsByTeam = (stats) => {
  return stats.reduce((acc, stat) => {
    // Skip headers and "Totals" rows
    if (!stat["Player Name"] || stat["Player Name"] === "Player Name" || stat["Player Name"] === "Totals") {
      return acc;
    }
    
    const team = getPlayerTeam(stat["Player Name"]);
    if (!acc[team]) acc[team] = [];
    acc[team].push(stat);
    return acc;
  }, {});
};