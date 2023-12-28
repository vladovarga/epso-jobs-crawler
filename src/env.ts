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

// string enum for position types
enum PositionTypes {
    "permanent_staff",
    "ec_vacancies",
    "temp",
    "cast",
    "seconded",
    "others"
}

if (typeof(process.env.POSITION_TYPE) !== 'string' || !Object.values(PositionTypes).includes(process.env.POSITION_TYPE)) {
    const errorMessage = "POSITION_TYPE is not defined properly!"
    console.error(errorMessage, process.env.POSITION_TYPE)
    throw new Error(errorMessage)
}

// console.log("At the end of env")

let env = {
    AWS_REGION: process.env.AWS_REGION,
    AWS_BUCKET: process.env.AWS_BUCKET,

    URL_TO_CRAWL: process.env.URL_TO_CRAWL,
    URL_OBJECT: new URL(process.env.URL_TO_CRAWL),
    POSITION_TYPE: process.env.POSITION_TYPE,

    LATEST_FILE_NAME: "latest.txt",
    PREVIOUS_FILE_NAME: "previous.txt",

    PG_HOST: process.env.PG_HOST,
    PG_DATABASE: process.env.PG_DATABASE,
    PG_USERNAME: process.env.PG_USERNAME,
    PG_PASSWORD: process.env.PG_PASSWORD
}

// console.log(env);

export { env }