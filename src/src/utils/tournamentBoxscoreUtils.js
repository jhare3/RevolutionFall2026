/**
 * Normalizes tournament JSON data for use with a generic BoxscoreModal
 * that expects a single flat 'stats' array.
 *
 * NOTE: TournamentBoxscoreModal reads visitor_stats and home_stats directly
 * and does NOT need this utility. Use normalizeTournamentData only if passing
 * tournament data to the shared/generic BoxscoreModal component.
 */
export const normalizeTournamentData = (rawData) => {
  if (!rawData) return null;

  const visitors = rawData.visitors;
  const home = rawData.home;

  // Combine both stat arrays into one flat array for generic modal grouping
  const combinedStats = [
    ...(rawData.visitor_stats || []),
    ...(rawData.home_stats || [])
  ];

  return {
    ...rawData,
    stats: combinedStats,
    // Map scores to the team1/team2 structure expected by the generic BoxscoreModal
    scores: {
      team1: {
        name: visitors,
        final: rawData.scores?.[visitors]?.Total || 0,
        half1: rawData.scores?.[visitors]?.Q1 || 0,
        half2: rawData.scores?.[visitors]?.Q2 || 0
      },
      team2: {
        name: home,
        final: rawData.scores?.[home]?.Total || 0,
        half1: rawData.scores?.[home]?.Q1 || 0,
        half2: rawData.scores?.[home]?.Q2 || 0
      }
    }
  };
};

/**
 * Groups tournament player stats by team name.
 * Returns an object keyed by team name, with player arrays as values.
 *
 * Usage:
 *   const groups = groupTournamentStats(gameData);
 *   // groups["Revolution"] => [...players]
 *   // groups["Rolling Js"] => [...players]
 */
export const groupTournamentStats = (gameData) => {
  const visitorName = gameData.visitors;
  const homeName = gameData.home;

  return {
    [visitorName]: gameData.visitor_stats || [],
    [homeName]: gameData.home_stats || []
  };
};