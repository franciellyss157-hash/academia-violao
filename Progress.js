const THEORY=[0,4,6,15]; // módulos só teóricos (sem gravação)
const Progress={
  d(){return Store.get('p2',{st:{},xp:0,nome:'',pin:'1234',days:[],meta:20})},
  save(p){Store.set('p2',p)},
  st(id){return this.d().st[id]||{}},
  set(id,o){const p=this.d();p.st[id]=Object.assign(p.st[id]||{},o);this.save(p)},
  theory(l){return THEORY.includes(l.m)},
  quizOk(l){return !l.quiz.length||this.st(l.id).quiz>=80},
  evOk(l){const e=this.st(l.id).ev;return this.theory(l)||!!(e&&e.ok)},
  done(l){return !!this.st(l.id).fin&&this.quizOk(l)&&this.evOk(l)},
  open(l){const i=LESSONS.indexOf(l);return i===0||this.done(LESSONS[i-1])},
  lessons(m){return LESSONS.filter(l=>l.m===m)},
  modDone(m){return this.lessons(m).every(l=>this.done(l))},
  pct(){return Math.round(LESSONS.filter(l=>this.done(l)).length/LESSONS.length*100)},
  all(){return this.pct()===100},
  finish(l){if(this.st(l.id).fin)return;this.set(l.id,{fin:1});const p=this.d();p.xp+=this.theory(l)?10:20;this.save(p);this.day()},
  day(){const p=this.d(),t=new Date().toISOString().slice(0,10);if(!p.days.includes(t)){p.days.push(t);this.save(p)}},
  streak(){const p=this.d();let n=0,x=new Date();if(!p.days.includes(x.toISOString().slice(0,10)))x.setDate(x.getDate()-1);
    while(p.days.includes(x.toISOString().slice(0,10))){n++;x.setDate(x.getDate()-1)}return n}
};
