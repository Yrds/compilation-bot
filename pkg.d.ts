/// <reference path='pkg.d.ts' />
declare module "pkg" {
  export function exec(args: string[]): Promise<undefined>;
}
