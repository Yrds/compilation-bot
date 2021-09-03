//WIP
export default class QueryBuilder {
  insert_table: string | undefined;
  record: Record<string, string> | undefined
  returning: string | undefined;

  query: string | undefined;

  insert(table:string) {
    this.insert_table = table;
    return this;
  }

  values(record: Record<string, string>) {

    this.record = record;

    return this;
  }

  onConflict(conflict: string, raw: string ) {
    

  }

  returning(string?: values) {
    this.returning = values; 
  }

  getQuery() {

    if(insert_table) {
      if(!record){
        throw Error("Can't insert into table without columns/values");
      }

      const keys = string[] = Object.keys(this.record);

      const columns =  `(${keys.map(k => '"' + k + '"').join(', ')})`;
      const placeholders = `(${keys.map((arr, idx) => '$' + (idx + 1) ).join(', ')})`;

      return `INSERT INTO videos ${columns} VALUES ${placeholders} ON CONFLICT (id) DO UPDATE SET video_url = EXCLUDED.video_url ${this.returning ? this.returning : ""}`

    }

    throw Error("No operator defined");
  }

  getParams(): any[] {
      return Object.values(this.record);
  }
}
