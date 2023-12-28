// console.log("At the beginning of init/sequelize")

import { Sequelize } from 'sequelize';
import { env } from '../env'

export const sequelizeInstance = new Sequelize(env.PG_DATABASE, env.PG_USERNAME, env.PG_PASSWORD, {
    dialect: 'postgres',
    host: env.PG_HOST,
});