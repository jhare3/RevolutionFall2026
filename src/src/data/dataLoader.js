// src/data/dataLoader.js

// Add **/ to recursively find JSON files in weekly subfolders
const rawFiles = import.meta.glob('./boxscores/**/*.json', { eager: true });

export const getAllPlayerStats = () => {
  let allRows = [];

  Object.values(rawFiles).forEach((fileModule) => {
    const gameData = fileModule.default || fileModule;
    
    // Ensure we only grab actual game stats and skip empty files
    if (gameData && gameData.stats) {
      allRows = [...allRows, ...gameData.stats];
    }
  });

  return allRows;
};