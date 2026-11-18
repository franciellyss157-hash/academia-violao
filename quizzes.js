const Quiz={ // aprovação: 80%
  render(l){
    if(!l.quiz.length)return '<div class="card">As perguntas desta aula ainda não foram cadastradas. Você pode continuar.</div>';
    const s=Progress.st(l.id).quiz;
    return (s!=null?'<p class="mute">Melhor nota: '+s+'%</p>':'')+l.quiz.map((q,i)=>'<div class="card"><b>'+(i+1)+'. '+q.q+'</b>'+q.o.map((o,k)=>'<button class="opt" data-q="'+i+'" data-k="'+k+'">'+o+'</button>').join('')+'<p class="mute" id="e'+i+'"></p></div>').join('')+'<p id="qres"></p>';
  },
  bind(l,root,after){
    if(!l.quiz.length)return;const ans={};
    root.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
      const q=+b.dataset.q,k=+b.dataset.k;if(q in ans)return;ans[q]=k;
      const ok=l.quiz[q].a===k;b.classList.add(ok?'ok':'bad');
      if(!ok)root.querySelector('[data-q="'+q+'"][data-k="'+l.quiz[q].a+'"]').classList.add('ok');
      if(l.quiz[q].e)root.querySelector('#e'+q).textContent=l.quiz[q].e;
      if(Object.keys(ans).length<l.quiz.length)return;
      const r=Object.keys(ans).filter(i=>l.quiz[i].a===ans[i]).length,s=Math.round(r/l.quiz.length*100),ok2=s>=80;
      if(s>(Progress.st(l.id).quiz||0))Progress.set(l.id,{quiz:s});
      root.querySelector('#qres').innerHTML='<b>Nota: '+s+'%</b> — '+(ok2?'aprovado!':'mínimo 80%. Revise a teoria e tente de novo.')+(ok2?'':' <button class="btn alt" id="rt">Tentar novamente</button>');
      if(!ok2)root.querySelector('#rt').onclick=()=>after(true);else after(false);
    });
  }
};
