import { DataTypes, Model } from 'sequelize';
import { sequelizeInstance } from '../inits/sequelize'
import { City } from './city'

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
     * @param {City} cityObject - structured city object
     * @param {Array} newJobs - array of new jobs
     * 
     * @returns
     */
    public static async saveJobs(cityObject: City, newJobs: any) {
        // console.log(cityObject, newJobs)

        for (let i = 0; i < newJobs.length; i++) {
            const newJob = newJobs[i]

            const createOutput = await Job.create({
                title: newJob.title,
                grade: newJob.grade,
                href: newJob.href,
                city: cityObject.code
            });
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
    grade: {
        comment: 'Job grade as it was mentioned on the EPSO website',
        type: DataTypes.STRING,
        allowNull: false
        // allowNull defaults to true
    },
    href: {
        type: DataTypes.STRING,
        allowNull: false
        // allowNull defaults to true
    },
    city: {
        comment: 'City code taken from the cities enum',
        type: DataTypes.STRING,
        allowNull: false
        // allowNull defaults to true
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