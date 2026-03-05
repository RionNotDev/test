import cheerio from "cheerio";

export default async function handler(req, res) {
  const model = req.query.model || "";
  const panelTitle = "HD clear glass";

  try {
    const response = await fetch("https://www.mietubl.com/Compatible/modelsearch/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0"
      },
      body: new URLSearchParams({ model })
    });

    const html = await response.text();

    const $ = cheerio.load(html);

    let groups = [];

    $(".compatible-panel .compatible-models").each((i, panel) => {
      const title = $(panel).find(".clear h3").text().trim().toLowerCase();

      if (title === panelTitle.toLowerCase()) {

        $(panel).find(".data-wrapper .mbox").each((i, box) => {
          let models = [];

          $(box).find("span.model").each((i, el) => {
            const text = $(el).text().trim();
            if (text) models.push(text);
          });

          if (models.length) {
            groups.push(models);
          }
        });

      }
    });

    res.json({
      success: true,
      groups
    });

  } catch (err) {
    res.json({
      success: false,
      error: err.message
    });
  }
}
