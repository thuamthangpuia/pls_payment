import { Pool } from 'pg';
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as dbschema from '../models/schema.ts'

const pool = new Pool({
    host: process.env.DB_HOST,
   
    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    database: process.env.DB_DATABASE,

    port : Number(process.env.DB_PORT),

    ssl : {
        rejectUnauthorized : false
    }
})


export const db = drizzle(pool,{schema:{...dbschema}})
