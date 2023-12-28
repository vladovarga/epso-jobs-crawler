// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/modules.html

console.log('Loading crawler');

const { JSDOM } = require("jsdom")
const https = require('https');

import { env } from './env'
import { s3ClientInstance } from './inits/s3'
import { Job } from './models/job'

import { PutObjectCommand } from "@aws-sdk/client-s3";

// key in URL for pagination
const URL_PAGE_PARAM_KEY = "page"

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
     * Crawls one particular URL for currently available jobs
     * and stores the result in a file in AWS S3 bucket
     * 
     * @returns
     */
    public async crawlUrl() : Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            // iterator for pagination
            let page_id = 0
            // flag to indicate if there are more pages to be crawled
            let contains_more_results = true
            
            // array of objects
            let result: { title: any; grade: any; href: any; domain: any; institution: any; location: any; deadline: any; }[] = []

            while (contains_more_results && page_id <= 100) {
                let body = await this._crawlPage(page_id)

                console.log('Preparing to parse job list')

                if (!this._containsJobs(body)) {
                    console.log('No jobs text found => skipping parsing via jsdom')
                    break
                }

                console.time("initializing-jsdom")

                const dom = new JSDOM(body)
                
                console.timeEnd("initializing-jsdom")
                
                console.time("parsing")

                dom.window.document.querySelectorAll("table tbody tr").forEach(function(row: any, index: any) {
                    // iterate over the table rows

                    // pick the title with the link
                    let title = row.querySelector(".views-field-title > a")

                    // pick the rest of the data
                    let domain = row.querySelector(".views-field-field-epso-domain").textContent.trim()
                    let grade = row.querySelector(".views-field-field-epso-grade").textContent.trim()
                    let institution = row.querySelector(".views-field-field-dgnew, .views-field-field-epso-institution").textContent.trim()
                    let location = row.querySelector(".views-field-field-epso-location").textContent.trim()
                    let deadline = row.querySelector(".views-field-field-epso-deadline").textContent.trim()

                    result.push({
                        "title": title.text,
                        "href": title.href,
                        "domain": domain,
                        "grade": grade,
                        "institution": institution,
                        "location": location,
                        "deadline": deadline
                    })
                });

                console.timeEnd("parsing");
                console.log('Parsing successful')

                if (!this._containsNextPageLink(dom)) {
                    console.log('No next page link found => stopping pagination')
                    contains_more_results = false
                }

                page_id++
            }

            if (page_id == 100) {
                console.error("There are more than 100 pages of results!")
            }

            // plain text list result
            let jobList = ""

            // convert result to plain text list
            result.forEach(function(job: any) {
                // join object values into a string separated by |
                jobList += Job.convertJobToCsv(job)
            });

            // write down list of current job opportunities into latest.txt

            console.log('Writing job list to:', env.LATEST_FILE_NAME)
            
            console.time("saving-" + env.LATEST_FILE_NAME)

            const putCommand = new PutObjectCommand({
                Bucket: env.AWS_BUCKET,
                Key:  env.POSITION_TYPE + "/" + env.LATEST_FILE_NAME, 
                Body: jobList
            })

            await s3ClientInstance.send(putCommand).then((data: any) => {
                // process data.
                console.log('The latest.txt file has been saved!')
            }).catch((error: any) => {
                // error handling.
                console.error('The latest.txt could not be saved!', error)
            })

            console.timeEnd("saving-" + env.LATEST_FILE_NAME)
            
            // promise resolved on success
            resolve(true)
        })
    }

    /**
     * Crawls a page with the given page_id and returns the response as a string.
     * @param page_id The ID of the page to crawl.
     * @returns A promise that resolves to the response as a string.
     */
    async _crawlPage(page_id: number): Promise<string> {
        env.URL_OBJECT.searchParams.set(URL_PAGE_PARAM_KEY, page_id.toString())
        
        console.log("Crawling URL", env.URL_OBJECT.toString())

        // start a GET request for URL_OBJECT
        return await this._httpsGet(env.URL_OBJECT.toString())
    }

    /**
     * Checks if the provided body contains jobs.
     * @param body - The body to check.
     * @returns True if the body contains no jobs, false otherwise.
     */
    _containsJobs(body: string): boolean {
        // has to be searched as text to avoid parsing (parsing takes too long)
        return body.includes("</table>")
    }

    /**
     * Checks if the provided DOM contains the Next page link.
     * @param dom - The DOM to check.
     * @returns True if the body contains the Next page link, false otherwise.
     */
    _containsNextPageLink(dom: any): boolean {
        return dom.window.document.querySelector(".ecl-pagination__item--next")
    }

    /**
     * Performs an HTTPS GET request to the specified URL and returns the response body as a string.
     * @param url - The URL to send the GET request to.
     * @returns A Promise that resolves with the response body as a string.
     */
    async _httpsGet(url: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            https.get(url, async (response: any) => {
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
    
                response.setEncoding('utf8');
                let body = ''; 
                response.on('data', (chunk: string) => body += chunk);
                response.on('end', () => resolve(body));
            }).on('error', reject);
        })
    }
}

export const Crawler = CrawlerClass.getInstance()