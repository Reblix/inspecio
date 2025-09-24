import { openDB, DBSchema, IDBPDatabase } from "idb";

interface HgpSchema extends DBSchema {
  audits:  { key: string; value: any };
  answers: { key: string; value: any };
  photos:  {
    key: string;
    value: { id: string; auditId: string; name: string; blob: Blob; size: number };
    indexes: { byAudit: string }; // <--- índice
  };
  outbox:  { key: string; value: { id: string; url: string; method: string; body?: any; headers?: [string, string][] } };
}

let _db: Promise<IDBPDatabase<HgpSchema>> | null = null;

export const dbp = (function init() {
  if (!_db) {
    _db = openDB<HgpSchema>("hgp-auditoria", 2, {
      upgrade(db, oldVersion, _newVersion, tx) {
        if (oldVersion < 1) {
          db.createObjectStore("audits");
          db.createObjectStore("answers");
          db.createObjectStore("photos");
          db.createObjectStore("outbox");
        }
        if (oldVersion < 2) {
          const photos = tx.objectStore("photos");
          photos.createIndex("byAudit", "auditId"); // <--- cria índice
        }
      }
    });
  }
  return _db!;
})();
