const {Translate} = require('@google-cloud/translate').v2;
class languageTranslation{
async translateText(data){
    let translateCred = JSON.parse(process.env.TRANSLATIONCRED)
    console.log(process.env.TRANSLATIONCRED)
    const translate = new Translate({
        credentials : translateCred,
        projectId : translateCred.project_id
    });

 
      // The text to translate
      const text = data.text;
    
      // The target language
      const target = 'en';
    
      // Translates some text into Russian
      const [translation] = await translate.translate(text, target);
      console.log(`Text: ${text}`);
      console.log(`Translation: ${translation}`);
    
}
}
module.exports = languageTranslation