// console.log("At the beginning of init/sequelize")

import { Sequelize } from 'sequelize';
import { env } from '../env'

export const sequelizeInstance = new Sequelize(env.PG_DATABASE, env.PG_USERNAME, env.PG_PASSWORD, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
    },
    host: env.PG_HOST,
    port: env.PG_PORT
});