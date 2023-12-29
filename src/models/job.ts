const os = require("os");

import { DataTypes, Model } from 'sequelize';
import { sequelizeInstance } from '../inits/sequelize'
import { env, PositionTypes } from '../env'

export class Job extends Model {
    /**
       * Meant to be as singleton
       */
    // private static instance: Job

    /**
     * The static method that controls the access to the singleton instance.
     *
     * This implementation let you subclass the Singleton class while keeping
     * just one instance of each subclass around.
     */
    // public static getInstance(): Job {
    //     if (!Job.instance) {
    //         Job.instance = new Job()
    //     }

    //     return Job.instance
    // }

    /**
     *
     * @constructor
     */
    // constructor() {}

    /**
     * Save new job positions into the database
     * 
     * @param {Array} newJobs - array of new jobs
     * 
     * @returns
     */
    public static async saveJobs(newJobs: any, POSITION_TYPE: PositionTypes) {
        // console.log(newJobs)

        for (let i = 0; i < newJobs.length; i++) {
            const newJob = newJobs[i]

            const createOutput = await Job.create({
                title: newJob.title,
                href: newJob.href,
                domain: newJob.domain,
                grade: newJob.grade,
                institution: newJob.institution,
                location: newJob.location,
                deadline: newJob.deadline,
                position_type: POSITION_TYPE
            });
        }
    }

    public static convertJobToCsv(job: any) {
        return Object.values(job).join("|") + os.EOL;   //+ "\r\n";
    }
    
    public static convertCsvToJob(csvLine: string) {
        const splitOutput = csvLine.split("|");

        return {
            "title": splitOutput[0],
            "href": splitOutput[1],
            "domain": splitOutput[2],
            "grade": splitOutput[3],
            "institution": splitOutput[4],
            "location": splitOutput[5],
            "deadline": splitOutput[6],
        }
    }
}

Job.init({
    // Model attributes are defined here
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false
    },
    title: {
        comment: 'Job title as it was mentioned on the EPSO website',
        type: DataTypes.STRING,
        allowNull: false
        // allowNull defaults to true
    },
    href: {
        type: DataTypes.STRING,
        allowNull: false
        // allowNull defaults to true
    },
    domain: {
        comment: 'Job domain(s)',
        type: DataTypes.STRING,
        allowNull: false
        // allowNull defaults to true
    },
    grade: {
        comment: 'Job grade(s): AST 4, AD 6, FG IV, ...',
        type: DataTypes.STRING,
        allowNull: false
    },
    institution: {
        comment: 'Institution/EU body',
        type: DataTypes.STRING,
        allowNull: false
    },
    location: {
        comment: 'Location string with country in brackets: Brussels (Belgium), Valletta (Malta), ...',
        type: DataTypes.STRING,
        allowNull: false
    },
    deadline: {
        comment: 'Deadline string in format dd/mm/yyy - HH:mm',
        type: DataTypes.STRING,
        allowNull: false
    },
    position_type: {
        comment: 'Position type: permanent_staff, temp, cast, seconded, ...',
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    // Other model options go here
    sequelize: sequelizeInstance,         // the connection instance
    modelName: 'Job',
    tableName: 'jobs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false                     // we dont need this column for now
});