const notice = (msg) => new Notice(msg, 5000);
const log = (msg) => console.log(msg);

const API_KEY_OPTION = "Discogs API Key";
const API_SECRET_OPTION = "Discogs API Secret";
const API_URL = "https://www.discogs.com/";

module.exports = {
  entry: start,
  settings: {
    name: "Music Script",
    author: "Tyler Bouknight",
    options: {
      [API_KEY_OPTION]: {
        type: "text",
        defaultValue: "",
        placeholder: "Discogs API Key",
      },
      [API_SECRET_OPTION]: {
        type: "text",
        defaultValue: "",
        placeholder: "Discogs API Secret",
      },
    },
  },
};

let QuickAdd;
let Settings;

async function start(params, settings) {
  QuickAdd = params;
  Settings = settings;

  const query = await QuickAdd.quickAddApi.inputPrompt(
    "Enter artist or album name: "
  );
  if (!query) {
    notice("No query entered.");
    throw new Error("No query entered.");
  }

  const results = await getByQuery(query);
  const choice = await QuickAdd.quickAddApi.suggester(
    results.map(formatTitleForSuggestion),
    results
  );
  if (!choice) {
    notice("No choice selected.");
    throw new Error("No choice selected.");
  }

  QuickAdd.variables = {
    ...choice,
    title: choice.title,
    fileName: replaceIllegalCharacters(choice.albumName),
    artistName: linkifyList(choice.artistName.split(",")),
    genre: linkifyList(choice.genre),
    style: linkifyList(choice.style),
  };

  console.log(QuickAdd.variables);
}

function formatTitleForSuggestion(result) {
  return `${result.title} (${result.year})`;
}

function linkifyList(list) {
  // Trim whitespace and ensure the array is filtered for non-empty entries
  list = list.map(item => item.trim()).filter(item => item !== "");

  if (list.length === 0) return "";
  if (list.length === 1) return `[[${list[0]}]]`;  // Properly format single entries

  // Format multiple entries as a bulleted list with links
  return list.map(item => `- [[${item}]]`).join("\n");
}

function replaceIllegalCharacters(string) {
  return string.replace(/[\\,#%&\{\}\/*<>?$\'\":@]*/g, "");
}


async function getByQuery(query) {
  const url = `https://api.discogs.com/database/search?q=${query}&key=${Settings[API_KEY_OPTION]}&secret=${Settings[API_SECRET_OPTION]}`;

  const headers = {
    "User-Agent": "Discogs_Obsidian/1.0",
  };
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorMessage = `Failed to fetch search results: ${response.status} ${response.statusText}`;
    notice(errorMessage);
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const results = data.results;

  // Add any other properties you need from the results
  return results.map((result) => {
     const [artistName, albumName] = result.title.split(' - ');
    return {
    artistName,
    albumName,
    title: result.title,
    year: result.year,
    country: result.country,
    cover_image: result.cover_image,
    type: result.type,
    genre: result.genre,
    style: result.style,
    label: result.label,
    artist_id: result.artist_id,
 
    };
  });
}
