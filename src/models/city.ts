import { DataTypes, Model } from 'sequelize';
import { sequelizeInstance } from '../inits/sequelize'

export interface City {
    // ID as reffered in the EPSO website
    id: number

    code: string
    name: string
    country: string
}

export class City extends Model {
    /**
       * Meant to be as singleton
       */
    // private static instance: City

    /**
     * The static method that controls the access to the singleton instance.
     *
     * This implementation let you subclass the Singleton class while keeping
     * just one instance of each subclass around.
     */
    // public static getInstance(): City {
    //     if (!City.instance) {
    //         City.instance = new City()
    //     }

    //     return City.instance
    // }

    /**
     *
     * @constructor
     */
    // constructor() {}

    /**
     * Returns only those cities that currently linked with some users. 
     * 
     * @returns {Array}
    //  */
    // public static async getUserLinkedCities() {
        
    // }
}

City.init({
    // Model attributes are defined here
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    code: {
        comment: 'City code, artificially created from name field',
        type: DataTypes.STRING,
        allowNull: false
        // allowNull defaults to true
    },
    name: {
        comment: 'City name only',
        type: DataTypes.STRING,
        allowNull: false
    },
    country: {
        comment: 'City country only',
        type: DataTypes.STRING
    },
    display_name: {
        comment: 'Location name as it was mentioned on the EPSO website in the select',
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    // Other model options go here
    sequelize: sequelizeInstance,         // the connection instance
    modelName: 'City',
    tableName: 'cities',
    timestamps: false,
    // createdAt: false,                    // we dont need this column for now
    // updatedAt: false                     // we dont need this column for now
});