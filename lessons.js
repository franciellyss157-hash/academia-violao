// Conteúdo escrito (sobrescreve o modelo). Chave "módulo-aula", começando em 0. Campos: intro, teoria, resumo, pratica, quiz:[{q,o,a,e}]
const CUSTOM={
'2-0':{intro:'Conhecer as seis cordas do violão e saber qual é qual.',
 teoria:'O violão padrão tem 6 cordas. As de baixo (mais grossas) soam graves; as de cima (mais finas) soam agudas. Cada corda tem um nome e um número, e você vai usar isso em todas as aulas.',
 resumo:'6 cordas. Da mais grave para a mais aguda: Mi, Lá, Ré, Sol, Si, Mi.',
 pratica:'Toque cada corda solta, da mais grossa para a mais fina, com o polegar. Diga o nome em voz alta.',
 quiz:[{q:'Quantas cordas tem o violão padrão?',o:['4','6','8'],a:1},{q:'A corda mais grossa é…',o:['Aguda','Grave','Nenhuma das duas'],a:1,e:'Corda grossa vibra devagar e produz som grave.'},{q:'A corda mais fina é a…',o:['1ª','6ª','3ª'],a:0},{q:'A 5ª corda solta é…',o:['Lá','Ré','Si'],a:0},{q:'As cordas, da 6ª para a 1ª, são…',o:['Mi Lá Ré Sol Si Mi','Dó Ré Mi Fá Sol Lá','Lá Mi Si Ré Sol Dó'],a:0}]},
'2-5':{intro:'Afinar o violão na afinação padrão.',
 teoria:'Afinação padrão (6ª→1ª): Mi, Lá, Ré, Sol, Si, Mi. Apertar a corda (girar a tarraxa) sobe o som; soltar desce. Chegue sempre na nota subindo, para a afinação durar mais.',
 resumo:'Mi Lá Ré Sol Si Mi. Apertar = som mais agudo. Chegue na nota por baixo.',
 pratica:'Use o Afinador do app: toque a referência e afine corda por corda, da 6ª para a 1ª.',
 quiz:[{q:'Apertar a corda faz o som ficar…',o:['Mais agudo','Mais grave','Igual'],a:0},{q:'A afinação padrão da 4ª corda é…',o:['Ré','Sol','Mi'],a:0},{q:'Qual a melhor forma de chegar na nota?',o:['Subindo até ela','Descendo até ela','Tanto faz'],a:0},{q:'Qual é a 1ª corda solta?',o:['Mi','Lá','Si'],a:0},{q:'Qual a ordem correta?',o:['Mi Lá Ré Sol Si Mi','Mi Ré Lá Sol Si Mi','Lá Mi Ré Sol Si Mi'],a:0}]}
};
const LESSONS=[];
MODULES.forEach((m,i)=>m.s.forEach((t,j)=>{const c=CUSTOM[i+'-'+j]||{};
 LESSONS.push({id:i+'-'+j,m:i,n:j,titulo:t,
  intro:c.intro||'Objetivo: dominar "'+t+'" com segurança.',
  teoria:c.teoria||'Conteúdo em desenvolvimento. Escreva a explicação desta aula em js/lessons.js (objeto CUSTOM, chave "'+i+'-'+j+'").',
  resumo:c.resumo||'Resumo desta aula ainda não escrito.',
  pratica:c.pratica||'Pratique o conteúdo com calma e grave o melhor resultado.',
  quiz:c.quiz||[]})}));
const CRITERIOS=['Execução','Ritmo','Clareza do som','Postura','Precisão'];
