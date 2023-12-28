import { env } from './env'
import { sequelizeInstance } from './inits/sequelize'
import { s3ClientInstance } from './inits/s3'
import { Crawler } from './crawler'
import { Differ } from './differ'
import { Job } from './models/job'

import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
const { CopyObjectCommand } = require("@aws-sdk/client-s3"); // CommonJS

// console.log(env);
export const handler = async (event?: APIGatewayEvent, context?: Context): Promise<APIGatewayProxyResult> => {
    // console.log(`Event: ${JSON.stringify(event, null, 2)}`)
    // console.log(`Context: ${JSON.stringify(context, null, 2)}`)

    console.time("overall-execution-time")

    // connect to the DB //
    try {
        await sequelizeInstance.authenticate()
        console.log('Connection to database has been established successfully.')
    } catch (error) {
        console.error('Unable to connect to the database:', error)
        throw error
    }

    // no need for initialization - has been done manually - creating previous.txt, latest.txt, downloads folder

    // 1. step - Crawl the URL
    console.time("crawling")

    const crawlerOutput = await Crawler.crawlUrl()

    console.timeEnd("crawling")

    // 2. step - Check the diff from previous run
    console.time("diff")

    const diffOutput = await Differ.diff()

    console.timeEnd("diff")

    if (!diffOutput) {
        const message = "There was an error while comparing differences!"
        console.error(message, diffOutput)
        throw new Error(message)
    } else if (diffOutput.length == 0) {
        console.log("There were no new job opportunities")
        return returnStatusCodeResponse(200, "There were no new job opportunities")
    } else if (diffOutput.length > 0) {
        console.log("There are new job opportunities", diffOutput)

        console.time("saving-jobs")

        Job.saveJobs(diffOutput)

        console.timeEnd("saving-jobs")

        // 4. step - move latest.txt to previous.txt - but only if there were job differences //
        console.time("copying-latest.txt")
        console.log("Latest list becomes the previous");

        const copyCommand = new CopyObjectCommand({
            Bucket: env.AWS_BUCKET, 
            CopySource: env.AWS_BUCKET + "/" + env.POSITION_TYPE + "/" + env.LATEST_FILE_NAME,
            Key: env.POSITION_TYPE + "/" + env.PREVIOUS_FILE_NAME
        })
        
        const copyResponse = s3ClientInstance.send(copyCommand);
        
        console.timeEnd("copying-latest.txt")
    }

    console.timeEnd("overall-execution-time")

    return returnStatusCodeResponse(200, "Success")
}

function returnStatusCodeResponse(statusCode: number, message: string): any {
    return {
        statusCode: statusCode,
        body: JSON.stringify({
            message: message,
        })
    }
};

// (async function () {
//     await handler()
// }) ()
