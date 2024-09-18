import translate from '@google-cloud/translate'
const { Translate } = translate.v2;

type targetLanguage = "en" | "ta" | "hi"
export default class LanguageTranslation {
    static async translateText(data: string, target: targetLanguage): Promise<string> {
        let translateCred = JSON.parse(process.env.TRANSLATIONCRED || "{}")
        // console.log(process.env.TRANSLATIONCRED)
        const translate = new Translate({
            credentials: translateCred,
            projectId: translateCred.project_id
        });


        // The text to translate



        // Translates some text into Russian
        const [translation] = await translate.translate(data, target);
        return translation;

    }
}