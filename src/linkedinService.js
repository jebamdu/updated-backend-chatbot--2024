

import puppeteer from "puppeteer";
class linkedinApi {
  async linnkedinService(params) {
    console.log(params)
    let parameters = ''

    if (params.title) {
      parameters = params.title + '-jobs'
    }
    if (params.level) {
      parameters = parameters + '-' + params.level + '-level'
    }
    if (params.location) {
      parameters = parameters + '-' + params.location
    }
    try {
      return (async () => {
        const browser = await puppeteer.launch({
          executablePath: process.env.CHROME_EXECUTABLE
        }
          //   {
          //     ignoreHTTPSErrors: true,
          //     headless:false,
          //     args: [
          //         `--proxy-server=http://${process.env.PROXY_SERVER}:${process.env.PROXY_SERVER_PORT}`,
          //         '--ignore-certificate-errors'
          //     ]
          // }
        );
        const page = await browser.newPage();
        // await page.authenticate({
        //   username: process.env.PROXY_USERNAME,
        //   password: process.env.PROXY_PASSWORD,
        // });
        try {

          // console.log("process.env",process.env);

          await page.goto(
            "https://www.linkedin.com",
            { waitUntil: "networkidle2" }
          );

          (await page.waitForSelector("body > nav > ul > li:nth-child(4) > a")).click();

          await (await page.waitForSelector("body > div.base-serp-page > header > nav > section > button")).click()

          // let searchBar = await page.waitForSelector("#job-search-bar-keywords");
          // console.log(searchBar, "searchbar")
          // await searchBar.type(params.title+" in "+params.location, { delay: 100 });
          // let searchLocation = await page.waitForSelector("#job-search-bar-location");
          // await searchLocation.focus();

          // await page.keyboard.down("ControlLeft");
          // await page.keyboard.down("Delete");
          // await page.keyboard.up('Delete');
          // await page.keyboard.down("Backspace");
          // await page.keyboard.up('Backspace');
          // await page.keyboard.up('ControlLeft');

          // await searchLocation.type(params.location, { delay: 150 });
          // await searchBar.press("Enter");


          console.log("Current page URL:", page.url());
          let pageurl = new URL(page.url());
          pageurl.searchParams.set("keywords", params.title);
          pageurl.searchParams.set("location", params.location);

          console.log("redirect to ", pageurl)
          await page.goto(pageurl);


          let basecard = await page.waitForSelector("div.base-card");
          console.log(basecard, "basecard")
          const jobs = await page.evaluate(() => {
            const jobCards = document.querySelectorAll("div.base-card");
            const totalJobs = document.querySelector("#main-content > div > h1 > span.results-context-header__job-count").innerText;
            // Iterate over each job card and extract details
            const jobsArray = Array.from(jobCards).map((card) => {
              const role =
                card.querySelector("h3.base-search-card__title")?.innerText.trim() ||
                null;
              const companyName =
                card
                  .querySelector("h4.base-search-card__subtitle")
                  ?.innerText.trim() || null;
              const location =
                card
                  .querySelector("span.job-search-card__location")
                  ?.innerText.trim() || null;


              const companyImgTag = card.querySelector('img.artdeco-entity-image')
              const companyImage = companyImgTag?.getAttribute('src') || companyImgTag?.getAttribute('data-delayed-url') || null
              if (companyImage == null) {
                const companyImage = card.querySelector('img.artdeco-entity-image')?.getAttribute('data-delayed-url') || null;
              }
              const jobId = card?.getAttribute('data-entity-urn')?.split(':')?.pop(); // Extract the job ID
              const applyUrl = card?.querySelector('a.base-card__full-link')?.href;
              const postedDate = card
                .querySelector("time.job-search-card__listdate")?.getAttribute('datetime') || null

              const jobLink =
                card.querySelector("a.base-card__full-link")?.href || null;
              const activelyHiring =
                card.querySelector(".job-posting-benefits__text")?.innerText.trim() ||
                null;

              return {
                role,
                companyName,
                location,
                companyImage,
                postedDate,
                jobLink,
                activelyHiring,
                applyUrl,
                jobId
              };
            });

            return { jobsArray, totalJobs };
          });
          return jobs

        } catch (error) {

          if (error.name === 'TimeoutError') {
            // change proxy bro
            console.error('TimeoutError: The selector did not appear within the timeout period.');
            // You can add additional logic here to handle the timeout, like retrying or taking a screenshot
          } else {
            console.error('An error occurred:', error);
          }
          return { jobsArray: [], totalJobs: 0 }
        } finally {
          await browser.close();
        }
      })();
    } catch (e) {
      console.log(e);
      return { jobsArray: [], totalJobs: 0 }
    }
  }
}
export default linkedinApi