# EPSO Jobs crawler

## What is EPSO?

EPSO is an acronym that stands for *Eropean Personnel Selection Office*, and in brief they are responsible for hiring people that want to work for the European institutions. More can be read here [https://eu-careers.europa.eu/en](https://eu-careers.europa.eu/en)

Part of their website is also the open vacancies list, which can be found here [https://eu-careers.europa.eu/en/job-opportunities/open-vacancies](https://eu-careers.europa.eu/en/job-opportunities/open-vacancies). This list is the subject of this crawler.

## What does EPSO Jobs crawler do?

The crawler loads the configured website, parses the data/vacancies and saves them in a plain text file in Amazon S3 bucket. Then compares the downloaded list of open vacancies with a previous run of the crawler, and if there are some completely new vacancies, these will be stored in a PostgreSQL database.

## Requirements

Based on the previously mentioned, the prerequisites are:
* Amazon S3 (or other type of compatibile storage, such as MinIO) - used for storing plain text files (`previous.txt` and `latest.txt`)
* PostgreSQL database - for storing newly opened vacancies

## Deployment

### Docker + AWS Lambda
One possibility is to build the docker image and deploy it as-is in AWS Lambda (dockerfile is already adjusted to be extended from lambda nodejs image) and be triggered at regular intervals to crawl the EPSO website for new vacancies. The triggering events have to hold a `detail` property (explained below) with `URL_TO_CRAWL` and `POSITION_TYPE`

### As script
Another possibility would be to run the script as is. In that case:
1. modification in the `index` is necessary - specially the commented part at the end that would actually trigger the function. Or some sort of wrapper needs to be implemented.
1. then the code needs to be built from .ts -> .js (`npm run build`)
1. code can be run - for example via `npm run start` (or accessing the wrapper from first step)

## Configuration

Crawler has to be configured via environment variables. They are all mandatory, except when deploying in AWS Lambda - in that case the `AWS_` variables will be automatically handled by Lambda itself.

| Config Parameter          |  Description                                                  |
| ------------------------- | ------------------------------------------------------------- |
| `AWS_REGION`              | Amazon region used for the S3 service                         |
| `AWS_BUCKET`              | Amazon S3 bucket to store the plain text files in             |
| `AWS_ACCESS_KEY_ID`       | Amazon access key ID                                          |
| `AWS_SECRET_ACCESS_KEY`   | Amazon secret access key                                      |
|   |   |
| `PG_HOST`                 | PostgreSQL hostname                                           |
| `PG_DATABASE`             | PostgreSQL database name                                      |
| `PG_USERNAME`             | PostgreSQL username                                           |
| `PG_PASSWORD`             | PostgreSQL password                                           |

There are 2 more parameters necessary for a successful crawl run. But these are expected to arrive in the `detail` property of the event that is triggered by some Amazon trigger. Example piece of JSON:
```
        ...
        "detail": { 
             "URL_TO_CRAWL": "https://eu-careers.europa.eu/en/job-opportunities/open-vacancies/cast", 
             "POSITION_TYPE": "cast" 
        },
        ...
```

Where the 2 input parameters are:
* `URL_TO_CRAWL` - URL to be crawled. Should look like `https://eu-careers.europa.eu/en/job-opportunities/open-vacancies/{xxx}` where the `{xxx}` represents the position type
* `POSITION_TYPE` - Represents the sub-section on the EPSO website. The value corresponds to the last part of the URL (except for the permanent_staff). It is an enum. Allowed values are: `permanent_staff`, `ec_vacancies`, `temp`, `cast`, `seconded`, `others`

## Database structure

Crawler needs at least 2 tables to be present - `cities` and `jobs`. SQL CREATE scripts can be found for both in the [src/models/](src/models/) subfolder