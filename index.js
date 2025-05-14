const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");
const cheerio = require("cheerio");

const manifest = require("./manifest.json");

const builder = new addonBuilder(manifest);

// Scraper funkcia
async function searchHellspy(query) {
  const searchUrl = `https://hellspy.to/search/${encodeURIComponent(query)}/`;

  try {
    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const $ = cheerio.load(response.data);
    const results = [];

    $(".file-box").each((i, elem) => {
      const title = $(elem).find(".file-title").text().trim();
      const href = $(elem).find("a.file-image").attr("href");
      const fileIdMatch = href && href.match(/file\/([a-zA-Z0-9]+)/);
      const fileId = fileIdMatch ? fileIdMatch[1] : null;

      if (fileId) {
        results.push({
          title,
          url: `https://hellspy.to/file/download/${fileId}`,
          externalUrl: true
        });
      }
    });

    return results;
  } catch (err) {
    console.error("Chyba pri scrapovaní Hellspy:", err.message);
    return [];
  }
}

// Stream handler pre Stremio
builder.defineStreamHandler(async ({ id }) => {
  const results = await searchHellspy(id);

  const streams = results.map(file => ({
    title: file.title,
    url: file.url,
    externalUrl: true
  }));

  return { streams };
});

exports const module = builder.getInterface();
