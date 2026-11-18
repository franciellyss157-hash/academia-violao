const $=s=>document.querySelector(s),view=$('#view'),nav=$('#nav');
const ROUTES=[['inicio','Início'],['curso','Curso completo'],['acordes','Biblioteca de acordes'],['afinador','Afinador'],['metronomo','Metrônomo'],['tablaturas','Tablaturas'],['gravacoes','Minhas gravações'],['progresso','Progresso e conquistas'],['certificado','Certificados'],['plano','Planejamento'],['revisao','Revisão e flashcards'],['perfil','Perfil']];
const STEPS=['Teoria','Revisão','Quiz','Prática','Gravação','Avaliação','Resultado'];
let CUR=null,STEP=0;
$('#menuBtn').onclick=()=>nav.classList.toggle('open');
const bar=p=>'<div class="bar" role="progressbar" aria-valuenow="'+p+'"><i style="width:'+p+'%"></i></div>';
function go(){
  clearInterval(Tools.timer);const [r,a]=(location.hash.slice(1)||'inicio').split('/');
  nav.innerHTML=ROUTES.map(x=>'<a href="#'+x[0]+'" class="'+(x[0]===r?'on':'')+'">'+x[1]+'</a>').join('');
  nav.classList.remove('open');$('#pct').textContent=Progress.pct()+'%';
  const V={inicio:home,curso:course,aula:()=>lesson(a),acordes:()=>Tools.chords(view),afinador:()=>Tools.tuner(view),metronomo:()=>Tools.metro(view),tablaturas:()=>Tools.tabs(view),gravacoes:recs,progresso:prog,certificado:()=>Cert.render(view),plano:()=>Tools.plan(view),revisao:()=>Tools.flash(view),perfil:perfil,avaliador:()=>Practice.evaluator(view)};
  (V[r]||home)();view.focus();window.scrollTo(0,0);
}
function nextLesson(){return LESSONS.find(l=>!Progress.done(l))}
function home(){const p=Progress.pct(),n=nextLesson(),d=Progress.d();
  view.innerHTML='<h1>Olá'+(d.nome?', '+d.nome:'')+'!</h1><p>Você só avança quando demonstra que aprendeu: quiz com 80% e prática aprovada com 80 pontos.</p>'+bar(p)+'<p class="mute">'+p+'% do curso · '+d.xp+' XP · sequência de '+Progress.streak()+' dia(s)</p>'+
  (n?'<div class="card"><span class="mute">Próxima aula</span><br><b>'+n.titulo+'</b><br><a class="btn" href="#aula/'+n.id+'">'+(p?'Continuar':'Começar')+'</a></div>':'<a class="btn" href="#certificado">Ver certificado</a>');}
function course(){let h='<h1>Curso completo</h1>';
  MODULES.forEach((m,i)=>{if(i===0||MODULES[i-1].l!==m.l)h+='<h2>'+LEVELS[m.l]+'</h2>';
    const ls=Progress.lessons(i),d=ls.filter(l=>Progress.done(l)).length,ok=Progress.open(ls[0]);
    h+='<details class="card '+(ok?'':'lock')+'"><summary><b>Módulo '+(i+1)+' — '+m.t+'</b> <span class="mute">'+d+'/'+ls.length+'</span></summary>'+bar(d/ls.length*100)+'<div class="list">'+ls.map(l=>{const o=Progress.open(l);return o?'<a href="#aula/'+l.id+'"><span>'+l.titulo+'</span><span>'+(Progress.done(l)?'✔':'')+'</span></a>':'<a class="lock"><span>'+l.titulo+'</span><span>🔒</span></a>'}).join('')+'</div></details>'});
  view.innerHTML=h}
function lesson(id){
  const l=LESSONS.find(x=>x.id===id);if(!l)return home();
  if(!Progress.open(l)){view.innerHTML='<h1>Aula bloqueada</h1><div class="card">Conclua a aula anterior (quiz e avaliação prática aprovados).</div>';return}
  if(CUR!==id){CUR=id;STEP=0}
  const steps=Progress.theory(l)?[0,1,2,6]:[0,1,2,3,4,5,6],s=Progress.st(id);
  const can=[true,true,Progress.quizOk(l),true,!!s.rec,Progress.evOk(l),false][STEP];
  let body='';
  if(STEP===0)body='<h3>Objetivo</h3><p>'+l.intro+'</p><h3>Teoria</h3><p>'+l.teoria+'</p>';
  if(STEP===1)body='<h3>Revise antes do quiz</h3><div class="card">'+l.resumo+'</div>';
  if(STEP===2)body='<h3>Quiz (mínimo 80%)</h3>'+Quiz.render(l);
  if(STEP===3)body='<h3>Atividade prática</h3><p>'+l.pratica+'</p><p class="mute">Avaliação: '+CRITERIOS.join(', ')+'.</p>';
  if(STEP===4)body='<h3>Gravação</h3><div id="rc"></div>';
  if(STEP===5)body='<h3>Avaliação</h3><div class="card">'+(!s.rec?'Grave sua prática primeiro.':!s.ev?'Aguardando o avaliador. A gravação não é aprovada automaticamente.':'<b>Nota '+s.ev.score+'</b> — '+(s.ev.ok?'aprovado!':'não aprovado. Pratique e grave de novo (volte à etapa Gravação).')+(s.ev.fb?'<p>'+s.ev.fb+'</p>':''))+'</div>'+(s.ev&&!s.ev.ok?'<button class="btn alt" id="rg">Regravar</button>':'');
  if(STEP===6){const ok=Progress.quizOk(l)&&Progress.evOk(l);body='<h3>Resultado</h3><div class="card">'+(Progress.done(l)?'Aula concluída ✔':ok?'<button class="btn" id="fn">Concluir aula (+'+(Progress.theory(l)?10:20)+' XP)</button>':'Faltam etapas: '+(Progress.quizOk(l)?'':'quiz ')+(Progress.evOk(l)?'':'avaliação prática'))+'</div>'+(Progress.done(l)&&LESSONS[LESSONS.indexOf(l)+1]?'<a class="btn" href="#aula/'+LESSONS[LESSONS.indexOf(l)+1].id+'">Próxima aula</a>':'')}
  const idx=steps.indexOf(STEP);
  view.innerHTML='<article class="lesson"><p class="mute">Módulo '+(l.m+1)+' · '+MODULES[l.m].t+'</p><h1>'+l.titulo+'</h1><div class="steps">'+steps.map(x=>'<span class="'+(x===STEP?'on':'')+'">'+STEPS[x]+'</span>').join('')+'</div>'+body+
  '<p class="noprint"><button class="btn alt" id="bk"'+(idx===0?' disabled':'')+'>Voltar</button> <button class="btn" id="nx"'+(idx===steps.length-1||!can?' disabled':'')+'>Continuar</button></p></article>';
  const re=()=>lesson(id),q=s=>view.querySelector(s);
  q('#bk').onclick=()=>{STEP=steps[idx-1];re()};q('#nx').onclick=()=>{STEP=steps[idx+1];re()};
  if(STEP===2)Quiz.bind(l,view,retry=>{if(retry){re()}else{q('#nx').disabled=false}});
  if(STEP===4)Practice.recorder(l,q('#rc'),()=>{q('#nx')&&(q('#nx').disabled=false)});
  if(q('#rg'))q('#rg').onclick=()=>{STEP=4;re()};
  if(q('#fn'))q('#fn').onclick=()=>{Progress.finish(l);re();$('#pct').textContent=Progress.pct()+'%'};
}
function recs(){const L=LESSONS.filter(l=>Progress.st(l.id).rec);
  view.innerHTML='<h1>Minhas gravações</h1>'+(L.length?L.map(l=>'<div class="card"><b>'+l.titulo+'</b><br><span class="mute">'+Practice.stat(l.id)+'</span><div class="pv"></div><a class="btn alt" href="#aula/'+l.id+'">Abrir aula</a></div>').join(''):'<div class="card">Você ainda não enviou gravações.</div>');
  L.forEach((l,i)=>Practice.show(view.querySelectorAll('.pv')[i],l.id))}
function prog(){const d=Progress.d(),mods=MODULES.filter((m,i)=>Progress.modDone(i)).length;
  view.innerHTML='<h1>Progresso e conquistas</h1>'+bar(Progress.pct())+'<div class="card"><b>'+d.xp+' XP</b> · '+mods+' módulo(s) concluído(s) · sequência de '+Progress.streak()+' dia(s)</div>'+
  '<div class="card">'+['🎸 Primeira aula','🎵 Módulo 1','🔥 7 dias seguidos','🏅 Metade do curso','🎓 Curso completo'].map((t,i)=>{const on=[Progress.pct()>0,Progress.modDone(0),Progress.streak()>=7,Progress.pct()>=50,Progress.all()][i];return '<p class="'+(on?'':'lock')+'">'+t+(on?' ✔':'')+'</p>'}).join('')+'</div>'+
  MODULES.map((m,i)=>{const ls=Progress.lessons(i);return '<p>'+(i+1)+'. '+m.t+' <span class="mute">'+ls.filter(l=>Progress.done(l)).length+'/'+ls.length+'</span></p>'}).join('')}
function perfil(){const d=Progress.d();
  view.innerHTML='<h1>Perfil</h1><div class="card"><label>Nome: <input id="n" value="'+d.nome+'"></label><p class="mute">Nível atual: '+(nextLesson()?LEVELS[MODULES[nextLesson().m].l]:'Curso concluído')+'</p><p>Progresso salvo neste aparelho, sem cadastro.</p></div><div class="card"><b>Avaliador</b><p class="mute">Abre a lista de gravações pendentes (precisa do PIN).</p><label>PIN: <input id="pn" value="'+d.pin+'" style="width:90px"></label> <a class="btn" href="#avaliador">Abrir área do avaliador</a></div>';
  view.querySelector('#n').onchange=e=>{const q=Progress.d();q.nome=e.target.value;Progress.save(q)};
  view.querySelector('#pn').onchange=e=>{const q=Progress.d();q.pin=e.target.value||'1234';Progress.save(q)}}
addEventListener('hashchange',go);go();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
                       
