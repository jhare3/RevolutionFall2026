// src/utils/statsEngine.js

export const aggregateStats = (playerGames) => {
  if (!playerGames || playerGames.length === 0) return null;

  const clean = (val) => {
    if (typeof val === 'string') return Number(val.replace('%', '')) || 0;
    return Number(val) || 0;
  };

  const totals = playerGames.reduce((acc, game) => {
    return {
      gp: acc.gp + 1,
      "2FGM": acc["2FGM"] + clean(game["2FGM"]),
      "2FGA": acc["2FGA"] + clean(game["2FGA"]),
      "3FGM": acc["3FGM"] + clean(game["3FGM"]),
      "3FGA": acc["3FGA"] + clean(game["3FGA"]),
      "FGM": acc["FGM"] + clean(game["FGM"]),
      "FGA": acc["FGA"] + clean(game["FGA"]),
      "FTM": acc["FTM"] + clean(game["FTM"]),
      "FTA": acc["FTA"] + clean(game["FTA"]),
      "Points": acc["Points"] + clean(game.Points),
      "Assists": acc["Assists"] + clean(game.Assists),
      "Off Reb": acc["Off Reb"] + clean(game["Off Reb"]),
      "Def Reb": acc["Def Reb"] + clean(game["Def Reb"]),
      "Fouls": acc["Fouls"] + clean(game.Fouls),
      "Blocks": acc["Blocks"] + clean(game.Blocks),
      "Deflections": acc["Deflections"] + clean(game.Deflections),
      "Steals": acc["Steals"] + clean(game.Steals),
      "Charge Taken": acc["Charge Taken"] + clean(game["Charge Taken"] || game["Charge  Taken"]),
      "Airball": acc["Airball"] + clean(game.Airball),
    };
  }, { 
    gp: 0, "2FGM": 0, "2FGA": 0, "3FGM": 0, "3FGA": 0, "FGM": 0, "FGA": 0, 
    "FTM": 0, "FTA": 0, "Points": 0, "Assists": 0, "Off Reb": 0, "Def Reb": 0, 
    "Fouls": 0, "Blocks": 0, "Deflections": 0, "Steals": 0, "Charge Taken": 0, "Airball": 0 
  });

  const gp = totals.gp;

  return {
    "GP": gp,
    "Points": Math.round(totals["Points"] / gp),
    "Assists": Math.round(totals["Assists"] / gp),
    "Off Reb": Math.round(totals["Off Reb"] / gp),
    "Def Reb": Math.round(totals["Def Reb"] / gp),
    "REB": Math.round((totals["Off Reb"] + totals["Def Reb"]) / gp),
    "Steals": Math.round(totals["Steals"] / gp),
    "Blocks": Math.round(totals["Blocks"] / gp),
    "Deflections": Math.round(totals["Deflections"] / gp),
    "Fouls": Math.round(totals["Fouls"] / gp),
    "Charge Taken": Math.round(totals["Charge Taken"] / gp),
    "Airball": Math.round(totals["Airball"] / gp),
    "2FGM": Math.round(totals["2FGM"] / gp),
    "2FGA": Math.round(totals["2FGA"] / gp),
    "3FGM": Math.round(totals["3FGM"] / gp),
    "3FGA": Math.round(totals["3FGA"] / gp),
    "FGM": Math.round(totals["FGM"] / gp),
    "FGA": Math.round(totals["FGA"] / gp),
    "FTM": Math.round(totals["FTM"] / gp),
    "FTA": Math.round(totals["FTA"] / gp),
    "2FG%": totals["2FGA"] > 0 ? Math.round((totals["2FGM"] / totals["2FGA"]) * 100) + "%" : "0%",
    "3FG%": totals["3FGA"] > 0 ? Math.round((totals["3FGM"] / totals["3FGA"]) * 100) + "%" : "0%",
    "FG%": totals["FGA"] > 0 ? Math.round((totals["FGM"] / totals["FGA"]) * 100) + "%" : "0%",
    "FT%": totals["FTA"] > 0 ? Math.round((totals["FTM"] / totals["FTA"]) * 100) + "%" : "0%"
  };
};