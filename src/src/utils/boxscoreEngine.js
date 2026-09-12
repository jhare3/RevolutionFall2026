/**
 * Standardizes matchup strings (e.g., "Black vs. Pink" -> "BLACKVSPINK") 
 * to ensure keys match across JSON, CSV, and Schedule data.
 */
export const slugifyMatchup = (str) => {
  if (!str) return "";
  return str.toUpperCase().replace(/[\s.]+/g, '');
};

/**
 * Extracts scores from the CSV structure dynamically to handle Overtime.
 * This ensures 'final' is always pulled from the correct column.
 */
export const parseScoreFromCSV = (csvRows) => {
  // Finds the summary table header row (e.g., ["", "1", "2", "Total"] or ["", "1", "2", "OT1", "Total"])
  const headerIndex = csvRows.findIndex(r => r.includes('1') && r.includes('2') && r.includes('Total'));
  if (headerIndex === -1) return null;

  const header = csvRows[headerIndex];
  const team1Row = csvRows[headerIndex + 1];
  const team2Row = csvRows[headerIndex + 2];

  if (!team1Row || !team2Row) return null;

  // Dynamically find indices to prevent OT from shifting the 'Total' column
  const idx1 = header.indexOf('1');
  const idx2 = header.indexOf('2');
  const idxOT = header.indexOf('OT1');
  const idxTotal = header.indexOf('Total');

  return {
    team1: { 
      name: team1Row[0], 
      half1: team1Row[idx1], 
      half2: team1Row[idx2], 
      OT1: idxOT !== -1 ? team1Row[idxOT] : null,
      final: team1Row[idxTotal] 
    },
    team2: { 
      name: team2Row[0], 
      half1: team2Row[idx1], 
      half2: team2Row[idx2], 
      OT1: idxOT !== -1 ? team2Row[idxOT] : null,
      final: team2Row[idxTotal] 
    }
  };
};

/**
 * Processes game data to ensure consistency between JSON and CSV sources.
 */
export const processGameData = (gameData) => {
  if (!gameData || !gameData.scores) return gameData;

  const { team1, team2 } = gameData.scores;

  return {
    ...gameData,
    processedScores: {
      team1: {
        ...team1,
        // Ensure final score is explicitly preserved even if OT1 is present
        displayFinal: team1.final || team1.Total,
        hasOvertime: !!(team1.OT1 || team1.OT)
      },
      team2: {
        ...team2,
        displayFinal: team2.final || team2.Total,
        hasOvertime: !!(team2.OT1 || team2.OT)
      }
    }
  };
};