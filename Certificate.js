const Cert={
  render(root){
    if(!Progress.all()){root.innerHTML='<h1>Certificados</h1><div class="card">Conclua todas as aulas, com aprovação nos quizzes e nas avaliações práticas, para liberar. Progresso: '+Progress.pct()+'%.</div>';return}
    const p=Progress.d();
    root.innerHTML='<h1>Certificados</h1><div class="card noprint"><label>Seu nome: <input id="nm" value="'+(p.nome||'')+'"></label> <button class="btn" id="pr">Imprimir / salvar PDF</button></div><div class="cert"><h1>Certificado de Conclusão</h1><p>Certificamos que</p><div class="nome" id="cn">'+(p.nome||'Seu nome')+'</div><p>concluiu o curso <b>Violão: do zero à música completa</b> ('+MODULES.length+' módulos, '+LESSONS.length+' aulas).</p><p>'+new Date().toLocaleDateString('pt-BR')+'</p><p class="mute">Certificado emitido pela Academia de Violão. Não é diploma oficial reconhecido pelo MEC.</p></div>';
    root.querySelector('#nm').oninput=e=>{const q=Progress.d();q.nome=e.target.value;Progress.save(q);root.querySelector('#cn').textContent=e.target.value||'Seu nome'};
    root.querySelector('#pr').onclick=()=>window.print();
  }
};
