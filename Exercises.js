const Tools={
  ctx:null,
  ac(){return this.ctx||(this.ctx=new (window.AudioContext||window.webkitAudioContext)())},
  tone(f,d=1.5){const a=this.ac(),o=a.createOscillator(),g=a.createGain();o.frequency.value=f;o.type='triangle';
    g.gain.setValueAtTime(.4,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+d);
    o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+d)},
  tuner(root){
    const S=[['Mi 6ª',82.41],['Lá 5ª',110],['Ré 4ª',146.83],['Sol 3ª',196],['Si 2ª',246.94],['Mi 1ª',329.63]];
    root.innerHTML='<h1>Afinador</h1><p>Toque a nota de referência e gire a tarraxa até o som do violão ficar igual.</p><div class="strings">'+S.map((s,i)=>'<button data-i="'+i+'">'+s[0]+'</button>').join('')+'</div>';
    root.querySelectorAll('button').forEach(b=>b.onclick=()=>this.tone(S[b.dataset.i][1]));
  },
  timer:null,
  metro(root){
    let bpm=80,beat=0,on=false;
    root.innerHTML='<h1>Metrônomo</h1><div class="card"><div class="bpm"><span id="b">80</span> BPM</div><input id="r" type="range" min="40" max="200" value="80" aria-label="BPM" style="width:100%"><p id="dots"></p><button class="btn" id="go">Iniciar</button></div>';
    const dots=()=>root.querySelector('#dots').innerHTML=[0,1,2,3].map(i=>'<span class="beat'+(i===beat?' on':'')+'"></span>').join('');
    const tick=()=>{this.tone(beat===0?1200:800,.06);dots();beat=(beat+1)%4};
    const stop=()=>{clearInterval(this.timer);on=false};
    const start=()=>{stop();on=true;beat=0;tick();this.timer=setInterval(tick,60000/bpm)};
    root.querySelector('#r').oninput=e=>{bpm=+e.target.value;root.querySelector('#b').textContent=bpm;if(on)start()};
    root.querySelector('#go').onclick=e=>{if(on){stop();e.target.textContent='Iniciar'}else{start();e.target.textContent='Parar'}};
    dots();
  },
  chords(root){
    const C={C:'x32010',D:'xx0232',E:'022100',G:'320003',A:'x02220',Am:'x02210',Em:'022000',Dm:'xx0231'};
    root.innerHTML='<h1>Biblioteca de acordes</h1><p class="mute">Casa a pressionar, da 6ª para a 1ª corda. 0 = solta, x = não tocar.</p>'+
      Object.entries(C).map(([n,f])=>'<div class="card"><b>'+n+'</b><div class="chord">'+f.split('').map(c=>'<b>'+c+'</b>').join('')+'</div></div>').join('');
  }
};
Tools.C={C:'x32010',G:'320003',D:'xx0232',A:'x02220',E:'022100',Am:'x02210',Em:'022000',Dm:'xx0231'};
Tools.tabs=function(root){root.innerHTML='<h1>Tablaturas</h1><p class="mute">Cada linha é uma corda (a de cima é a 1ª, a mais fina). O número é a casa.</p>'+
 [['Cordas soltas, 6ª → 1ª','e|-----------------0--|\nB|--------------0-----|\nG|-----------0--------|\nD|--------0-----------|\nA|-----0--------------|\nE|--0-----------------|'],
  ['Escala de Dó maior (1ª posição)','e|-----------------0-1-|\nB|-------------1-3-----|\nG|-------0-2-----------|\nD|---0-2---------------|\nA|-3-------------------|\nE|---------------------|']]
 .map(t=>'<div class="card"><b>'+t[0]+'</b><pre style="overflow:auto">'+t[1]+'</pre></div>').join('')};
Tools.flash=function(root){const k=Object.keys(Tools.C);let i=0;
 root.innerHTML='<h1>Revisão e flashcards</h1><div class="card"><div class="bpm" id="fn"></div><p id="fa" class="mute">Toque para ver as casas (6ª → 1ª)</p><button class="btn" id="fr">Mostrar</button> <button class="btn alt" id="fx">Próximo</button></div>';
 const n=()=>{root.querySelector('#fn').textContent=k[i];root.querySelector('#fa').textContent='Qual a posição?'};n();
 root.querySelector('#fr').onclick=()=>root.querySelector('#fa').textContent=Tools.C[k[i]].split('').join(' ');
 root.querySelector('#fx').onclick=()=>{i=(i+1)%k.length;n()}};
Tools.plan=function(root){const p=Progress.d(),t=new Date().toISOString().slice(0,10);
 root.innerHTML='<h1>Planejamento de estudos</h1><div class="card"><label>Meta diária (min): <input id="mt" type="number" value="'+p.meta+'" style="width:80px"></label><p>Sequência: <b>'+Progress.streak()+'</b> dia(s). Dias estudados: '+p.days.length+'</p><button class="btn" id="hj">'+(p.days.includes(t)?'Hoje registrado ✔':'Registrar estudo de hoje')+'</button></div>';
 root.querySelector('#mt').onchange=e=>{const q=Progress.d();q.meta=+e.target.value||20;Progress.save(q)};
 root.querySelector('#hj').onclick=()=>{Progress.day();Tools.plan(root)}};
