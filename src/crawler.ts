// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/modules.html

console.log('Loading crawler');

const { JSDOM } = require("jsdom")
const https = require('https');

// const { REGION, BUCKET, DOWNLOADS_PATH, URL_OBJECT, LATEST_FILE_NAME, CITY_SEARCH_PARAM_KEY } = require('./env');

import { env } from './env'
import { City } from './models/city'
import { s3ClientInstance } from './inits/s3'

import { CopyObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";

// where are the jobs located in the html source code
const JOBS_TITLE_SELECTOR = "td.views-field-title > a";
const GRADES_SELECTOR = "td.views-field-field-epso-grade";

// key of the parameter in the URL that contains the city ID
const CITY_SEARCH_PARAM_KEY = "field_epso_location_target_id_1"

// this text can be found in the body if there are no jobs available
const NO_JOBS_TEXT = "Sorry, there are no jobs"

class CrawlerClass {
    /**
     * Meant to be as singleton
     */
    private static instance: CrawlerClass

    /**
     * The static method that controls the access to the singleton instance.
     *
     * This implementation let you subclass the Singleton class while keeping
     * just one instance of each subclass around.
     */
    public static getInstance(): CrawlerClass {
        if (!CrawlerClass.instance) {
            CrawlerClass.instance = new CrawlerClass()
        }

        return CrawlerClass.instance
    }

    /**
     *
     * @constructor
     */
    // constructor() {}

    /**
     * Crawls one particular city for currently available jobs
     * and stores the result in a file in AWS S3 bucket
     * 
     * @param {City} cityObject - structured city object
     * 
     * @returns
     */
    public async crawlCity(cityObject: City) {
        return new Promise((resolve, reject) => {

            env.URL_OBJECT.searchParams.set(CITY_SEARCH_PARAM_KEY, cityObject.id.toString())
            
            console.log("Crawling URL", env.URL_OBJECT.toString())
                    
            // start a GET request for URL_OBJECT

            https.get(env.URL_OBJECT, async (response: any) => {
                // console.log('statusCode:', response.statusCode)
                // console.log('headers:', response.headers)

                if (response.statusCode != 200) {
                    const message = "Request didn't finish with 200 reponse code!"
                    console.error(message, response.statusCode)
                    // promise rejected on error
                    // reject(error);
                    throw new Error(message)
                }

                console.log('Reponse code was:', response.statusCode)

                let body = ""

                response.on('data', (chunk: any) => {
                    // build up data chunk by chunk
                    body += chunk
                })
                            
                response.on('end', async () => {
                    console.log('Reponse end reached');
                    // console.log(body)
                    
                    // generate fileName from today's date + .html
                    let fileName = cityObject.code + "-" + new Date().toISOString() + '.html'

                    // write down the response body into a .html file

                    console.log('Writing file into:', env.DOWNLOADS_PATH + fileName)
                    
                    console.time("saving-" + fileName)

                    const putCommand = new PutObjectCommand({
                        Bucket: env.AWS_BUCKET, 
                        Key: env.DOWNLOADS_PATH + fileName, 
                        Body: body
                    })           

                    s3ClientInstance.send(putCommand).then((data: any) => {
                        console.log('Writing successful')

                        // create a copy of just downloaded file into latest.html
                        console.log('Copying file into latest.html')
                        
                        console.time("copying-"+fileName)

                        const copyCommand = new CopyObjectCommand({
                            Bucket: env.AWS_BUCKET, 
                            CopySource: env.AWS_BUCKET + "/" + env.DOWNLOADS_PATH + fileName,
                            Key: cityObject.code + "/" + 'latest.html'
                        })
                        
                        s3ClientInstance.send(copyCommand)

                        console.timeEnd("copying-"+fileName)

                        console.log('Copying successful')
                    }).catch((error: any) => {
                        // error handling.
                        console.error("There was an error saving the lastest html file!", error)
                    })

                    console.timeEnd("saving-"+fileName)                

                    // let's parse latest.html as DOM
                    
                    console.log('Preparing to parse job list')
                    
                    let jobList = ""           // plain text list
                    // let result = []            // array of objects

                    if (body.includes(NO_JOBS_TEXT)) {
                        console.log('No jobs text found => skipping parsing via jsdom')
                    } else {
                        console.time("initializing-jsdom")

                        const dom = new JSDOM(body)
                        
                        console.timeEnd("initializing-jsdom")
        
                        // find all the <a> tags containing a job title
                        
                        console.time("parsing")
                        
                        let grades = dom.window.document.querySelectorAll(GRADES_SELECTOR)

                        dom.window.document.querySelectorAll(JOBS_TITLE_SELECTOR).forEach(function(a: any, index: any) {
                            jobList += a.text + "|" + grades[index].textContent.trim() + "|" + a.href + "\n";
                            // result.push({
                            //     "title": a.text,
                            //     "grade": grades[index].textContent.trim(),
                            //     "href": a.href,
                            // })
                        });

                        console.timeEnd("parsing");
                        console.log('Parsing successful')
                    }

                    // write down list of current job opportunities into latest.txt

                    console.log('Writing job list to:', env.LATEST_FILE_NAME)
                    
                    console.time("saving-" + env.LATEST_FILE_NAME)

                    const putCommand2 = new PutObjectCommand({
                        Bucket: env.AWS_BUCKET,
                        Key:  cityObject.code + "/" + env.LATEST_FILE_NAME, 
                        Body: jobList
                    })

                    await s3ClientInstance.send(putCommand2).then((data: any) => {
                        // process data.
                        console.log('The latest.txt file has been saved!')
                    })
                    .catch((error: any) => {
                        // error handling.
                        console.error('The latest.txt could not be saved!', error)
                    })

                    console.timeEnd("saving-" + env.LATEST_FILE_NAME)

                    // promise resolved on success
                    resolve(true)
                })
            }).on('error', async (e: any) => {
                console.error(e)
            })
        })
    }
}

export const Crawler = CrawlerClass.getInstance()