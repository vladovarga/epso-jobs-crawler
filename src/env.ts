// module.exports = {

// console.log("At the beginning of env")

if (typeof(process.env.PG_DATABASE) !== 'string' || typeof(process.env.PG_USERNAME) !== 'string') {
    const errorMessage = "Postgres settings are not defined properly!"
    console.error(errorMessage, process.env.PG_DATABASE, process.env.PG_USERNAME)
    throw new Error(errorMessage)
}

// string enum for position types
export enum PositionTypes {
    "permanent_staff" = "Permanent staff",
    "ec_vacancies" = "EC vacancies",
    "temp" = "Temporary",
    "cast" = "CAST",
    "seconded" = "Seconded",
    "others" = "Others"
}

// console.log("At the end of env")

let env = {
    AWS_REGION: process.env.AWS_REGION,
    AWS_BUCKET: process.env.AWS_BUCKET,

    LATEST_FILE_NAME: "latest.txt",
    PREVIOUS_FILE_NAME: "previous.txt",

    PG_HOST: process.env.PG_HOST,
    PG_DATABASE: process.env.PG_DATABASE,
    PG_USERNAME: process.env.PG_USERNAME,
    PG_PASSWORD: process.env.PG_PASSWORD,

    checkPositionType: function(positionType: string): boolean {
        let keys = Object.keys(PositionTypes)

        return (positionType in keys)
    }
}

// console.log(env);

export { env }