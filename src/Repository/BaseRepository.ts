import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

//PG Implementation
import { Client, Pool } from 'pg';

const client = new Client();

let db: Database | null = null;

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

  getPool(): Pool {
    return new Pool();
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

}
