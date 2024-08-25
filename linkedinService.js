const puppeteer = require("puppeteer");
class linkedinApi{
async linnkedinService(prams){
    try {     
        return (async () => {
          const browser = await puppeteer.launch();
          const page = await browser.newPage();    
          try{
            await page.goto(
              "https://in.linkedin.com/jobs/designer-jobs-kochi?position=1&pageNum=0",
              { waitUntil: "networkidle2" }
            );
            console.log("Current page URL:", page.url());
            let basecard = await page.waitForSelector("div.base-card");
            console.log(basecard,"basecard")
            const jobs = await page.evaluate(() => {
              const jobCards = document.querySelectorAll("div.base-card");
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
                  const companyImage = companyImgTag.getAttribute('src') || companyImgTag.getAttribute('data-delayed-url') || null
                  if(companyImage == null){
                    const companyImage = card.querySelector('img.artdeco-entity-image')?.getAttribute('data-delayed-url') || null;
                  }
                  const jobId = card.getAttribute('data-entity-urn').split(':').pop(); // Extract the job ID
                  const applyUrl = card.querySelector('a.base-card__full-link').href;
                const postedDate =card
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
        
              return jobsArray;
            });
            return jobs
            
          }catch(error){
           
            if (error.name === 'TimeoutError') {
               // change proxy bro
              console.error('TimeoutError: The selector did not appear within the timeout period.');
              // You can add additional logic here to handle the timeout, like retrying or taking a screenshot
            } else {
              console.error('An error occurred:', error);
            }
            return []
          }finally{
            await browser.close();
          }
        })();
      } catch (e) {
        console.log(e);
        return []
      }
}
}
module.exports = linkedinApi