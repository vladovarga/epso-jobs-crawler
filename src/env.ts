// module.exports = {

// console.log("At the beginning of env")

if (typeof(process.env.URL_TO_CRAWL) !== 'string') {
    const errorMessage = "URL_TO_CRAWL is not defined properly!"
    console.error(errorMessage, process.env.URL_TO_CRAWL)
    throw new Error(errorMessage)
}

if (typeof(process.env.PG_DATABASE) !== 'string' || typeof(process.env.PG_USERNAME) !== 'string') {
    const errorMessage = "Postgres settings are not defined properly!"
    console.error(errorMessage, process.env.PG_DATABASE, process.env.PG_USERNAME)
    throw new Error(errorMessage)
}

let env = {
    AWS_REGION: process.env.AWS_REGION,
    AWS_BUCKET: process.env.AWS_BUCKET,

    URL_TO_CRAWL: process.env.URL_TO_CRAWL,
    URL_OBJECT: new URL(process.env.URL_TO_CRAWL),
    DOWNLOADS_PATH: process.env.DOWNLOADS_PATH,

    LATEST_FILE_NAME: "latest.txt",
    PREVIOUS_FILE_NAME: "previous.txt",

    PG_HOST: process.env.PG_HOST,
    PG_DATABASE: process.env.PG_DATABASE,
    PG_USERNAME: process.env.PG_USERNAME,
    PG_PASSWORD: process.env.PG_PASSWORD
}

// console.log(env);

export { env }