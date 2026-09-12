// src/utils/statCalculations.js

/**
 * Normalizes raw JSON stats into calculated averages and totals.
 */
export const calculateSeasonStats = (playerGames) => {
  let gamesPlayed = 0;

  const totals = {
    points: 0,
    assists: 0,
    rebounds: 0,
    steals: 0,
    blocks: 0,
    deflections: 0,
    fouls: 0,
    charges: 0,
    airballs: 0,
    fgm: 0,        // Total Field Goals Made (2PT + 3PT)
    fga: 0,        // Total Field Goals Attempted (2PT + 3PT)
    twoM: 0,       // 2PT Makes only
    twoA: 0,       // 2PT Attempts only
    threePM: 0,
    threePA: 0,
    ftm: 0,
    fta: 0
  };

  playerGames.forEach(game => {
    // GATEKEEPER: Check if they actually participated
    const hasStats = 
      Number(game.FGA || 0) > 0 || 
      Number(game.FTA || 0) > 0 || 
      Number(game.Assists || 0) > 0 || 
      (Number(game["Off Reb"] || 0) + Number(game["Def Reb"] || 0)) > 0 ||
      Number(game.Steals || 0) > 0 ||
      Number(game.Blocks || 0) > 0 ||
      Number(game.Fouls || 0) > 0;

    if (hasStats) {
      gamesPlayed += 1;
      
      // Totals
      totals.points += Number(game.Points || 0);
      totals.assists += Number(game.Assists || 0);
      
      const offensive = Number(game["Off Reb"] || 0);
      const defensive = Number(game["Def Reb"] || 0);
      totals.rebounds += (offensive + defensive);

      totals.steals += Number(game.Steals || 0);
      totals.blocks += Number(game.Blocks || 0);
      totals.deflections += Number(game.Deflections || 0);
      totals.fouls += Number(game.Fouls || 0);
      totals.charges += Number(game["Charge Taken"] || 0);
      totals.airballs += Number(game.Airball || 0);
      
      const twoM = Number(game["2FGM"] || 0);
      const twoA = Number(game["2FGA"] || 0);
      const threeM = Number(game["3FGM"] || 0);
      const threeA = Number(game["3FGA"] || 0);

      totals.twoM += twoM;
      totals.twoA += twoA;
      totals.fgm += (twoM + threeM);   // Combined 2PT + 3PT
      totals.fga += (twoA + threeA);
      totals.threePM += threeM;
      totals.threePA += threeA;
      totals.ftm += Number(game.FTM || 0);
      totals.fta += Number(game.FTA || 0);
    }
  });

  // Calculate Averages
  const ppg = gamesPlayed > 0 ? (totals.points / gamesPlayed).toFixed(1) : "0.0";
  const apg = gamesPlayed > 0 ? (totals.assists / gamesPlayed).toFixed(1) : "0.0";
  const rpg = gamesPlayed > 0 ? (totals.rebounds / gamesPlayed).toFixed(1) : "0.0";

  return {
    ...totals,
    "PPG": ppg,
    "APG": apg,
    "RPG": rpg,
    "Games Played": gamesPlayed,
    "FG%":  totals.fga > 0    ? Math.round((totals.fgm    / totals.fga)    * 100) + "%" : "0%",
    "2FG%": totals.twoA > 0   ? Math.round((totals.twoM   / totals.twoA)   * 100) + "%" : "0%",
    "3FG%": totals.threePA > 0 ? Math.round((totals.threePM / totals.threePA) * 100) + "%" : "0%",
    "FT%":  totals.fta > 0    ? Math.round((totals.ftm    / totals.fta)    * 100) + "%" : "0%"
  };
};