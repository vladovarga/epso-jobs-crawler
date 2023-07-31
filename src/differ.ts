// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/modules.html

console.log('Loading differ');

const Diff = require('diff');

import { env } from './env'
import { City } from './models/city'
import { s3ClientInstance } from './inits/s3'

import { GetObjectCommand, CopyObjectCommand } from "@aws-sdk/client-s3";

class DifferClass {
    /**
     * Meant to be as singleton
     */
    private static instance: DifferClass

    /**
     * The static method that controls the access to the singleton instance.
     *
     * This implementation let you subclass the Singleton class while keeping
     * just one instance of each subclass around.
     */
    public static getInstance(): DifferClass {
        if (!DifferClass.instance) {
            DifferClass.instance = new DifferClass()
        }

        return DifferClass.instance
    }

    /**
     *
     * @constructor
     */
    // constructor() {}

    /**
     * Diffs job positions from the latest and previous job crawl
     * 
     * @param {City} cityObject - structured city object
     * 
     * @returns
     */
    public async diffCity(cityObject: City) {
        // read latest.txt from this cron run

        const getCommand = new GetObjectCommand({
            Bucket: env.AWS_BUCKET,
            Key: cityObject.code + "/" + env.LATEST_FILE_NAME
        });

        const getResponse = await s3ClientInstance.send(getCommand);

        if (getResponse.Body === undefined) {
            const errorMessage = "Was not able to load the latest job list"
            console.error(errorMessage, getCommand)
            throw new Error(errorMessage)
        }

        let latest = await getResponse.Body.transformToString();  

        // console.log("latest", latest);

        // read previous.txt from previous cron run
        const getCommand2 = new GetObjectCommand({
            Bucket: env.AWS_BUCKET,
            Key: cityObject.code + "/" + env.PREVIOUS_FILE_NAME
        });

        let getResponse2

        try{
            getResponse2 = await s3ClientInstance.send(getCommand2);
        } catch (e: any) {
            if (e.name === "NoSuchKey") {
                console.log("Previous file does not exist, returning empty diff")

                // create a copy of latest.txt into previous.txt
                console.log('Copying file into previous.txt')
                        
                console.time("copying-" + cityObject.code + "-latest.txt")

                const copyCommand = new CopyObjectCommand({
                    Bucket: env.AWS_BUCKET, 
                    CopySource: env.AWS_BUCKET + "/" + cityObject.code + "/" + env.LATEST_FILE_NAME,
                    Key: cityObject.code + "/" + env.PREVIOUS_FILE_NAME
                })
                
                s3ClientInstance.send(copyCommand)

                console.timeEnd("copying-" + cityObject.code + "-latest.txt")

                console.log('Copying successful')

                return []
            } else {
                console.log("Unknown expcetion, throwing further")
                throw e
            }
        }

        if (getResponse2.Body === undefined) {
            const errorMessage = "Was not able to load the previous job list"
            console.error(errorMessage, getCommand)
            throw new Error(errorMessage)
        }

        let previous = await getResponse2.Body.transformToString();  

        // console.log("previous", previous);

        // sort alphabetically

        const previousSorted = previous.split(/\n/).sort().join('\n');
        const latestSorted = latest.split(/\n/).sort().join('\n');

        // console.log("previousSorted", previousSorted);
        // console.log("latestSorted", latestSorted);

        // diff previous and latest

        let differences = Diff.diffTrimmedLines(previousSorted, latestSorted);

        // console.log("differences", differences);

        // filter out only those which were added
        let onlyAdded = differences.filter((difference: { added: boolean; }) => (difference.added == true));

        if (Array.isArray(onlyAdded) && onlyAdded.length == 0) {
            // if there were no new job opportunities => finish with empty array
            return [];
        }

        let result = [];

        // iterate through added objects
        for (const addedObject of onlyAdded) {
            if (addedObject.count == 1) {
                // if the count is 1 => return just the value
                const splitOutput = addedObject.value.split("|");
                result.push({
                    "title": splitOutput[0],
                    "grade": splitOutput[1],
                    "href": splitOutput[2]
                    
                });
            } else if (addedObject.count > 1) {
                // if the count is > 1 => split the value by new line 
                addedObject.value.split("\n").forEach(function(opportunity: string) {
                    const splitOutput = opportunity.split("|");
                    result.push({
                        "title": splitOutput[0],
                        "grade": splitOutput[1],
                        "href": splitOutput[2]
                    });
                });
            }
        }

        // filter out empty strings
        result = result.filter(opportunity => (opportunity.title != ""));

        // return the result
        return result;
    }
}

export const Differ = DifferClass.getInstance()