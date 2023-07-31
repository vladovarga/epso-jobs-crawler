import { Op } from "sequelize"

import { env } from './env'
import { sequelizeInstance } from './inits/sequelize'
import { s3ClientInstance } from './inits/s3'
import { Crawler } from './crawler'
import { Differ } from './differ'
import { Job } from './models/job'
import { City } from './models/city'

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

    // let diffs = {};

    let citiesToQuery = await City.findAll({
        where: {
            code: {
                [Op.in]: ['brussels','bratislava', 'ispra', 'parma', 'rome', 'turin', 'other', 'vienna']
            }
        }
    })

    // console.log("citiesToQuery", citiesToQuery)

    for (let i = 0; i < citiesToQuery.length; i++) {
        const city = citiesToQuery[i]

        // 1. step - Crawl the city
        console.time("crawling-" + city.code)

        const crawlerOutput = await Crawler.crawlCity(city)

        console.timeEnd("crawling-" + city.code)

        // 2. step - Check the diff from previous run
        console.time("diff-" + city.code)

        const diffOutput = await Differ.diffCity(city)

        console.timeEnd("diff-" + city.code)

        if (!diffOutput) {
            const message = "There was an error while comparing differences!"
            console.error(message, diffOutput)
            throw new Error(message)
        } else if (diffOutput.length == 0) {
            console.log("There were no new job opportunities for city", city.name)
            continue
        } else if (diffOutput.length > 0) {
            console.log("There are new opportunities for city", city.name, diffOutput)
            // diffs[city.code] = diffOutput
            console.time("saving-jobs-" + city.code)

            Job.saveJobs(city, diffOutput)

            console.timeEnd("saving-jobs-" + city.code)

            // 4. step - move latest.txt to previous.txt - but only if there were job differences //
            console.time("copying-" + city.code + "-latest.txt")
            console.log("Latest list becomes the previous");

            const copyCommand = new CopyObjectCommand({
                Bucket: env.AWS_BUCKET, 
                CopySource: env.AWS_BUCKET + "/" + city.code + "/" + env.LATEST_FILE_NAME,
                Key: city.code + "/" + env.PREVIOUS_FILE_NAME
            })
            
            const copyResponse = s3ClientInstance.send(copyCommand);
            
            console.timeEnd("copying-" + city.code + "-latest.txt")
        }
    }

    console.timeEnd("overall-execution-time")

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Success',
        }),
    };
}