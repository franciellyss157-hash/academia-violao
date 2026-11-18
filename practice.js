const Practice={
  stat(id){const s=Progress.st(id);return !s.rec?'Sem gravação':!s.ev?'Aguardando avaliação':s.ev.ok?'Aprovada ('+s.ev.score+')':'Reprovada ('+s.ev.score+')'},
  async show(box,id){const r=await DB.get(id).catch(()=>null);if(!r){box.innerHTML='';return}
    const u=URL.createObjectURL(r.blob);box.innerHTML=(r.type.startsWith('video')?'<video controls src="'+u+'" style="width:100%"></video>':'<audio controls src="'+u+'"></audio>')},
  recorder(l,root,onSaved){
    root.innerHTML='<div class="card"><label>Formato: <select id="fm"><option value="audio">Áudio</option><option value="video">Vídeo</option></select></label> <button class="btn" id="rg">● Gravar</button><p id="ms" class="mute">'+this.stat(l.id)+'</p><div id="pv"></div></div>';
    const $=s=>root.querySelector(s);this.show($('#pv'),l.id);let mr,ch=[],str;
    $('#rg').onclick=async()=>{
      if(mr&&mr.state==='recording'){mr.stop();return}
      try{const v=$('#fm').value==='video';str=await navigator.mediaDevices.getUserMedia({audio:true,video:v});
        mr=new MediaRecorder(str);ch=[];mr.ondataavailable=e=>ch.push(e.data);
        mr.onstop=async()=>{str.getTracks().forEach(t=>t.stop());const blob=new Blob(ch,{type:mr.mimeType});
          await DB.put(l.id,{blob,type:mr.mimeType,when:Date.now()});Progress.set(l.id,{rec:1,ev:null});
          $('#rg').textContent='● Gravar de novo';$('#ms').textContent='Gravação enviada. Aguardando avaliação.';this.show($('#pv'),l.id);onSaved()};
        mr.start();$('#rg').textContent='■ Parar e enviar';$('#ms').textContent='Gravando…'}
      catch(e){$('#ms').textContent='Não consegui acessar o microfone/câmera. Permita o acesso no navegador (precisa de HTTPS).'}
    };
  },
  evaluator(root){
    const pin=prompt('PIN do avaliador:');if(pin!==Progress.d().pin){root.innerHTML='<h1>Área do avaliador</h1><div class="card">PIN incorreto.</div>';return}
    const pend=LESSONS.filter(l=>{const s=Progress.st(l.id);return s.rec&&!s.ev});
    root.innerHTML='<h1>Área do avaliador</h1>'+(pend.length?pend.map(l=>'<div class="card" id="c'+l.id+'"><b>'+l.titulo+'</b><div class="pv"></div>'+CRITERIOS.map((c,i)=>'<label>'+c+': <input type="number" min="0" max="100" value="80" class="cr" style="width:70px"></label> ').join('')+'<br><textarea class="fb" rows="2" style="width:100%;margin:8px 0" placeholder="Feedback para o aluno"></textarea><button class="btn">Registrar avaliação</button></div>').join(''):'<div class="card">Nenhuma gravação pendente.</div>');
    pend.forEach(l=>{const c=root.querySelector('#c'+l.id);this.show(c.querySelector('.pv'),l.id);
      c.querySelector('.btn').onclick=()=>{const v=[...c.querySelectorAll('.cr')].map(i=>+i.value||0),sc=Math.round(v.reduce((a,b)=>a+b,0)/v.length);
        Progress.set(l.id,{ev:{ok:sc>=80,score:sc,fb:c.querySelector('.fb').value}});c.innerHTML='<b>'+l.titulo+'</b>: nota '+sc+' — '+(sc>=80?'aprovado':'reprovado')}});
  }
};
