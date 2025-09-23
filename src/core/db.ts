import { openDB, DBSchema, IDBPDatabase } from "idb";

interface HgpSchema extends DBSchema {
  audits:  { key: string; value: any };
  answers: { key: string; value: any };
  photos:  { key: string; value: { id: string; auditId: string; name: string; blob: Blob; size: number } };
  outbox:  { key: string; value: { id: string; url: string; method: string; body?: any; headers?: [string, string][] } };
}

let _db: Promise<IDBPDatabase<HgpSchema>> | null = null;

export const dbp = (function init() {
  if (!_db) {
    _db = openDB<HgpSchema>("hgp-auditoria", 1, {
      upgrade(db) {
        db.createObjectStore("audits");
        db.createObjectStore("answers");
        db.createObjectStore("photos");
        db.createObjectStore("outbox");
      }
    });
  }
  return _db!;
})();
