const Store={
  get(k,d){try{const v=localStorage.getItem('av:'+k);return v?JSON.parse(v):d}catch(e){return d}},
  set(k,v){try{localStorage.setItem('av:'+k,JSON.stringify(v))}catch(e){console.warn(e)}}
};
const DB={ // gravações (IndexedDB)
  open(){return new Promise((ok,no)=>{const r=indexedDB.open('av-rec',1);r.onupgradeneeded=()=>r.result.createObjectStore('rec');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})},
  async tx(mode,fn){const db=await this.open();return new Promise((ok,no)=>{const q=fn(db.transaction('rec',mode).objectStore('rec'));q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)})},
  put(k,v){return this.tx('readwrite',s=>s.put(v,k))},
  get(k){return this.tx('readonly',s=>s.get(k))}
};
