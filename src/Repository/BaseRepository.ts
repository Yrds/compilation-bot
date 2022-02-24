import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { knex, Knex } from 'knex';

//PG Implementation
import { Client, Pool, PoolClient } from 'pg';

const client = new Client();

let db: Database | null = null;

const pool: Pool = new Pool();
let knexCon: Knex | undefined; 

export const endPool = async () => {
  await pool.end();
}

export const destroyKnex = async () => {
  if(knexCon){
    knexCon.destroy();
  }
}


export default class BaseRepository {
  async getDb(): Promise<Database> {
    if(db) {
      return db;
    } else {
      return await open({
        filename: 'db.sqlite',
        driver: sqlite3.Database
      });
    }
  }

  async getKnex() {
    if(!knexCon) {
      return knexCon = await knex({
        client: 'pg', 
        connection: {
          host: process.env.PGHOSTADDR,
          port: process.env.PGPORT,
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD,
          database: process.env.PGDATABASE
        }
      });
    } else {
      return await knexCon;
    }
  }

  getPool(): Promise<PoolClient> {
    return pool.connect();
  }

  getClient(): Promise<PoolClient> {
    return pool.connect();
  }

  getColumnsValuesString(record: Record<string, any>): {columns: string, placeholders:string ,values: any[]} {

    const keys: string[] = Object.keys(record);
    const values: any[] = Object.values(record);

    return {
      columns: `(${keys.map(k => '"' + k + '"').join(', ')})`,
      placeholders: `(${keys.map((arr, idx) => '$' + (idx + 1) ).join(', ')})`,
      values
    };
  }

  getMultiValueString(record: Record<string, any>): {columns: string, placeholders:string ,values: any[]} {
    //TODO
    return {columns: "", placeholders: "", values: []};
  } 

}
