const FORGEPETS_CONTRACT_VERSION='FORGEPETS-SAAS-2026-07-V1';
const FORGEPETS_CONTRACT_HTML=`<div class="contract-document"><h2>CONTRATO DE LICENÇA DE USO E PRESTAÇÃO DE SERVIÇOS — FORGE PETS</h2><p><b>Versão:</b> Julho de 2026 · V1</p><h3>1. Objeto</h3><p>O contrato regula o acesso à plataforma Forge Pets, disponibilizada como software por assinatura para gestão de pet shops e estabelecimentos do segmento animal.</p><h3>2. Licença de uso</h3><p>A licença é limitada, não exclusiva, intransferível e permanece válida enquanto a assinatura estiver ativa e os pagamentos estiverem regulares.</p><h3>3. Planos e módulos opcionais</h3><p>Os recursos disponíveis dependem do plano contratado. Módulos opcionais, como o Módulo Fiscal, podem possuir contratação, configuração e cobrança separadas.</p><h3>4. Cobrança recorrente</h3><p>Ao prosseguir, o contratante autoriza a cobrança recorrente pelo meio selecionado, conforme o valor e a periodicidade apresentados na contratação.</p><h3>5. Responsabilidades do contratante</h3><p>O contratante é responsável pela veracidade dos dados, pelas credenciais de acesso, pela utilização adequada do sistema e pelas informações fiscais, contábeis e operacionais inseridas.</p><h3>6. Disponibilidade e suporte</h3><p>O Forge Pets buscará manter o serviço disponível, podendo realizar manutenções, atualizações e correções necessárias à segurança e ao funcionamento da plataforma.</p><h3>7. Dados e privacidade</h3><p>Os dados serão tratados para prestação do serviço, segurança, suporte, cobrança e cumprimento de obrigações aplicáveis. O contratante deve possuir base legal para os dados de seus clientes e colaboradores inseridos na plataforma.</p><h3>8. Cancelamento</h3><p>O cancelamento impede cobranças futuras após o processamento aplicável, sem prejuízo de valores já vencidos. A exportação de dados deverá ser realizada dentro do prazo disponibilizado.</p><h3>9. Aceite eletrônico</h3><p>O aceite mediante marcação da caixa e confirmação eletrônica registra usuário, empresa, versão do contrato, data, horário, endereço IP e informações técnicas da sessão.</p><h3>10. Disposições finais</h3><p>Este texto deve ser complementado pelos dados completos das partes e revisado juridicamente antes do lançamento comercial definitivo.</p></div>`;
const NAV=[['dashboard','▦','Dashboard'],['clientes','♙','Clientes'],['pets','🐾','Pets'],['agenda','▣','Agenda'],['atendimentos','✂','Atendimentos'],['servicos','▤','Serviços'],['caixa','▱','Caixa'],['estoque','▥','Estoque'],['financeiro','⊙','Financeiro'],['boletos','▧','Controle de boletos'],['relatorios','▧','Relatórios'],['fidelidade','♡','Fidelidade'],['fiscal','🧾','Fiscal'],['marketplace','✦','Marketplace'],['config','⚙','Configurações']];
const PLAN_CATALOG={
 Essencial:{price:129,level:1,features:{fidelidade:false,pontos:false,cashback:false,recompensas:false,extratoFidelidade:false,relatorioFidelidade:false,rankingFidelidade:false,ajusteManual:false,vip:false,cupons:false,campanhas:false,marketing:false,regrasAvancadas:false}},
 Profissional:{price:179,level:2,features:{fidelidade:true,pontos:true,cashback:true,recompensas:true,extratoFidelidade:true,relatorioFidelidade:true,rankingFidelidade:true,ajusteManual:true,vip:false,cupons:false,campanhas:false,marketing:false,regrasAvancadas:false}},
 Premium:{price:219,level:3,features:{fidelidade:true,pontos:true,cashback:true,recompensas:true,extratoFidelidade:true,relatorioFidelidade:true,rankingFidelidade:true,ajusteManual:true,vip:true,cupons:true,campanhas:true,marketing:true,regrasAvancadas:true}}
};
function activeSubscription(){try{return JSON.parse(localStorage.getItem('forgepets_active_subscription'))||{companyId:'demo',companyName:'Meu Pet Shop',plan:'Profissional',status:'active'}}catch{return {companyId:'demo',companyName:'Meu Pet Shop',plan:'Profissional',status:'active'}}}
function activePlan(){const sub=activeSubscription();return PLAN_CATALOG[sub.plan]?sub.plan:'Profissional'}
function hasFeature(name){return !!PLAN_CATALOG[activePlan()].features[name]}
function planPrice(){return PLAN_CATALOG[activePlan()].price}
function subscriptionPayments(){try{return JSON.parse(localStorage.getItem('forgepets_subscription_payments')||'[]')}catch{return []}}
function saveSubscriptionPayments(rows){localStorage.setItem('forgepets_subscription_payments',JSON.stringify(rows))}
function addDays(date,days){const d=new Date(date);d.setDate(d.getDate()+days);return d}
function addMonth(date){const d=new Date(date),day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+1);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return d}
function dateOnly(date){return new Date(date).toISOString().slice(0,10)}
function paymentMethodLabel(method){return ({card:'Cartão de crédito',pix:'PIX',boleto:'Boleto'})[method]||'Não informado'}
function nextChargeLabel(){const sub=activeSubscription();return sub.nextChargeAt?new Date(`${sub.nextChargeAt}T12:00:00`).toLocaleDateString('pt-BR'):'Não definida'}
function subscriptionStatusLabel(status){return ({paid:'Paga',pending:'Pendente',overdue:'Vencida',cancelled:'Cancelada'})[status]||'Pendente'}
function subscriptionStatusClass(status){return status==='paid'?'paid':status==='overdue'?'overdue':status==='cancelled'?'cancelled':'pending'}
function subscriptionInvoicesHtml(){
 const sub=activeSubscription(),companyId=String(sub.companyId||'local');
 const rows=subscriptionPayments().filter(x=>String(x.companyId||'local')===companyId).sort((a,b)=>new Date(b.createdAt||b.due)-new Date(a.createdAt||a.due));
 if(!rows.length)return `<div class="subscription-empty"><span>🧾</span><div><b>Nenhuma fatura gerada ainda</b><small>A primeira fatura aparecerá aqui depois da confirmação da assinatura.</small></div></div>`;
 return `<div class="subscription-invoices"><div class="invoice-list-head"><span>Fatura</span><span>Vencimento</span><span>Valor</span><span>Pagamento</span><span>Status</span><span></span></div>${rows.map((x,index)=>`<div class="invoice-row"><span><b>#${String(x.id||index+1).slice(-8).toUpperCase()}</b><small>Plano ${escapeHtml(x.plan||activePlan())}</small></span><span>${x.due?new Date(`${x.due}T12:00:00`).toLocaleDateString('pt-BR'):'—'}</span><strong>${money(x.amount)}</strong><span>${escapeHtml(x.method||'Não informado')}</span><span><i class="invoice-status ${subscriptionStatusClass(x.status)}">${subscriptionStatusLabel(x.status)}</i></span><span class="invoice-actions"><button class="btn ghost small" data-action="view-subscription-invoice" data-id="${x.id}">Ver fatura</button>${x.status==='pending'?`<button class="btn primary small" data-action="pay-subscription-invoice" data-id="${x.id}">Pagar</button>`:''}</span></div>`).join('')}</div>`;
}
function runSubscriptionBilling(){
 const sub=activeSubscription();
 if(!sub.nextChargeAt||!PLAN_CATALOG[sub.plan])return;
 const todayDate=dateOnly(new Date());
 if(sub.nextChargeAt>todayDate)return;
 const payments=subscriptionPayments();
 if(payments.some(p=>p.subscriptionCycle===sub.nextChargeAt&&String(p.companyId)===String(sub.companyId||'local')))return;
 const isCard=sub.paymentMethod==='card';
 const payment={id:uid(),companyId:sub.companyId||'local',companyName:sub.companyName||db?.data?.config?.empresa||'Pet shop',plan:sub.plan,amount:PLAN_CATALOG[sub.plan].price,due:sub.nextChargeAt,method:paymentMethodLabel(sub.paymentMethod),status:isCard?'paid':'pending',paidAt:isCard?new Date().toISOString():null,createdAt:new Date().toISOString(),subscriptionCycle:sub.nextChargeAt,automatic:true};
 payments.unshift(payment);saveSubscriptionPayments(payments);
 const next=dateOnly(addMonth(`${sub.nextChargeAt}T12:00:00`));
 localStorage.setItem('forgepets_active_subscription',JSON.stringify({...sub,status:isCard?'active':'pending',lastChargeAt:sub.nextChargeAt,lastPaymentStatus:payment.status,nextChargeAt:next}));
}

const $=s=>document.querySelector(s); const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const onlyDigits=v=>String(v||'').replace(/\D/g,'');
function maskPhone(v){const d=onlyDigits(v).slice(0,11);if(d.length<=2)return d;if(d.length<=6)return `(${d.slice(0,2)}) ${d.slice(2)}`;if(d.length<=10)return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;}
function maskCpfCnpj(v){const d=onlyDigits(v).slice(0,14);if(d.length<=11){return d.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');}return d.replace(/(\d{2})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1/$2').replace(/(\d{4})(\d{1,2})$/,'$1-$2');}
function maskCpf(v){const d=onlyDigits(v).slice(0,11);return d.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})(\d{1,2})$/,'$1-$2');}
function maskCep(v){const d=onlyDigits(v).slice(0,8);return d.replace(/(\d{5})(\d)/,'$1-$2');}
function maskEan(v){return onlyDigits(v).slice(0,14);}
function parseLocaleNumber(v){const text=String(v??'').trim().replace(/\s/g,'').replace(/^R\$/i,'');if(!text)return 0;if(text.includes(','))return Number(text.replace(/\./g,'').replace(',','.'))||0;return Number(text)||0;}
function maskMoney(v){const digits=onlyDigits(v).slice(0,15);if(!digits)return '';const n=Number(digits)/100;return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});}
function maskDecimal(v,places=3){let text=String(v??'').replace(/[^\d,.]/g,'').replace(/\./g,',');const parts=text.split(',');const int=(parts.shift()||'').replace(/^0+(?=\d)/,'')||'0';const dec=parts.join('').slice(0,places);return dec?`${int},${dec}`:int;}
function validEan(v){const d=onlyDigits(v);return !d||[8,12,13,14].includes(d.length);}
function bindMask(el,formatter){if(!el||el.dataset.maskBound)return;el.dataset.maskBound='1';const apply=()=>{el.value=formatter(el.value);try{el.setSelectionRange(el.value.length,el.value.length)}catch{}};el.addEventListener('input',apply);apply();}
function applyInputMasks(root=document){root.querySelectorAll('[data-mask="phone"]').forEach(el=>bindMask(el,maskPhone));root.querySelectorAll('[data-mask="cpf"]').forEach(el=>bindMask(el,maskCpf));root.querySelectorAll('[data-mask="cpfcnpj"]').forEach(el=>bindMask(el,maskCpfCnpj));root.querySelectorAll('[data-mask="cep"]').forEach(el=>bindMask(el,maskCep));root.querySelectorAll('[data-mask="ean"]').forEach(el=>bindMask(el,maskEan));root.querySelectorAll('[data-mask="money"]').forEach(el=>bindMask(el,maskMoney));root.querySelectorAll('[data-mask="decimal"]').forEach(el=>bindMask(el,v=>maskDecimal(v,Number(el.dataset.decimals||3))));root.querySelectorAll('input[type="email"]').forEach(el=>{if(el.dataset.emailBound)return;el.dataset.emailBound='1';el.addEventListener('blur',()=>el.value=el.value.trim().toLowerCase());});root.querySelectorAll('[data-trim]').forEach(el=>{if(el.dataset.trimBound)return;el.dataset.trimBound='1';el.addEventListener('blur',()=>el.value=el.value.trim().replace(/\s+/g,' '));});}
function setModalError(message){const body=document.querySelector('#modalRoot .modal-body');if(!body){toast(message,'error');return;}let box=body.querySelector('.modal-inline-error');if(!box){box=document.createElement('div');box.className='modal-inline-error';body.prepend(box);}box.textContent=message;box.scrollIntoView({behavior:'smooth',block:'nearest'});}
function clearModalError(){document.querySelector('#modalRoot .modal-inline-error')?.remove();}
async function lookupCep(input){const cep=onlyDigits(input.value);const status=document.getElementById(input.dataset.statusTarget||'cepLookupStatus');if(cep.length!==8){if(status)status.textContent='';return;}if(input.dataset.lastCep===cep)return;input.dataset.lastCep=cep;if(status){status.textContent='Consultando CEP...';status.className='cep-lookup-status loading';}try{const response=await fetch(`https://viacep.com.br/ws/${cep}/json/`);if(!response.ok)throw new Error('Não foi possível consultar o CEP.');const data=await response.json();if(data.erro)throw new Error('CEP não encontrado.');const values={fEndereco:data.logradouro||'',fBairro:data.bairro||'',fCidade:data.localidade||'',fEstado:data.uf||''};Object.entries(values).forEach(([id,value])=>{const field=document.getElementById(id);if(field&&value)field.value=value;});if(status){status.textContent='Endereço preenchido automaticamente.';status.className='cep-lookup-status success';}document.getElementById('fNumero')?.focus();}catch(error){input.dataset.lastCep='';if(status){status.textContent=error.message||'CEP não encontrado.';status.className='cep-lookup-status error';}}}
function bindCepLookup(root=document){root.querySelectorAll('[data-cep-lookup]').forEach(input=>{if(input.dataset.cepLookupBound)return;input.dataset.cepLookupBound='1';let timer;input.addEventListener('input',()=>{clearTimeout(timer);if(onlyDigits(input.value).length===8)timer=setTimeout(()=>lookupCep(input),250);});input.addEventListener('blur',()=>lookupCep(input));});}

const cloud={
 async request(url,options={}){const res=await fetch(url,{credentials:'include',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.message||'Não foi possível concluir a operação.');return data;},
 tutor(x){return{id:x.id,nome:x.name,telefone:x.phone||'',cpf:x.document||'',email:x.email||'',obs:x.notes||'',endereco:x.address||'',numero:x.number||'',complemento:x.complement||'',bairro:x.neighborhood||'',cidade:x.city||'',estado:x.state||'',cep:x.zipCode||'',createdAt:x.createdAt,pontos:0,cashback:0}},
 pet(x){const cp=x.carePreferences||{};return{id:x.id,createdAt:x.createdAt,clienteId:x.tutorId,nome:x.name,especie:x.species,raca:x.breed||'',cor:x.color||'',sexo:x.sex||'',porte:x.size||'',castrado:x.neutered?'Sim':'Não',nascimento:x.birthDate?String(x.birthDate).slice(0,10):'',temperamento:x.temperament||'',peso:x.weight?Number(x.weight):'',foto:x.photoUrl||'',naoAceitaSecador:!!cp.naoAceitaSecador,naoAceitaMaquina:!!cp.naoAceitaMaquina,semPerfume:!!cp.semPerfume,semLaco:!!cp.semLaco,servicosPreferidos:cp.servicosPreferidos||[],obs:x.careNotes||''}},
 service(x){return{id:x.id,nome:x.name,valor:Number(x.price||0),duracao:Number(x.durationMinutes||60),categoria:x.category||''}},
 appointment(x){const start=new Date(x.startsAt),parts=new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(start).reduce((a,p)=>(a[p.type]=p.value,a),{});const statusMap={SCHEDULED:'Agendado',CONFIRMED:'Confirmado',IN_SERVICE:'Em atendimento',COMPLETED:'Concluído',CANCELED:'Cancelado',NO_SHOW:'Não compareceu'};return{id:x.id,tutorId:x.tutorId,petId:x.petId,servicoId:x.serviceId,itens:(Array.isArray(x.items)&&x.items.length?x.items:[{serviceId:x.serviceId,service:x.service,quantity:1,unitPrice:x.service?.price,total:x.service?.price,category:x.service?.category}]).map(item=>({id:item.id||'',servicoId:item.serviceId,nome:item.service?.name||'',categoria:item.category||item.service?.category||'',qtd:Number(item.quantity||1),valor:Number(item.unitPrice??item.service?.price??0),total:Number(item.total??Number(item.unitPrice??item.service?.price??0)*Number(item.quantity||1))})),data:`${parts.year}-${parts.month}-${parts.day}`,hora:`${parts.hour}:${parts.minute}`,obs:x.notes||'',status:statusMap[x.status]||'Agendado',startsAt:x.startsAt,endsAt:x.endsAt}},
 async sync({notify=false}={}){
  const results=await Promise.allSettled([
   this.request('/api/forge/tutores'),
   this.request('/api/forge/pets'),
   this.request('/api/forge/servicos'),
   this.request('/api/forge/agenda')
  ]);
  const [tutorsResult,petsResult,servicesResult,appointmentsResult]=results;
  let changed=false;
  window.forgeCloudStatus={tutores:'ok',pets:'ok',lastSync:new Date().toISOString()};
  if(tutorsResult.status==='fulfilled'){
   db.data.clientes=workspaceCloud.mergeArray((tutorsResult.value.tutors||[]).map(this.tutor),db.data.clientes,true);
   changed=true;
  }else{
   window.forgeCloudStatus.tutores='error';
   console.error('[ForgePets] Falha ao carregar tutores:',tutorsResult.reason);
  }
  if(petsResult.status==='fulfilled'){
   db.data.pets=workspaceCloud.mergeArray((petsResult.value.pets||[]).map(this.pet),db.data.pets,true);
   changed=true;
  }else{
   window.forgeCloudStatus.pets='error';
   console.error('[ForgePets] Falha ao carregar pets:',petsResult.reason);
  }
  if(servicesResult.status==='fulfilled'){
   let remote=(servicesResult.value.services||[]).map(this.service);
   if(!remote.length&&db.data.servicos.length){
    const migrated=await Promise.allSettled(db.data.servicos.map(s=>this.request('/api/forge/servicos',{method:'POST',body:JSON.stringify({name:s.nome,price:Number(s.valor||0),durationMinutes:Number(s.duracao||60)})})));
    remote=migrated.filter(x=>x.status==='fulfilled').map(x=>this.service(x.value.service));
   }
   db.data.servicos=workspaceCloud.mergeArray(remote,db.data.servicos,true);
   changed=true;
  }else{
   window.forgeCloudStatus.servicos='error';
   console.error('[ForgePets] Falha ao carregar serviços:',servicesResult.reason);
  }
  if(appointmentsResult.status==='fulfilled'){
   db.data.agenda=workspaceCloud.mergeArray((appointmentsResult.value.appointments||[]).map(this.appointment),db.data.agenda,true);
   changed=true;
  }else{
   window.forgeCloudStatus.agenda='error';
   console.error('[ForgePets] Falha ao carregar agenda:',appointmentsResult.reason);
  }
  if(changed){
   localStorage.setItem('vetcoreShopPro',JSON.stringify(db.data));
   workspaceCloud.queueSave();
   render();
  }
  const failed=results.filter(x=>x.status==='rejected').length;
  if(notify){
   if(failed===0)toast('Dados atualizados com sucesso.','success');
   else if(failed===1)toast('Um dos cadastros não pôde ser atualizado. Tente novamente.','warning');
   else toast('Não foi possível atualizar os cadastros agora.','error');
  }
  return {ok:failed===0,failed};
 }
};


const workspaceCloud={
 ready:false,
 revision:0,
 updatedAt:null,
 saveTimer:null,
 saving:false,
 lastError:null,
 migrationKey(){const sub=activeSubscription();return `forgepets_workspace_migrated_${sub.companyId||'company'}`;},
 meaningful(data){
  if(!data||typeof data!=='object')return false;
  return ['clientes','pets','agenda','estoque','estoqueMovimentos','vendas','boletos','despesas','receitasPrevistas','caixa','pendencias','loyaltyHistory'].some(key=>Array.isArray(data[key])&&data[key].length>0);
 },
 mergeArray(server=[],local=[],localOnlyMissing=true){
  const map=new Map();
  (Array.isArray(server)?server:[]).forEach(item=>item?.id&&map.set(String(item.id),item));
  if(localOnlyMissing)(Array.isArray(local)?local:[]).forEach(item=>{if(item?.id&&!map.has(String(item.id)))map.set(String(item.id),item)});
  return [...map.values()];
 },
 merge(server={},local={},includeLocalMissing=false){
  const result={...server};
  const arrayKeys=['clientes','pets','agenda','servicos','caixa','estoque','estoqueMovimentos','boletos','despesas','receitasPrevistas','pendencias','vendas','cupons','campanhas','loyaltyHistory','recompensas'];
  arrayKeys.forEach(key=>{result[key]=this.mergeArray(server?.[key],local?.[key],includeLocalMissing)});
  result.config={...(server?.config||{}),...(includeLocalMissing?local?.config||{}:{})};
  return result;
 },
 apply(data){
  if(!data||typeof data!=='object')return;
  db.data={...db.data,...data,config:{...(db.data.config||{}),...(data.config||{})}};
  ensureData();
  localStorage.setItem('vetcoreShopPro',JSON.stringify(db.data));
 },
 async requestSave(data,baseRevision,source='AUTO_SYNC'){
  const response=await fetch('/api/forge/workspace',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({data,baseRevision,source})});
  const payload=await response.json().catch(()=>({}));
  if(response.status===409)return {conflict:true,...payload};
  if(!response.ok)throw new Error(payload.message||'Não foi possível salvar os dados no Neon.');
  return payload;
 },
 async sync(){
  const local=JSON.parse(JSON.stringify(db.data||{}));
  try{
   const remote=await cloud.request('/api/forge/workspace');
   const firstMigration=!localStorage.getItem(this.migrationKey());
   if(!remote.exists){
    if(this.meaningful(local)){
     const saved=await this.requestSave(local,0,'FIRST_COMPUTER_MIGRATION');
     this.revision=Number(saved.revision||1);this.updatedAt=saved.updatedAt||new Date().toISOString();
     localStorage.setItem(this.migrationKey(),'1');this.ready=true;this.lastError=null;
     return {migrated:true};
    }
    this.ready=true;this.revision=0;return {waitingForMainComputer:true};
   }
   this.revision=Number(remote.revision||0);this.updatedAt=remote.updatedAt||null;
   let merged=this.merge(remote.data||{},local,firstMigration&&this.meaningful(local));
   this.apply(merged);
   if(firstMigration&&this.meaningful(local)){
    const saved=await this.requestSave(merged,this.revision,'LOCAL_DATA_RECOVERY');
    if(saved.conflict){merged=this.merge(saved.data||{},merged,true);this.apply(merged);const retry=await this.requestSave(merged,Number(saved.revision||0),'LOCAL_DATA_RECOVERY_RETRY');this.revision=Number(retry.revision||saved.revision||0);this.updatedAt=retry.updatedAt||saved.updatedAt||null;}
    else{this.revision=Number(saved.revision||this.revision);this.updatedAt=saved.updatedAt||this.updatedAt;}
   }
   localStorage.setItem(this.migrationKey(),'1');this.ready=true;this.lastError=null;
   return {ok:true};
  }catch(error){
   this.ready=false;this.lastError=error;console.error('[ForgePets] Falha ao sincronizar dados da empresa:',error);return {ok:false,error};
  }
 },
 queueSave(){if(!this.ready)return;clearTimeout(this.saveTimer);this.saveTimer=setTimeout(()=>this.push(),650);},
 async push(){
  if(!this.ready||this.saving)return;
  this.saving=true;
  try{
   let result=await this.requestSave(db.data,this.revision,'APP_SAVE');
   if(result.conflict){
    const merged=this.merge(result.data||{},db.data,true);this.apply(merged);
    result=await this.requestSave(merged,Number(result.revision||0),'CONFLICT_MERGE');
   }
   this.revision=Number(result.revision||this.revision);this.updatedAt=result.updatedAt||new Date().toISOString();this.lastError=null;
   updateWorkspaceStatusUI();
  }catch(error){this.lastError=error;console.error('[ForgePets] Alteração ainda não sincronizada com o Neon.',error);toast('Dados salvos neste computador, mas a sincronização com o Neon está pendente.','warning');updateWorkspaceStatusUI();}
  finally{this.saving=false;}
 }
};
function workspaceStatusText(){if(workspaceCloud.lastError)return 'Sincronização pendente';if(!workspaceCloud.ready)return 'Conectando ao Neon…';return workspaceCloud.updatedAt?`Sincronizado em ${new Date(workspaceCloud.updatedAt).toLocaleString('pt-BR')}`:'Pronto para sincronizar';}
function updateWorkspaceStatusUI(){document.querySelectorAll('[data-workspace-status]').forEach(el=>{el.textContent=workspaceStatusText();el.classList.toggle('error',!!workspaceCloud.lastError)});}
async function bootCompanyData(){
 await workspaceCloud.sync();
 await cloud.sync();
 await financeCloud.sync();
 if(workspaceCloud.ready){workspaceCloud.queueSave();setTimeout(()=>workspaceCloud.push(),900)}
 updateWorkspaceStatusUI();
}

const financeCloud={
 ready:false,
 saving:false,
 saveTimer:null,
 snapshot(){
  ensureData();
  return {
   categories:db.data.config.financeCategories||{},
   payables:db.data.boletos||[],
   expenses:(db.data.despesas||[]).map(item=>({
    ...item,
    empresa:item.empresa||item.descricao||'Despesa',
    descricao:item.descricao||'',
    parcela:item.parcela||1,
    quantidade:item.quantidade||1,
    status:item.status==='pago'?'pago':'aberto',
    pagoEm:item.paidAt||item.pagoEm||null,
    forma:item.forma||''
   })),
   revenues:db.data.receitasPrevistas||[],
   transactions:db.data.caixa||[]
  };
 },
 localBackup(){
  const snapshot=this.snapshot();
  try{localStorage.setItem('forgepets_finance_recovery_backup',JSON.stringify({createdAt:new Date().toISOString(),...snapshot}));}catch{}
  return snapshot;
 },
 mergeById(server=[],local=[]){
  const map=new Map();
  local.forEach(item=>item?.id&&map.set(String(item.id),item));
  server.forEach(item=>item?.id&&map.set(String(item.id),item));
  return [...map.values()];
 },
 categoryMerge(serverCategories=[],localCategories={}){
  const result={receita:[...(localCategories.receita||[])],despesa:[...(localCategories.despesa||[])],boleto:[...(localCategories.boleto||[])]};
  serverCategories.forEach(item=>{if(result[item.type]&&!result[item.type].some(name=>normalize(name)===normalize(item.name)))result[item.type].push(item.name);});
  Object.keys(result).forEach(key=>result[key]=[...new Set(result[key].map(x=>String(x).trim()).filter(Boolean))]);
  return result;
 },
 apply(data){
  if(!data)return;
  db.data.boletos=Array.isArray(data.payables)?data.payables:db.data.boletos;
  db.data.despesas=(Array.isArray(data.expenses)?data.expenses:db.data.despesas).map(item=>({
   ...item,
   descricao:item.descricao||item.empresa||'Despesa',
   vencimento:item.vencimento,
   paidAt:item.pagoEm||item.paidAt||null,
   caixaMovementId:(db.data.caixa||[]).find(x=>String(x.sourceId||x.expenseId||'')===String(item.id))?.id||null
  }));
  db.data.receitasPrevistas=Array.isArray(data.revenues)?data.revenues:db.data.receitasPrevistas;
  db.data.caixa=Array.isArray(data.transactions)?data.transactions:db.data.caixa;
  if(Array.isArray(data.categories))db.data.config.financeCategories=this.categoryMerge(data.categories,{});
  localStorage.setItem('vetcoreShopPro',JSON.stringify(db.data));
 },
 async sync(){
  const local=this.localBackup();
  try{
   const server=await cloud.request('/api/forge/finance');
   const merged={
    categories:this.categoryMerge(server.categories||[],local.categories||{}),
    payables:this.mergeById(server.payables||[],local.payables||[]),
    expenses:this.mergeById(server.expenses||[],local.expenses||[]),
    revenues:this.mergeById(server.revenues||[],local.revenues||[]),
    transactions:this.mergeById(server.transactions||[],local.transactions||[])
   };
   await cloud.request('/api/forge/finance',{method:'PUT',body:JSON.stringify(merged)});
   const confirmed=await cloud.request('/api/forge/finance');
   this.apply(confirmed);
   this.ready=true;
   render();
   return true;
  }catch(error){
   console.error('[ForgePets] Falha ao sincronizar o financeiro. Os dados locais foram preservados.',error);
   this.ready=false;
   return false;
  }
 },
 queueSave(){
  if(!this.ready)return;
  clearTimeout(this.saveTimer);
  this.saveTimer=setTimeout(()=>this.push(),500);
 },
 async push(){
  if(!this.ready||this.saving)return;
  this.saving=true;
  try{
   await cloud.request('/api/forge/finance',{method:'PUT',body:JSON.stringify(this.snapshot())});
  }catch(error){
   console.error('[ForgePets] Não foi possível salvar o financeiro no Neon.',error);
   toast('A alteração ficou salva neste navegador, mas ainda não sincronizou com o Neon.','warning');
  }finally{this.saving=false;}
 }
};

const today=()=>new Date().toISOString().slice(0,10);
const db={
 data:JSON.parse(localStorage.getItem('vetcoreShopPro')||'null')||{clientes:[],pets:[],agenda:[],servicos:[{id:uid(),nome:'Banho',valor:60},{id:uid(),nome:'Banho + Tosa',valor:95},{id:uid(),nome:'Hidratação',valor:35}],caixa:[],estoque:[],boletos:[],config:{empresa:'Meu Pet Shop',nomeFantasia:'Meu Pet Shop',razaoSocial:'',cnpjCpf:'',telefone:'',whatsapp:'',email:'',site:'',cep:'',endereco:'',numero:'',complemento:'',bairro:'',cidade:'',estado:'RS',logo:'',corPrincipal:'#5b21d6',corDestaque:'#ff8a1f',inicioAgenda:'08:00',fimAgenda:'18:00',intervaloAgenda:30,diasFuncionamento:['1','2','3','4','5','6'],moeda:'BRL',impressora:'80',rodapeCupom:'Obrigado pela preferência!',estoqueMinimoPadrao:3,alertaEstoque:true,alertaAniversario:true,alertaAgenda:true,pontosPorReal:1,usarFidelidade:true,percentualCashback:2,validadePontos:0,niveisVip:[{nome:'Bronze',min:0},{nome:'Prata',min:500},{nome:'Ouro',min:1500},{nome:'Diamante',min:5000}],cuponsAtivos:true,campanhaAniversario:true,tema:'claro',nomeUsuario:'Amanda',emailUsuario:'admin@forgepets.com',perfilUsuario:'Administrador',telefoneUsuario:'',fotoUsuario:''}},
 save(){localStorage.setItem('vetcoreShopPro',JSON.stringify(this.data));workspaceCloud.queueSave();financeCloud.queueSave();render();},
 reset(){localStorage.removeItem('vetcoreShopPro');location.reload();}
};
const ROUTE_ALIASES={dashboard:'dashboard',clientes:'clientes',tutores:'clientes',pets:'pets',agenda:'agenda',atendimentos:'atendimentos',servicos:'servicos','serviços':'servicos',caixa:'caixa',estoque:'estoque',financeiro:'financeiro',boletos:'boletos',relatorios:'relatorios','relatórios':'relatorios',fidelidade:'fidelidade',fiscal:'fiscal',marketplace:'marketplace',modulos:'marketplace','módulos':'marketplace',config:'config',configuracoes:'config','configurações':'config'};
const ROUTE_PATHS={dashboard:'dashboard',clientes:'tutores',pets:'pets',agenda:'agenda',atendimentos:'atendimentos',servicos:'servicos',caixa:'caixa',estoque:'estoque',financeiro:'financeiro',boletos:'boletos',relatorios:'relatorios',fidelidade:'fidelidade',fiscal:'fiscal',marketplace:'marketplace',config:'configuracoes'};
function pageFromLocation(){
 const query=new URLSearchParams(location.search).get('modulo');
 const match=location.pathname.match(/^\/app\/([^/?#]+)/i);
 const hash=location.hash.replace(/^#\/?/,'');
 const raw=decodeURIComponent(match?.[1]||query||hash||'dashboard').toLowerCase();
 return ROUTE_ALIASES[raw]||'dashboard';
}
function routeForPage(target){return `/app/${ROUTE_PATHS[target]||'dashboard'}`;}
let page=pageFromLocation();
let clientSearch='',petSearch='';
let saleCart=[];
let currentForgeUser=null;
let companyUsers=[];
let reportStart=daysAgo(29),reportEnd=today();
function init(){
 ensureData();
 bindLogin();
 if(localStorage.getItem('forgePetsSession')==='active')showApplication();
}
function bindLogin(){
 const form=$('#loginForm'),password=$('#loginPassword'),toggle=$('#togglePassword');
 toggle.onclick=()=>{password.type=password.type==='password'?'text':'password';toggle.textContent=password.type==='password'?'◉':'⊘';};
 $('#forgotPassword').onclick=()=>modal('Recuperar acesso',`<p>Esta versão local ainda não envia e-mails automaticamente.</p><div class="notice">Entre em contato com o administrador do pet shop para redefinir sua senha.</div>`,close=>close(),'Entendi');
 const createAccount=$('#createAccountButton'),openPlans=$('#openLoginPlans');
 if(createAccount)createAccount.onclick=()=>modal('Criar minha conta',`<p>O cadastro comercial será conectado ao fluxo de assinatura.</p><div class="notice">Escolha um plano para iniciar seus 2 dias de teste grátis.</div>`,close=>{close();setTimeout(()=>openLoginPlansModal(),80)},'Ver planos');
 if(openPlans)openPlans.onclick=openLoginPlansModal;
 const privacy=$('#loginPrivacy'),terms=$('#loginTerms'),support=$('#loginSupport');
 if(privacy)privacy.onclick=()=>modal('Política de Privacidade','<p>O documento definitivo será disponibilizado antes do lançamento comercial.</p>',close=>close(),'Entendi');
 if(terms)terms.onclick=()=>modal('Termos de Uso','<p>Os termos definitivos serão disponibilizados antes do lançamento comercial.</p>',close=>close(),'Entendi');
 if(support)support.onclick=()=>modal('Suporte ForgePets','<p>Entre em contato com o suporte Forge Labs para receber atendimento.</p>',close=>close(),'Entendi');
 form.onsubmit=e=>{
  e.preventDefault();
  const email=$('#loginEmail').value.trim().toLowerCase(),pass=password.value;
  if(email==='admin@forgepets.com'&&pass==='123456'){
   localStorage.setItem('forgePetsSession','active');
   showApplication();
   setTimeout(()=>toast('Bem-vindo ao ForgePets!'),150);
  }else{
   const fields=[...document.querySelectorAll('.login-field>div')];fields.forEach(x=>x.classList.add('login-error'));setTimeout(()=>fields.forEach(x=>x.classList.remove('login-error')),420);
   password.value='';password.focus();
  }
 };
}
function openLoginPlansModal(){
 const plans=[
  {name:'Essencial',price:129,desc:'A gestão completa para organizar o dia a dia do seu pet shop.',features:['Dashboard','Agenda','Tutores e pets','Serviços','Caixa e vendas','Financeiro e estoque','Relatórios básicos','Forge Connect']},
  {name:'Profissional',price:179,featured:true,desc:'Mais fidelização, recorrência e relacionamento com seus clientes.',features:['Tudo do Essencial','Pontos e cashback','Resgates e extrato','Dashboard de fidelidade','Ranking de clientes','Ajustes manuais']},
  {name:'Premium',price:219,desc:'Automação e inteligência para acelerar o crescimento do pet shop.',features:['Tudo do Profissional','Níveis VIP','Benefícios por nível','Cupons automáticos','Campanhas de aniversário','Automação de marketing']}
 ];
 modal('Planos ForgePets',`<div class="modal-plan-grid">${plans.map(p=>`<article class="modal-plan ${p.featured?'current':''}">${p.featured?'<span class="plan-chip">Mais escolhido</span>':''}<h3>${p.name}</h3><strong>${money(p.price)} <small>/mês</small></strong><p>${p.desc}</p><ul>${p.features.map(f=>`<li>✓ ${f}</li>`).join('')}</ul><button class="btn primary" data-login-plan="${p.name}">Começar teste grátis</button></article>`).join('')}</div><div class="notice"><b>2 dias de teste grátis.</b> Sem cobrança imediata.</div>`,close=>{document.querySelectorAll('[data-login-plan]').forEach(btn=>btn.onclick=()=>{localStorage.setItem('forgepets_selected_plan',btn.dataset.loginPlan);close();toast(`Plano ${btn.dataset.loginPlan} selecionado. Crie sua conta para continuar.`);});},'Fechar');
}


function userRoleLabel(role){return ({OWNER:'Administrador',MANAGER:'Gerente',EMPLOYEE:'Atendente',MASTER:'Master'})[role]||role||'Usuário';}
async function loadCurrentForgeUser(){
 try{
  const data=await cloud.request('/api/forge/me');
  currentForgeUser=data.user||null;
  if(currentForgeUser){
   const c=db.data.config||{};
   c.nomeUsuario=currentForgeUser.name||c.nomeUsuario||'Usuário';
   c.emailUsuario=currentForgeUser.email||'';
   c.perfilUsuario=userRoleLabel(currentForgeUser.role);
   localStorage.setItem('vetcoreShopPro',JSON.stringify(db.data));
   applyBranding();
  }
  return currentForgeUser;
 }catch(error){console.warn('[ForgePets] Não foi possível carregar o usuário logado.',error);return null;}
}
async function loadCompanyUsers({rerender=false}={}){
 try{const data=await cloud.request('/api/forge/users');companyUsers=data.users||[];if(rerender&&page==='config')render();return companyUsers;}
 catch(error){console.warn('[ForgePets] Não foi possível carregar os usuários.',error);return [];}
}
function showApplication(){
 $('#loginScreen').style.display='none';$('#app').classList.remove('app-hidden');
 if(!window.forgePetsStarted){runSubscriptionBilling();runPremiumAutomations();go(page,{replace:true});bindGlobal();initSystemFooter();window.forgePetsStarted=true;loadCurrentForgeUser();loadCompanyUsers();bootCompanyData();}
 enforceSubscriptionAccess();
}

async function enforceSubscriptionAccess(){
 try{
  const state=await cloud.request('/api/forge/subscription?status=1');
  const current=activeSubscription();
  localStorage.setItem('forgepets_active_subscription',JSON.stringify({...current,plan:state.plan||current.plan,status:state.active?'active':state.status,trialEndsAt:state.active?null:state.trialEndsAt,trialDaysRemaining:state.active?0:state.trialDaysRemaining,pendingPlan:state.active?null:(state.pendingPlan||null),paymentPending:Boolean(state.paymentPending),modules:Array.isArray(state.modules)?state.modules:current.modules||[],activeModules:Array.isArray(state.activeModules)?state.activeModules:current.activeModules||[]}));
  document.querySelector('#trialAccessOverlay')?.remove();
  if(state.accessAllowed){
   if(state.active){sessionStorage.removeItem('forgepets_trial_warning_shown');if(window.forgePaymentRecheckTimer){clearInterval(window.forgePaymentRecheckTimer);window.forgePaymentRecheckTimer=null;}}
   if(state.status==='trial'&&Number(state.trialDaysRemaining)<=1) showTrialWarning(state);
   if(state.active&&state.billingWarning)setTimeout(()=>showUpcomingBillingWarning(state),250);
   updatePlanUI();
   return;
  }
  showExpiredTrialGate(state);
  if(state.paymentPending&&!window.forgePaymentRecheckTimer){let attempts=0;window.forgePaymentRecheckTimer=setInterval(async()=>{attempts++;await enforceSubscriptionAccess();if(attempts>=60&&window.forgePaymentRecheckTimer){clearInterval(window.forgePaymentRecheckTimer);window.forgePaymentRecheckTimer=null;}},10000);}
 }catch(error){
  console.warn('[ForgePets] Não foi possível validar a assinatura.',error);
 }
}


function subscriptionBillingTypeLabel(value){
 return ({
  CREDIT_CARD:'Cartão de crédito',
  PIX:'PIX',
  BOLETO:'Boleto bancário',
  UNDEFINED:'Não definida'
 })[String(value||'').toUpperCase()]||String(value||'Não definida');
}
function billingWarningTitle(days){
 if(days===0)return 'Sua mensalidade vence hoje';
 if(days===1)return 'Sua mensalidade vence amanhã';
 return `Sua mensalidade vence em ${days} dias`;
}
function billingWarningDescription(days,billingType){
 const method=String(billingType||'').toUpperCase();
 if(method==='CREDIT_CARD'){
  return days===0
   ?'A cobrança será processada automaticamente hoje no cartão cadastrado.'
   :`A cobrança será processada automaticamente no cartão cadastrado em ${days} dia${days===1?'':'s'}.`;
 }
 return days===0
  ?'A cobrança vence hoje. Abra os dados de pagamento para evitar atraso.'
  :`A cobrança vence em ${days} dia${days===1?'':'s'}. Você já pode abrir os dados de pagamento.`;
}
async function openUpcomingSubscriptionCharge(state,close){
 const warning=state?.billingWarning||{};
 const directUrl=warning.bankSlipUrl||warning.invoiceUrl;
 if(directUrl){
  const popup=window.open(directUrl,'_blank','noopener,noreferrer');
  if(!popup)toast('O navegador bloqueou a nova janela. Permita pop-ups para abrir a cobrança.','warning');
  close();
  return;
 }

 const popup=window.open('about:blank','_blank');
 try{
  const result=await cloud.request('/api/forge/subscription?payment=1');
  const payment=result?.payment||{};
  const url=payment.bankSlipUrl||payment.invoiceUrl;
  if(url){
   if(popup)popup.location.href=url;
   else window.open(url,'_blank','noopener,noreferrer');
   close();
   return;
  }
  if(popup)popup.close();
  setModalError('A cobrança ainda está sendo preparada pelo Asaas. Tente novamente em alguns instantes.');
 }catch(error){
  if(popup)popup.close();
  setModalError(error.message||'Não foi possível abrir a cobrança.');
 }
}
function showUpcomingBillingWarning(state){
 const warning=state?.billingWarning;
 if(!state?.active||!warning?.dueDate)return;

 const days=Number(warning.daysRemaining);
 if(!Number.isFinite(days)||days<0||days>3)return;

 const current=activeSubscription();
 const companyKey=String(current.companyId||current.companyName||'company').replace(/[^\w-]/g,'_');
 const shownKey=`forgepets_billing_warning_${companyKey}_${warning.dueDate}`;
 const todayKey=today();
 if(localStorage.getItem(shownKey)===todayKey)return;
 localStorage.setItem(shownKey,todayKey);

 const method=String(warning.billingType||state.billingType||'').toUpperCase();
 const automatic=method==='CREDIT_CARD';
 const dueLabel=new Date(`${warning.dueDate}T12:00:00`).toLocaleDateString('pt-BR');
 const title=billingWarningTitle(days);
 const description=billingWarningDescription(days,method);

 modal(
  title,
  `<div class="subscription-due-warning">
    <div class="subscription-due-hero">
      <span>🔔</span>
      <div>
        <small>ASSINATURA FORGEPETS</small>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(description)}</p>
      </div>
    </div>
    <div class="subscription-due-grid">
      <div><small>Plano</small><strong>${escapeHtml(state.plan||activePlan())}</strong></div>
      <div><small>Vencimento</small><strong>${escapeHtml(dueLabel)}</strong></div>
      <div><small>Valor previsto</small><strong>${money(warning.value||state.monthlyValue||0)}</strong></div>
      <div><small>Forma de pagamento</small><strong>${escapeHtml(subscriptionBillingTypeLabel(method))}</strong></div>
    </div>
    <div class="subscription-due-note ${automatic?'automatic':''}">
      ${automatic
        ?'✓ Não é necessário gerar PIX ou boleto. A tentativa será feita automaticamente no cartão cadastrado.'
        :'Para evitar interrupção, realize o pagamento até a data de vencimento. Após a confirmação do Asaas, o Forge Pets atualiza a assinatura automaticamente.'}
    </div>
  </div>`,
  async close=>{
   if(automatic){close();return;}
   await openUpcomingSubscriptionCharge(state,close);
  },
  automatic?'Entendi':'Ver cobrança'
 );

 const footerCancel=document.querySelector('#modalRoot .modal-footer [data-close]');
 if(footerCancel)footerCancel.textContent='Lembrar amanhã';
}

function showTrialWarning(state){
 if(sessionStorage.getItem('forgepets_trial_warning_shown')==='1')return;
 sessionStorage.setItem('forgepets_trial_warning_shown','1');
 const when=state.trialEndsAt?new Date(state.trialEndsAt).toLocaleString('pt-BR'):'em breve';
 modal('Seu teste está terminando',`<div class="trial-warning-card"><span>⏳</span><div><h3>Falta pouco para o fim do período grátis</h3><p>Seu acesso de teste termina em <b>${escapeHtml(when)}</b>. Escolha um plano agora para continuar usando o ForgePets sem interrupção.</p></div></div>`,close=>{close();setTimeout(()=>actions['show-plans']?.({}),80)},'Escolher plano');
}

function showExpiredTrialGate(state){
 const pending=state.paymentPending;
 const root=document.createElement('div');
 root.id='trialAccessOverlay';
 root.className='trial-access-overlay';
 root.innerHTML=`<section class="trial-access-card"><div class="trial-access-icon">${pending?'⌛':'🔒'}</div><span class="trial-access-eyebrow">FORGEPETS</span><h1>${pending?'Pagamento aguardando confirmação':'Seu período de teste terminou'}</h1><p>${pending?'Assim que o Asaas confirmar o pagamento, o sistema será liberado automaticamente.':'Para continuar usando o ForgePets, escolha um plano e realize o pagamento. Seus dados continuam salvos com segurança.'}</p><div class="trial-access-plan"><small>Plano selecionado</small><strong>${escapeHtml(state.pendingPlan||state.plan||activePlan())}</strong></div><div class="trial-access-actions"><button class="btn primary" id="trialChoosePlan">${pending?'Ver pagamento ou trocar forma':'Escolher plano e pagar'}</button><button class="btn ghost" id="trialCheckPayment">Verificar pagamento</button><button class="link-btn" id="trialLogout">Sair da conta</button></div><small class="trial-access-note">Nenhum cadastro foi apagado. O acesso será restaurado automaticamente após a confirmação.</small></section>`;
 document.body.appendChild(root);
 $('#trialChoosePlan').onclick=()=>{root.remove();actions['show-plans']?.({});};
 $('#trialCheckPayment').onclick=async()=>{const btn=$('#trialCheckPayment');btn.disabled=true;btn.textContent='Verificando…';await enforceSubscriptionAccess();if(document.body.contains(btn)){btn.disabled=false;btn.textContent='Verificar pagamento';}};
 $('#trialLogout').onclick=logout;
}
function logout(){
 localStorage.removeItem('forgePetsSession');
 fetch('/api/auth/logout',{method:'POST',credentials:'include'})
  .finally(()=>{window.top.location.href='/login';});
}

function go(target,{replace=false,fromHistory=false}={}){const next=ROUTE_ALIASES[String(target||'').toLowerCase()]||'dashboard';page=next;if(!fromHistory){const path=routeForPage(next);if(location.pathname!==path){history[replace?'replaceState':'pushState']({forgePetsPage:next},'',path);}}renderNav();render();window.scrollTo({top:0,behavior:'smooth'});}window.addEventListener('popstate',()=>go(pageFromLocation(),{fromHistory:true}));function renderNav(){const visible=NAV.filter(([id])=>id!=='fidelidade'||hasFeature('fidelidade'));if(page==='fidelidade'&&!hasFeature('fidelidade'))page='dashboard';$('#nav').innerHTML=visible.map(([id,icon,label])=>`<button class="nav-btn ${page===id?'active':''}" data-page="${id}"><i>${icon}</i><span>${label}</span></button>`).join('');document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>go(b.dataset.page));updatePlanUI();}
function updatePlanUI(){const sub=activeSubscription();const plan=activePlan();const license=document.querySelector('.footer-status span:nth-child(2) strong');if(license)license.textContent=plan;const product=document.querySelector('.footer-product small');if(product)product.textContent=`${sub.companyName||'Pet shop'} · Plano ${plan}`;}
function bindGlobal(){document.body.addEventListener('click',e=>{const a=e.target.closest('[data-action]');if(!a)return;e.preventDefault();actions[a.dataset.action]?.(a);});$('#backupInput').addEventListener('change',importBackup);$('#globalSearch').addEventListener('input',e=>searchAll(e.target.value));$('#globalSearch').addEventListener('keydown',e=>{if(e.key==='Escape'){e.target.value='';render();}});}

function validateRegisteredViews(){
 const menuModules=[...new Set(menu.map(item=>item[0]))].filter(module=>module!=='master');
 const missing=menuModules.filter(module=>typeof views[module]!=='function');
 if(missing.length)console.error('Forge Pets: rotas sem view registrada:',missing);
 return missing;
}

function render(){applyBranding();if(page==='fidelidade'&&!hasFeature('fidelidade')){page='dashboard';toast('O módulo Fidelidade está disponível nos planos Profissional e Premium.');renderNav();}const meta={dashboard:['Dashboard','Visão geral do pet shop'],clientes:['Clientes','Cadastro completo e histórico'],pets:['Pets','Cadastro e cuidados dos animais'],agenda:['Agenda','Organize os agendamentos'],atendimentos:['Atendimentos','Acompanhe o fluxo do dia'],servicos:['Serviços','Tabela de serviços e preços'],caixa:['Caixa','Entradas, saídas e fechamento'],estoque:['Estoque','Controle de produtos'],financeiro:['Financeiro','Resumo e análise financeira'],boletos:['Controle de boletos','Vencimentos e pagamentos das empresas'],relatorios:['Relatórios','Indicadores do negócio'],fidelidade:['Fidelidade','Pontos e recompensas dos clientes'],fiscal:['Módulo Fiscal','NFS-e, configurações e histórico fiscal'],marketplace:['Marketplace','Expanda o Forge Pets com módulos adicionais'],config:['Configurações','Dados gerais do sistema']}[page]||['ForgePets',''];$('#pageTitle').textContent=meta[0];$('#pageSubtitle').textContent=meta[1];const activeView=views[page];$('#content').innerHTML=activeView?activeView():`<div class="card route-error"><div class="empty"><h2>Página indisponível</h2><p>A rota <b>${escapeHtml(page)}</b> não possui uma tela registrada nesta versão.</p><button class="btn primary" data-action="go-dashboard">Voltar ao Dashboard</button></div></div>`;if(page==='config')bindSettingsUI();applyInputMasks($('#content'));updateNotificationBadge();}
const views={
 dashboard(){
  const d=today();
  const ag=db.data.agenda.filter(x=>x.data===d);
  const concl=ag.filter(x=>x.status==='Concluído').length;
  const entradasHoje=db.data.caixa.filter(x=>x.tipo==='entrada'&&x.data===d).reduce((sum,x)=>sum+Number(x.valor||0),0);
  const inicioMes=d.slice(0,7)+'-01';
  const entradasMes=db.data.caixa.filter(x=>x.tipo==='entrada'&&x.data>=inicioMes&&x.data<=d).reduce((sum,x)=>sum+Number(x.valor||0),0);
  const baixos=db.data.estoque.filter(x=>Number(x.qtd)<=Number(x.min||0));
  const cfg=db.data.config||{};
  const ultimos7=Array.from({length:7},(_,i)=>{const dt=new Date();dt.setDate(dt.getDate()-(6-i));const iso=dt.toISOString().slice(0,10);const valor=db.data.caixa.filter(x=>x.tipo==='entrada'&&x.data===iso).reduce((a,x)=>a+Number(x.valor||0),0);return {iso,dia:dt.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.',''),valor};});
  const maxDia=Math.max(...ultimos7.map(x=>x.valor),1);
  const serviceRank=db.data.servicos.map(s=>({nome:s.nome,total:db.data.agenda.filter(a=>a.servicoId===s.id&&a.status==='Concluído').length})).sort((a,b)=>b.total-a.total).slice(0,5);
  const maxService=Math.max(...serviceRank.map(x=>x.total),1);
  const recentes=[...db.data.pets].slice(-5).reverse();
  const avisos=[];
  if(baixos.length)avisos.push(`<button data-action="go-estoque"><span>⚠️</span><div><b>${baixos.length} produto${baixos.length>1?'s':''} com estoque baixo</b><small>Revise os itens antes que acabem.</small></div><i>→</i></button>`);
  if(ag.length-concl>0)avisos.push(`<button data-action="go-atendimentos"><span>📅</span><div><b>${ag.length-concl} atendimento${ag.length-concl>1?'s':''} pendente${ag.length-concl>1?'s':''} hoje</b><small>Acompanhe o andamento da agenda.</small></div><i>→</i></button>`);
  avisos.push(`<button data-action="go-financeiro"><span>💰</span><div><b>${money(entradasHoje)} faturados hoje</b><small>Consulte o fluxo financeiro completo.</small></div><i>→</i></button>`);
  return `<div class="company-hero"><div class="company-logo-wrap">${cfg.logo?`<img src="${cfg.logo}" alt="${escapeHtml(cfg.empresa||'Pet shop')}">`:'<span>🐾</span>'}</div><div><small>PAINEL DA EMPRESA</small><h2>${escapeHtml(cfg.empresa||'Meu Pet Shop')}</h2><p>${escapeHtml([cfg.cidade,cfg.estado].filter(Boolean).join(' - ')||'Gestão inteligente com ForgePets')}</p></div><button class="btn ghost" data-action="go-config">Personalizar empresa</button></div>
  <div class="dashboard-kpis">
    <div class="card kpi-card clickable" data-action="go-financeiro"><div class="kpi-top"><span class="kpi-icon purple">R$</span><span class="kpi-trend up">↗ Hoje</span></div><small>Receita de hoje</small><strong>${money(entradasHoje)}</strong><div class="kpi-spark"><i style="height:30%"></i><i style="height:48%"></i><i style="height:42%"></i><i style="height:70%"></i><i style="height:58%"></i><i style="height:86%"></i></div></div>
    <div class="card kpi-card clickable" data-action="go-financeiro"><div class="kpi-top"><span class="kpi-icon blue">▥</span><span class="kpi-trend up">↗ Mês atual</span></div><small>Receita do mês</small><strong>${money(entradasMes)}</strong><div class="kpi-spark"><i style="height:24%"></i><i style="height:38%"></i><i style="height:55%"></i><i style="height:46%"></i><i style="height:72%"></i><i style="height:92%"></i></div></div>
    <div class="card kpi-card clickable" data-action="go-agenda"><div class="kpi-top"><span class="kpi-icon orange">◷</span><span class="kpi-trend neutral">${concl} concluído${concl!==1?'s':''}</span></div><small>Agendamentos hoje</small><strong>${ag.length}</strong><div class="kpi-progress"><span style="width:${ag.length?Math.round(concl/ag.length*100):0}%"></span></div></div>
    <div class="card kpi-card clickable" data-action="go-clientes"><div class="kpi-top"><span class="kpi-icon green">♙</span><span class="kpi-trend up">Base ativa</span></div><small>Tutores cadastrados</small><strong>${db.data.clientes.length}</strong><div class="kpi-meta">${db.data.pets.length} pets vinculados</div></div>
  </div>
  <div class="dashboard-primary-grid">
    <div class="card revenue-card"><div class="section-title"><div><h2>Faturamento dos últimos 7 dias</h2><p>Entradas registradas no caixa</p></div><button class="link-btn" data-action="go-financeiro">Ver financeiro</button></div><div class="revenue-chart">${ultimos7.map(x=>`<div class="revenue-column" title="${money(x.valor)}"><b>${x.valor?money(x.valor).replace(/R\$\s?/,''):''}</b><i style="height:${Math.max(x.valor/maxDia*100,x.valor?8:2)}%"></i><span>${x.dia}</span></div>`).join('')}</div></div>
    <div class="card services-ranking"><div class="section-title"><div><h2>Serviços mais realizados</h2><p>Ranking de atendimentos concluídos</p></div><button class="link-btn" data-action="go-servicos">Ver serviços</button></div><div class="ranking-list">${serviceRank.length?serviceRank.map((x,i)=>`<div class="ranking-item"><span class="rank-number">${i+1}</span><div><b>${escapeHtml(x.nome)}</b><div class="rank-track"><i style="width:${Math.max(x.total/maxService*100,8)}%"></i></div></div><strong>${x.total}</strong></div>`).join(''):'<div class="empty compact">Conclua atendimentos para gerar o ranking.</div>'}</div></div>
  </div>
  <div class="notice-center card"><div class="section-title"><div><h2>Centro de avisos</h2><p>O que precisa da sua atenção agora</p></div><span class="badge green">Atualizado</span></div><div class="notice-grid">${avisos.join('')}</div></div>
  <div class="dashboard-secondary-grid">
    <div class="card"><div class="section-title"><div><h2>Próximos agendamentos</h2><p>Compromissos do dia</p></div><button class="link-btn" data-action="go-agenda">Ver agenda</button></div>${agendaList(ag.slice(0,5))}</div>
    <div class="card"><div class="section-title"><div><h2>Pets recentes</h2><p>Últimos animais cadastrados</p></div><button class="link-btn" data-action="go-pets">Ver todos</button></div><div class="recent-pets">${recentes.length?recentes.map(p=>{const tutor=db.data.clientes.find(c=>c.id===p.clienteId);return `<button data-action="pet-details" data-id="${p.id}"><span>${p.especie==='Felino'?'🐱':'🐶'}</span><div><b>${escapeHtml(p.nome)}</b><small>${escapeHtml(tutor?.nome||'Tutor não informado')}</small></div><i>→</i></button>`}).join(''):'<div class="empty compact">Nenhum pet cadastrado.</div>'}</div></div>
    <div class="card"><div class="section-title"><div><h2>Estoque baixo</h2><p>Itens que precisam de reposição</p></div><button class="link-btn" data-action="go-estoque">Ver estoque</button></div><div class="stock-low">${baixos.slice(0,5).map(x=>`<div class="stock-item"><span><b>${escapeHtml(x.nome)}</b><small>Mínimo: ${x.min||0}</small></span><strong>${x.qtd} un.</strong></div>`).join('')||'<div class="empty compact">Estoque em dia.</div>'}</div></div>
  </div>
  <div class="card quick-card"><div class="section-title"><div><h2>Ações rápidas</h2><p>Atalhos para as tarefas mais usadas</p></div></div><div class="quick-actions"><div class="quick-action"><button data-action="quick-appointment">＋</button><span>Novo agendamento</span></div><div class="quick-action"><button data-action="new-client">♙</button><span>Novo tutor</span></div><div class="quick-action"><button data-action="new-pet-select">🐾</button><span>Novo pet</span></div><div class="quick-action"><button data-action="new-entry">🛒</button><span>Nova venda</span></div><div class="quick-action"><button data-action="new-service">✂</button><span>Novo serviço</span></div><div class="quick-action"><button data-action="new-expense">R$</button><span>Nova despesa</span></div></div></div>
  <div class="card dashboard-plan-card">
    <div class="dashboard-plan-icon">◆</div>
    <div class="dashboard-plan-copy"><span>PLANO E ASSINATURA</span><h2>Seu plano atual é ${activePlan()}</h2><p>${money(planPrice())} por mês · Próxima cobrança: <b>${nextChargeLabel()}</b> · ${paymentMethodLabel(activeSubscription().paymentMethod)}</p></div>
    <div class="dashboard-plan-actions"><span class="badge green">Ativo</span><button class="btn primary" data-action="show-plans">Ver planos e trocar</button></div>
  </div>`
 },

 clientes(){const rows=sortAlpha(db.data.clientes,'nome').filter(c=>[c.nome,c.telefone,c.cpf,c.email].some(v=>normalize(v).includes(normalize(clientSearch))));return `<div class="card"><div class="section-title"><h2>Clientes</h2><button class="btn primary" data-action="new-client">Novo cliente</button></div><div class="list-search"><span>⌕</span><input value="${escapeAttr(clientSearch)}" placeholder="Buscar cliente por nome, telefone, CPF ou e-mail..." oninput="setClientSearch(this.value)"></div><div class="result-count">${rows.length} cliente(s) encontrado(s) · ordem alfabética</div><div class="table-wrap">${rows.length?`<table class="table"><thead><tr><th>Nome</th><th>WhatsApp</th><th>Pets</th><th>Cashback</th><th></th></tr></thead><tbody>${rows.map(c=>`<tr class="clickable" data-action="view-client" data-id="${c.id}"><td><strong>${c.nome}</strong></td><td>${c.telefone||'-'}</td><td><div class="pet-chips">${sortAlpha(db.data.pets.filter(p=>p.clienteId===c.id),'nome').map(p=>`<button type="button" class="chip chip-button" data-action="view-pet" data-id="${p.id}">${p.nome}</button>`).join('')||'-'}</div></td><td><strong>${money(c.cashback||0)}</strong></td><td><button class="btn ghost" data-action="new-pet" data-id="${c.id}">Adicionar pet</button> <button class="btn danger" data-action="delete-client" data-id="${c.id}">Excluir</button></td></tr>`).join('')}</tbody></table>`:`<div class="empty">${clientSearch?'Nenhum cliente encontrado.':'Nenhum cliente cadastrado.'}</div>`}</div></div>`},
 agenda(){
  const date=selectedAgendaDate();
  const rows=[...db.data.agenda]
   .filter(item=>item.data===date)
   .sort((a,b)=>a.hora.localeCompare(b.hora));
  const completed=rows.filter(item=>item.status==='Concluído').length;
  const pending=rows.filter(item=>!['Concluído','Cancelado','Não compareceu'].includes(item.status)).length;
  return `<section class="agenda-day-workspace">
   <div class="card agenda-date-toolbar">
    <div><span>AGENDA DO DIA</span><h2>${formatDateBR(date)}</h2><p>${date===today()?'Hoje':formatAgendaDate(date).weekday}</p></div>
    <div class="agenda-date-controls">
     <div class="field"><label>Selecionar data</label><input id="agendaDatePicker" type="date" value="${escapeAttr(date)}"></div>
     <button class="btn primary" data-action="apply-agenda-date">Visualizar</button>
     <button class="btn ghost" data-action="agenda-today">Hoje</button>
     <button class="btn primary" data-action="quick-appointment">＋ Novo agendamento</button>
    </div>
   </div>
   <div class="agenda-day-stats">
    <article><small>Total do dia</small><strong>${rows.length}</strong></article>
    <article><small>Em aberto</small><strong>${pending}</strong></article>
    <article><small>Concluídos</small><strong>${completed}</strong></article>
   </div>
   <div class="card">
    <div class="section-title"><div><h2>Compromissos de ${formatDateBR(date)}</h2><p>A Agenda mostra somente a data selecionada.</p></div></div>
    ${agendaList(rows)}
   </div>
  </section>`;
 },
 servicos(){const rows=sortAlpha(db.data.servicos,'nome');return `<div class="card"><div class="section-title"><h2>Serviços</h2><button class="btn primary" data-action="new-service">Novo serviço</button></div>${rows.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Serviço</th><th>Valor</th><th>Duração</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td>${escapeHtml(x.nome)}</td><td><strong>${money(x.valor)}</strong></td><td>${Number(x.duracao||60)} min</td><td><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn ghost" data-action="edit-service" data-id="${x.id}">Editar</button><button class="btn danger" data-action="delete-row" data-type="service" data-id="${x.id}">Excluir</button></div></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Nenhum serviço cadastrado.</div>'}</div>`},

 caixa(){
  const abertas=db.data.pendencias.filter(x=>x.status==='aberto');
  const totalReceber=abertas.reduce((s,x)=>s+Number(x.valor||0),0);
  const vendasHoje=(db.data.vendas||[]).filter(v=>String(v.data||v.createdAt||'').slice(0,10)===today());
  const totalHoje=vendasHoje.reduce((s,v)=>s+Number(v.total||v.valor||0),0);
  const ultimas=[...(db.data.caixa||[])].reverse().slice(0,8);
  return `<section class="cash-workspace">
    <div class="cash-hero">
      <div class="cash-hero-copy">
        <span class="cash-kicker">PDV FORGEPETS</span>
        <h2>Venda rápida, recebimento e troco em uma única tela.</h2>
        <p>Adicione produtos e serviços, escolha a forma de pagamento e calcule automaticamente o troco quando o cliente pagar em dinheiro.</p>
        <div class="cash-hero-actions">
          <button class="btn cash-primary-action" data-action="new-entry">＋ Iniciar nova venda</button>
          <button class="btn ghost" data-action="quick-movement" data-preset="entrada">Registrar entrada</button>
          <button class="btn ghost" data-action="quick-movement" data-preset="saida">Registrar saída</button>
        </div>
      </div>
    </div>

    <div class="cash-metrics">
      <article><span>Saldo atual</span><strong>${money(balance())}</strong><small>Entradas menos saídas</small></article>
      <article><span>Entradas</span><strong>${money(sumType('entrada'))}</strong><small>Movimentações recebidas</small></article>
      <article><span>A receber</span><strong>${money(totalReceber)}</strong><small>${abertas.length} atendimento(s) pendente(s)</small></article>
      <article><span>Saídas</span><strong>${money(sumType('saida'))}</strong><small>Despesas registradas</small></article>
    </div>

    <div class="cash-columns">
      <div class="cash-panel cash-pending-panel">
        <div class="cash-panel-head"><div><span class="cash-kicker">RECEBIMENTOS</span><h3>Atendimentos aguardando pagamento</h3><p>Receba o atendimento e envie o valor diretamente para o caixa.</p></div><button class="btn primary" data-action="new-entry">＋ Nova venda</button></div>
        ${abertas.length?`<div class="cash-pending-list">${abertas.map(x=>`<article class="cash-pending-item"><div class="cash-pet-avatar">🐾</div><div class="cash-pending-copy"><strong>${escapeHtml(x.pet||'Pet')}</strong><span>${escapeHtml(x.tutor||'Tutor')} · ${escapeHtml(x.servico||'Serviço')}</span><small>${x.data||''}</small></div><div class="cash-pending-value"><strong>${money(x.valor)}</strong><button class="btn primary" data-action="receive-service" data-id="${x.id}">Receber</button></div></article>`).join('')}</div>`:'<div class="cash-empty"><span>✓</span><strong>Nenhum pagamento pendente</strong><p>Os atendimentos finalizados aparecerão aqui.</p></div>'}
      </div>

      <aside class="cash-panel cash-quick-panel">
        <div class="cash-panel-head"><div><span class="cash-kicker">ATALHOS</span><h3>Operações rápidas</h3></div></div>
        <button data-action="new-entry"><span>🛒</span><div><strong>Nova venda no PDV</strong><small>Produtos, serviços e troco</small></div><b>›</b></button>
        <button data-action="quick-movement" data-preset="entrada"><span>↘</span><div><strong>Nova entrada</strong><small>Recebimento avulso</small></div><b>›</b></button>
        <button data-action="quick-movement" data-preset="saida"><span>↗</span><div><strong>Nova saída</strong><small>Despesa ou retirada</small></div><b>›</b></button>
        <button data-action="go-financeiro"><span>▤</span><div><strong>Ver financeiro</strong><small>Relatórios e movimentações</small></div><b>›</b></button>
      </aside>
    </div>

    <div class="cash-panel cash-history-panel">
      <div class="cash-panel-head"><div><span class="cash-kicker">MOVIMENTAÇÕES</span><h3>Últimos lançamentos pagos</h3></div><button class="btn primary" data-action="quick-movement">Nova movimentação</button></div>
      ${ultimas.length?tableSimple(ultimas,['data','descricao','tipo','valor'],x=>[x.data,x.descricao,`<span class="badge ${x.tipo==='entrada'?'green':'red'}">${x.tipo}</span>`,money(x.valor)],'cash'):'<div class="cash-empty"><span>R$</span><strong>Nenhuma movimentação registrada</strong><p>As vendas finalizadas e lançamentos aparecerão aqui.</p></div>'}
    </div>
  </section>`;
 },

 fiscal(){
  setTimeout(()=>loadFiscalExperience(),0);
  return `<section class="fiscal-experience"><div class="fiscal-loading"><span class="fiscal-loader"></span><h2>Carregando Módulo Fiscal</h2><p>Consultando assinatura, configuração e documentos da empresa.</p></div></section>`;
 },
 marketplace(){
  const sub=activeSubscription();
  const selectedModules=Array.isArray(sub.modules)?sub.modules:[];
  const activeModules=Array.isArray(sub.activeModules)?sub.activeModules:[];
  const fiscalSelected=selectedModules.includes('FISCAL');
  const fiscalActive=activeModules.includes('FISCAL')||(sub.status==='active'&&fiscalSelected);
  const fiscalPending=!fiscalActive&&fiscalSelected;
  const fiscalAction=fiscalActive
   ? '<button class="btn primary" data-action="go-fiscal">Abrir Módulo Fiscal</button>'
   : fiscalPending
    ? '<button class="btn ghost" disabled>Pagamento pendente</button>'
    : `<button class="btn primary" data-action="request-plan" data-plan="${escapeAttr(activePlan())}" data-module="FISCAL">Contratar agora</button>`;
  return `<section class="marketplace-page"><div class="marketplace-hero"><div><span>FORGE PETS MARKETPLACE</span><h2>Seu sistema cresce junto com o seu negócio.</h2><p>Ative novos recursos quando precisar. A cobrança é adicionada à sua assinatura mensal e o aceite fica registrado eletronicamente.</p></div><div class="marketplace-current"><small>Plano atual</small><strong>${escapeHtml(activePlan())}</strong><span>${money(planPrice())}/mês</span></div></div><div class="marketplace-grid"><article class="marketplace-card featured"><div class="marketplace-card-top"><span class="marketplace-icon">🧾</span><div><small>DISPONÍVEL AGORA</small><h3>Módulo Fiscal</h3></div>${fiscalActive?'<i class="module-status active">ATIVO</i>':fiscalPending?'<i class="module-status pending">PENDENTE</i>':'<i class="module-status available">OPCIONAL</i>'}</div><p>Emita NFS-e dos serviços realizados diretamente pelo Caixa. Consulte o histórico, baixe XML e PDF e envie a nota ao cliente. Disponibilidade conforme a integração do município.</p><ul><li>Emissão de notas pelo Caixa</li><li>Histórico fiscal por venda</li><li>XML e PDF da NFS-e</li><li>Dados separados por empresa</li></ul><div class="marketplace-price"><strong>R$ 49,00</strong><span>por mês</span></div>${fiscalAction}</article><article class="marketplace-card"><div class="marketplace-card-top"><span class="marketplace-icon">💬</span><div><small>EM BREVE</small><h3>WhatsApp Oficial</h3></div></div><p>Confirmações, lembretes e mensagens automáticas usando a API oficial.</p><div class="marketplace-price"><strong>R$ 39,00</strong><span>por mês</span></div><button class="btn ghost" disabled>Em breve</button></article><article class="marketplace-card"><div class="marketplace-card-top"><span class="marketplace-icon">📅</span><div><small>EM BREVE</small><h3>Agendamento Online</h3></div></div><p>Página pública para o tutor solicitar horários sem ligar para o pet shop.</p><div class="marketplace-price"><strong>R$ 39,00</strong><span>por mês</span></div><button class="btn ghost" disabled>Em breve</button></article><article class="marketplace-card"><div class="marketplace-card-top"><span class="marketplace-icon">🤖</span><div><small>EM BREVE</small><h3>IA Forge</h3></div></div><p>Textos, sugestões, análises e automações inteligentes para a rotina da empresa.</p><div class="marketplace-price"><strong>R$ 29,00</strong><span>por mês</span></div><button class="btn ghost" disabled>Em breve</button></article></div><div class="marketplace-note">A contratação do Módulo Fiscal abre o checkout, apresenta o valor total mensal e exige o aceite eletrônico antes da cobrança pelo Asaas.</div></section>`;
 },
 estoque(){
 ensureData();
 const rows=sortAlpha(db.data.estoque,'nome');
 const low=rows.filter(item=>Number(item.qtd||0)<=Number(item.min||0)).length;
 const totalUnits=rows.reduce((sum,item)=>sum+Number(item.qtd||0),0);
 const inventoryCost=rows.reduce((sum,item)=>sum+Number(item.qtd||0)*Number(item.custo||0),0);
 return `<section class="stock-workspace">
  <div class="stock-hero"><div><span>ESTOQUE FORGEPETS</span><h2>Reposição sem recadastrar produto.</h2><p>Clique no produto para adicionar nova compra, retirar estoque ou editar.</p></div><button class="btn primary" data-action="new-stock">＋ Novo produto</button></div>
  <div class="stock-kpis"><article><small>Produtos cadastrados</small><strong>${rows.length}</strong></article><article><small>Unidades em estoque</small><strong>${totalUnits}</strong></article><article class="${low?'warning':''}"><small>Estoque baixo</small><strong>${low}</strong></article><article><small>Custo em estoque</small><strong>${money(inventoryCost)}</strong></article></div>
  <div class="card"><div class="section-title"><div><h2>Produtos</h2><p>Clique na linha para movimentar ou editar.</p></div></div>
   ${rows.length?`<div class="table-wrap"><table class="table stock-table"><thead><tr><th>Produto</th><th>EAN</th><th>Qtd.</th><th>Mínimo</th><th>Custo</th><th>Venda</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(item=>{const lowStock=Number(item.qtd||0)<=Number(item.min||0);return `<tr class="clickable stock-product-row" data-action="open-stock-product" data-id="${item.id}"><td><b>${escapeHtml(item.nome)}</b><small class="table-sub">${escapeHtml([item.marca,item.categoria].filter(Boolean).join(' · ')||'Sem categoria')}</small></td><td>${escapeHtml(item.ean||'—')}</td><td><strong>${Number(item.qtd||0)}</strong> ${escapeHtml(item.unidade||'')}</td><td>${Number(item.min||0)}</td><td>${money(item.custo||0)}</td><td>${money(item.valorVenda??item.custo??0)}</td><td><span class="badge ${lowStock?'red':'green'}">${lowStock?'Baixo':'OK'}</span></td><td><button class="btn ghost small" data-action="open-stock-product" data-id="${item.id}">Abrir</button></td></tr>`}).join('')}</tbody></table></div>`:'<div class="empty">Nenhum produto cadastrado.</div>'}
  </div>
 </section>`;
},
 pets(){const rows=sortAlpha(db.data.pets,'nome').filter(p=>{const c=db.data.clientes.find(x=>x.id===p.clienteId);return [p.nome,c?.nome].some(v=>normalize(v).includes(normalize(petSearch)))});return `<div class="card"><div class="section-title"><h2>Pets cadastrados</h2><button class="btn primary" data-action="new-pet-select">Novo pet</button></div><div class="list-search"><span>⌕</span><input value="${escapeAttr(petSearch)}" placeholder="Buscar pelo nome do pet ou do tutor..." oninput="setPetSearch(this.value)"></div><div class="result-count">${rows.length} pet(s) encontrado(s) · ordem alfabética</div>${rows.length?`<div class="table-wrap"><table class="table pet-list-table"><thead><tr><th>Pet</th><th>Tutor</th><th>Espécie / raça</th><th>Cor</th><th></th></tr></thead><tbody>${rows.map(p=>{const c=db.data.clientes.find(x=>x.id===p.clienteId);return `<tr class="clickable" data-action="view-pet" data-id="${p.id}"><td><span class="pet-list-name"><span class="mini-avatar">${p.especie==='Felino'?'🐱':p.especie==='Canino'?'🐶':'🐾'}</span><strong>${p.nome}</strong></span></td><td>${c?.nome||'-'}</td><td>${p.especie||'-'}${p.raca?` · ${p.raca}`:''}</td><td>${p.cor||'-'}</td><td><button class="btn ghost" data-action="view-pet" data-id="${p.id}">Ver ficha</button> <button class="btn ghost" data-action="edit-pet" data-id="${p.id}">Editar</button> <button class="btn danger" data-action="delete-pet" data-id="${p.id}">Excluir</button></td></tr>`}).join('')}</tbody></table></div>`:`<div class="empty">${petSearch?'Nenhum pet encontrado.':'Nenhum pet cadastrado.'}</div>`}</div>`},
 atendimentos(){
  const filters=attendanceFilterState();
  const rows=filteredAttendances();
  return `<section class="attendance-workspace">
   <div class="card attendance-filter-card">
    <div class="section-title"><div><h2>Histórico de atendimentos</h2><p>Todos os atendimentos agrupados por data, com busca e filtro por período.</p></div><button class="btn primary" data-action="quick-appointment">＋ Novo atendimento</button></div>
    <div class="attendance-filter-grid">
     <div class="field"><label>De</label><input id="attendanceFrom" type="date" value="${escapeAttr(filters.from||'')}"></div>
     <div class="field"><label>Até</label><input id="attendanceTo" type="date" value="${escapeAttr(filters.to||'')}"></div>
     <div class="field attendance-search"><label>Buscar</label><input id="attendanceSearch" value="${escapeAttr(filters.search||'')}" placeholder="Pet, tutor, serviço, CPF..."></div>
     <button class="btn primary" data-action="apply-attendance-filter">Filtrar</button>
     <button class="btn ghost" data-action="clear-attendance-filter">Limpar</button>
    </div>
    <div class="status-tabs">
     <button class="btn ghost ${filters.status==='todos'?'active':''}" data-action="filter-status" data-status="todos">Todos</button>
     <button class="btn ghost ${filters.status==='Agendado'?'active':''}" data-action="filter-status" data-status="Agendado">Aguardando</button>
     <button class="btn ghost ${filters.status==='Concluído'?'active':''}" data-action="filter-status" data-status="Concluído">Finalizados</button>
     <button class="btn ghost ${filters.status==='Cancelado'?'active':''}" data-action="filter-status" data-status="Cancelado">Cancelados</button>
    </div>
   </div>
   <div class="attendance-results-head"><span>${rows.length} atendimento(s) encontrado(s)</span>${(filters.from||filters.to)?`<small>${filters.from?formatDateBR(filters.from):'Início'} até ${filters.to?formatDateBR(filters.to):'Hoje'}</small>`:''}</div>
   ${attendanceGroups(rows)}
  </section>`;
 },
 financeiro(){
  ensureData();
  const summary=financePeriodSummary();
  const filter=window.financeExpenseFilter||'all';
  const expenses=filter==='all'?summary.payables:summary.payables.filter(item=>expenseStatus(item)===filter);
  const expenseRows=expenses.length?expenses.map(expense=>{
   const status=expenseStatus(expense);
   return `<tr>
    <td><b>${escapeHtml(expense.descricao||'Despesa')}</b><small class="table-sub">${escapeHtml(expense.categoria||'Geral')}</small></td>
    <td>${formatDateBR(expense.vencimento)}</td>
    <td><span class="badge ${expenseStatusClass(status)}">${expenseStatusLabel(status)}</span></td>
    <td><b>${money(Number(expense.valor||0)+Number(expense.juros||0)+Number(expense.multa||0))}</b></td>
    <td>${expense.status==='pago'?'<span class="badge green">Paga</span>':`<button class="btn primary small" data-action="pay-expense" data-id="${expense.id}">Marcar paga</button>`} <button class="btn ghost small" data-action="edit-expense" data-id="${expense.id}">Editar</button> <button class="btn danger small" data-action="delete-expense" data-id="${expense.id}">Excluir</button></td>
   </tr>`;
  }).join(''):'<tr><td colspan="5"><div class="empty">Nenhuma despesa neste período.</div></td></tr>';

  const movementRows=summary.transactions.length?summary.transactions.slice().reverse().map(item=>`<tr>
   <td>${formatDateBR(item.data)}</td><td><b>${escapeHtml(item.descricao||'Movimentação')}</b></td>
   <td><span class="badge ${item.tipo==='entrada'?'green':'red'}">${item.tipo==='entrada'?'Entrada':'Saída'}</span></td>
   <td><b>${money(item.valor)}</b></td>
   <td><button class="btn danger small" data-action="delete-finance-transaction" data-id="${item.id}">Excluir</button></td>
  </tr>`).join(''):'<tr><td colspan="5"><div class="empty">Nenhuma movimentação neste período.</div></td></tr>';

  return `<section class="finance-workspace">
   ${financePeriodControls()}
   <div class="finance-hero">
    <div><span class="finance-eyebrow">VISÃO FINANCEIRA DO PERÍODO</span><h2>Realizado e previsto, sem misturar</h2><p>Todos os números abaixo respeitam o filtro selecionado.</p></div>
    <div class="finance-hero-actions"><button class="btn primary" data-action="new-revenue">＋ Nova receita</button><button class="btn ghost" data-action="new-paid-expense">＋ Registrar saída paga</button><button class="btn ghost" data-action="finance-trash">♻ Lixeira</button></div>
   </div>
   <div class="finance-kpis">
    <article class="finance-kpi real"><span>💰</span><small>Saldo realizado</small><strong>${money(summary.realBalance)}</strong><em>Entradas menos saídas pagas</em></article>
    <article><span>🟢</span><small>Entradas realizadas</small><strong>${money(summary.incomeReal)}</strong><em>Recebidas no período</em></article>
    <article><span>🔻</span><small>Saídas realizadas</small><strong>${money(summary.expenseReal)}</strong><em>Pagas no período</em></article>
    <article><span>🔵</span><small>Receitas previstas</small><strong>${money(summary.pendingIncome)}</strong><em>A receber no período</em></article>
    <article class="warning"><span>🟠</span><small>Despesas a vencer</small><strong>${money(summary.upcoming)}</strong><em>Vencimento futuro no filtro</em></article>
    <article class="today"><span>🟡</span><small>Vencem hoje</small><strong>${money(summary.dueToday)}</strong><em>Compromissos de hoje</em></article>
    <article class="danger"><span>🔴</span><small>Despesas vencidas</small><strong>${money(summary.overdue)}</strong><em>Vencidas dentro do filtro</em></article>
    <article class="forecast"><span>📈</span><small>Saldo previsto</small><strong>${money(summary.forecastBalance)}</strong><em>Real + previstas − pendentes</em></article>
   </div>
   <div class="finance-alert-strip">
    <div><b>Após compromissos</b><span>${money(summary.availableAfterExpenses)}</span></div>
    <div><b>Projeção completa</b><span>${money(summary.forecastBalance)}</span></div>
   </div>
   <div class="card">
    <div class="section-title"><div><h2>Contas a pagar</h2><p>Filtradas pela data de vencimento.</p></div><button class="btn primary" data-action="new-pending-expense">Nova conta a pagar</button></div>
    <div class="finance-tabs">${financeFilterButton('all','Todas',filter,summary.payables.length)}${financeFilterButton('overdue','Vencidas',filter,summary.overdueCount)}${financeFilterButton('today','Vencem hoje',filter,summary.dueTodayCount)}${financeFilterButton('upcoming','A vencer',filter,summary.upcomingCount)}${financeFilterButton('paid','Pagas',filter,summary.paidCount)}</div>
    <div class="table-wrap"><table class="table"><thead><tr><th>Despesa</th><th>Vencimento</th><th>Situação</th><th>Valor atualizado</th><th>Ações</th></tr></thead><tbody>${expenseRows}</tbody></table></div>
   </div>
   <div class="card">
    <div class="section-title"><div><h2>Movimentações realizadas</h2><p>Entradas e saídas efetivas do período.</p></div><button class="btn ghost" data-action="quick-movement">Nova movimentação</button></div>
    <div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th><th></th></tr></thead><tbody>${movementRows}</tbody></table></div>
   </div>
  </section>`;
 },
 boletos(){
  ensureData();
  const rows=[...db.data.boletos].sort((a,b)=>(a.vencimento||'').localeCompare(b.vencimento||''));
  const abertos=rows.filter(x=>x.status!=='pago'&&x.status!=='cancelado');
  const total=abertos.reduce((s,x)=>s+Number(x.valor||0)+Number(x.juros||0)+Number(x.multa||0),0);
  const amanha=daysFromNow(1);
  const groups=[...new Set(rows.map(x=>x.loteId||x.id))].map(id=>rows.filter(x=>(x.loteId||x.id)===id));
  const groupCards=groups.map(batch=>{
   const first=batch[0],summary=boletoBatchSummary(batch);
   const noteLabel=first.numeroNota?`Nota ${escapeHtml(first.numeroNota)}`:'Nota sem número';
   return `<article class="boleto-note-card">
    <div class="boleto-note-head">
     <div><span>${noteLabel}</span><h3>${escapeHtml(first.empresa||'Fornecedor')}</h3><small>${escapeHtml(first.categoria||'Sem categoria')} · ${batch.length} parcela(s)</small></div>
     <div><small>Total financeiro</small><strong>${money(summary.total)}</strong></div>
    </div>
    <div class="boleto-note-summary">
     <div><small>Valor da nota</small><b>${money(summary.original)}</b></div>
     <div><small>Imposto</small><b>${money(summary.tax)}</b></div>
     <div><small>Pago</small><b>${money(summary.paid)}</b></div>
     <div><small>Pendente</small><b>${money(summary.pending)}</b></div>
    </div>
    <div class="table-wrap"><table class="table"><thead><tr><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Juros/Multa</th><th>Status</th><th></th></tr></thead><tbody>
    ${batch.map(x=>`<tr>
     <td><b>${x.parcela||1}/${x.quantidade||1}</b></td>
     <td>${formatDateBR(x.vencimento)}</td>
     <td><strong>${money(x.valor)}</strong></td>
     <td>${money(Number(x.juros||0)+Number(x.multa||0))}</td>
     <td><span class="badge ${x.status==='pago'?'green':x.vencimento<today()?'red':'yellow'}">${x.status==='pago'?'Pago':x.vencimento<today()?'Vencido':'Em aberto'}</span></td>
     <td><button class="btn ghost small" data-action="edit-boleto" data-id="${x.id}">Editar</button> ${x.status!=='pago'?`<button class="btn primary small" data-action="pay-boleto" data-id="${x.id}">Marcar pago</button>`:''} <button class="btn danger small" data-action="delete-boleto" data-id="${x.id}">Excluir</button></td>
    </tr>`).join('')}
    </tbody></table></div>
   </article>`;
  }).join('');

  return `<div class="grid stats boleto-stats">
   <div class="card stat"><div class="label">Parcelas em aberto</div><div class="value">${abertos.length}</div></div>
   <div class="card stat"><div class="label">Total pendente</div><div class="value">${money(total)}</div></div>
   <div class="card stat"><div class="label">Vencem amanhã</div><div class="value">${abertos.filter(x=>x.vencimento===amanha).length}</div></div>
  </div>
  <div class="card" style="margin-top:16px">
   <div class="section-title"><div><h2>Controle de boletos por nota</h2><p>Cadastre o total da nota e deixe o sistema dividir as parcelas automaticamente.</p></div><button class="btn primary" data-action="new-boleto-batch">Nova nota / boleto</button></div>
   <div class="boleto-note-list">${groupCards||'<div class="empty">Nenhum boleto cadastrado.</div>'}</div>
  </div>`;
 },
 relatorios(){return reportView()},
 fidelidade(){
  const plan=activePlan(),clientes=db.data.clientes||[];
  if(!hasFeature('fidelidade'))return `<div class="card locked-module"><div class="locked-icon">🔒</div><h2>Programa de fidelidade</h2><p>Disponível a partir do Plano Profissional.</p><button class="btn primary" data-action="show-plans">Conhecer planos</button></div>`;
  runPremiumAutomations();
  const pontosTotal=clientes.reduce((s,c)=>s+Number(c.pontos||0),0),cashbackTotal=clientes.reduce((s,c)=>s+Number(c.cashback||0),0),report=loyaltyReport();
  const activeCoupons=db.data.cupons.filter(c=>c.status==='ativo'&&(!c.validade||c.validade>=today()));
  const ranking=[...clientes].sort((a,b)=>(Number(b.pontos||0)+Number(b.cashback||0)*10)-(Number(a.pontos||0)+Number(a.cashback||0)*10)).slice(0,5);
  const history=(db.data.loyaltyHistory||[]).slice(0,10);
  return `<div class="loyalty-hero"><div><span class="plan-chip">Plano ${plan}</span><h2>Programa de fidelidade</h2><p>${plan==='Profissional'?'Pontos, cashback, resgates, extratos e relatórios completos.':'Fidelidade completa com níveis VIP, cupons e campanhas automáticas.'}</p></div><div class="loyalty-actions"><button class="btn ghost" data-action="loyalty-settings">Configurar regras</button><button class="btn primary" data-action="add-points">Adicionar pontos</button></div></div>
  <div class="loyalty-kpis"><div class="card"><small>Pontos em circulação</small><strong>${pontosTotal.toLocaleString('pt-BR')}</strong><span>Saldo atual dos tutores</span></div><div class="card"><small>Cashback disponível</small><strong>${money(cashbackTotal)}</strong><span>Utilizável no Caixa</span></div><div class="card"><small>Recompensas resgatadas</small><strong>${report.redeemed.filter(x=>x.tipo==='pontos_resgatados').length}</strong><span>Histórico registrado</span></div><div class="card"><small>${hasFeature('vip')?'Cupons ativos':'Tutores fidelizados'}</small><strong>${hasFeature('vip')?activeCoupons.length:clientes.filter(c=>Number(c.pontos||0)>0||Number(c.cashback||0)>0).length}</strong><span>${hasFeature('vip')?'Automáticos e válidos':'Com saldo de pontos ou cashback'}</span></div></div>
  <div class="loyalty-grid"><div class="card"><div class="section-title"><div><h2>Tutores e benefícios</h2><p>Cashback e recompensas podem ser usados diretamente no Caixa.</p></div></div>${clientes.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Tutor</th><th>Pontos</th><th>Cashback</th>${hasFeature('vip')?'<th>Nível / benefício</th>':''}<th></th></tr></thead><tbody>${clientes.map(c=>{const nivel=vipLevel(c);return `<tr><td><button class="link-btn" data-action="view-client" data-id="${c.id}"><strong>${escapeHtml(c.nome)}</strong></button></td><td><strong>${Number(c.pontos||0)}</strong></td><td>${money(c.cashback||0)}</td>${hasFeature('vip')?`<td><span class="vip-badge ${nivel.toLowerCase()}">${nivel}</span> <small>${vipDiscount(c)}% benefício</small></td>`:''}<td><button class="btn ghost" data-action="redeem-reward" data-id="${c.id}">Resgatar</button> <button class="btn ghost" data-action="adjust-loyalty" data-id="${c.id}">Ajustar saldos</button></td></tr>`}).join('')}</tbody></table></div>`:'<div class="empty">Cadastre tutores para começar.</div>'}</div>
  <div class="loyalty-side"><div class="card"><div class="section-title"><h2>Catálogo de recompensas</h2><button class="btn ghost" data-action="new-reward">Nova</button></div>${db.data.recompensas.filter(r=>r.ativo!==false).map(r=>`<div class="reward-row"><div><b>${escapeHtml(r.nome)}</b><small>${money(r.valor||0)} de benefício</small></div><strong>${Number(r.pontos)} pts</strong></div>`).join('')}</div>${hasFeature('vip')?`<div class="card"><div class="section-title"><h2>Campanhas automáticas</h2></div>${db.data.campanhas.slice(0,5).map(x=>{const c=clientes.find(c=>c.id===x.clienteId);return `<div class="campaign-row"><div><b>${escapeHtml(c?.nome||'Tutor')}</b><small>${x.status==='enviada'?'Enviada':'Pronta para WhatsApp'}</small></div><button class="btn ghost" data-action="send-campaign" data-id="${x.id}">${x.status==='enviada'?'Reenviar':'Enviar'}</button></div>`}).join('')||'<div class="empty">Nenhuma campanha gerada.</div>'}</div>`:''}</div></div>
  <div class="two-col" style="margin-top:16px"><div class="card"><div class="section-title"><div><h2>Ranking de fidelidade</h2><p>Clientes com maior relacionamento no programa.</p></div></div>${ranking.length?ranking.map((c,i)=>`<div class="ranking-row"><span><b>${i+1}º</b> <button class="link-btn" data-action="view-client" data-id="${c.id}">${escapeHtml(c.nome)}</button></span><strong>${Number(c.pontos||0)} pts · ${money(c.cashback||0)}</strong></div>`).join(''):'<div class="empty">Ainda não há movimentações de fidelidade.</div>'}</div><div class="card"><div class="section-title"><div><h2>Resumo de fidelização</h2><p>Resultados de pontos, cashback e resgates.</p></div></div><div class="kpi-row"><span>Pontos concedidos</span><strong>${report.earned.filter(x=>x.tipo==='pontos_ganhos').reduce((a,x)=>a+Number(x.valor||0),0).toLocaleString('pt-BR')}</strong></div><div class="kpi-row"><span>Cashback gerado</span><strong>${money(report.earned.filter(x=>x.tipo==='cashback_gerado').reduce((a,x)=>a+Number(x.valor||0),0))}</strong></div><div class="kpi-row"><span>Cashback utilizado</span><strong>${money(report.redeemed.filter(x=>x.tipo==='cashback_usado').reduce((a,x)=>a+Math.abs(Number(x.valor||0)),0))}</strong></div><div class="kpi-row"><span>Resgates realizados</span><strong>${report.redeemed.filter(x=>x.tipo==='pontos_resgatados').length}</strong></div></div></div>
  <div class="card" style="margin-top:16px"><div class="section-title"><div><h2>Extrato recente</h2><p>Histórico de pontos, cashback, cupons e ajustes.</p></div></div>${history.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Tutor</th><th>Movimentação</th><th>Valor</th></tr></thead><tbody>${history.map(x=>{const c=clientes.find(c=>c.id===x.clienteId);return `<tr><td>${new Date(x.data).toLocaleString('pt-BR')}</td><td>${escapeHtml(c?.nome||'Tutor')}</td><td>${escapeHtml(x.descricao||x.tipo)}</td><td><strong>${x.tipo.includes('cashback')||x.tipo.includes('cupom')?money(x.valor):Number(x.valor||0).toLocaleString('pt-BR')+' pts'}</strong></td></tr>`}).join('')}</tbody></table></div>`:'<div class="empty">Nenhuma movimentação registrada.</div>'}</div>
  ${hasFeature('vip')?`<div class="two-col" style="margin-top:16px"><div class="card"><div class="section-title"><h2>Cupons ativos</h2><button class="btn ghost" data-action="new-coupon">Criar cupom</button></div>${activeCoupons.length?activeCoupons.map(c=>{const cl=clientes.find(x=>x.id===c.clienteId);return `<div class="coupon-row"><span><b>${escapeHtml(c.codigo)}</b><small>${escapeHtml(cl?.nome||'Cliente geral')} · ${c.tipo==='percentual'?c.valor+'%':money(c.valor)} · até ${formatDateBR(c.validade)}</small></span><span class="badge green">Ativo</span></div>`}).join(''):'<div class="empty">Nenhum cupom ativo.</div>'}</div><div class="card"><div class="section-title"><h2>Clientes VIP</h2></div><div class="report-mini-grid"><div><small>Bronze</small><strong>${report.vip.Bronze||0}</strong></div><div><small>Prata</small><strong>${report.vip.Prata||0}</strong></div><div><small>Ouro</small><strong>${report.vip.Ouro||0}</strong></div><div><small>Diamante</small><strong>${report.vip.Diamante||0}</strong></div></div><div class="kpi-row"><span>Cupons utilizados</span><strong>${report.redeemed.filter(x=>x.tipo==='cupom_usado').length}</strong></div><div class="kpi-row"><span>Campanhas preparadas</span><strong>${db.data.campanhas.length}</strong></div></div></div>`:''}`;
 },
 config(){const c=db.data.config||{};const days=c.diasFuncionamento||['1','2','3','4','5','6'];return `<div class="settings-layout">
 <aside class="settings-nav"><strong>Configurações</strong><button class="active" data-settings-tab="empresa">🏢 Empresa</button><button data-settings-tab="identidade">🎨 Identidade</button><button data-settings-tab="agenda">📅 Agenda</button><button data-settings-tab="vendas">🧾 Vendas e cupom</button><button data-settings-tab="categorias">🏷 Categorias financeiras</button><button data-settings-tab="estoque">📦 Estoque</button>${hasFeature('fidelidade')?'<button data-settings-tab="fidelidade">🎁 Fidelidade</button>':''}<button data-settings-tab="notificacoes">🔔 Notificações</button><button data-settings-tab="usuarios">👥 Usuários</button><button data-settings-tab="modulos">🧩 Módulos</button><button data-settings-tab="dados">💾 Dados e segurança</button><button class="settings-plan-button" data-settings-tab="plano">◆ Plano e assinatura</button></aside>
 <div class="settings-content">
  <section class="settings-panel active" data-settings-panel="empresa"><div class="settings-heading"><div><h2>Dados da empresa</h2><p>Informações usadas no dashboard, relatórios e cupons.</p></div></div><div class="form-grid"><div class="field"><label>Nome exibido no sistema</label><input id="cfgEmpresa" value="${escapeAttr(c.empresa||'')}"></div><div class="field"><label>Razão social</label><input id="cfgRazao" value="${escapeAttr(c.razaoSocial||'')}"></div><div class="field"><label>CNPJ ou CPF</label><input id="cfgDocumento" data-mask="cpfcnpj" inputmode="numeric" maxlength="18" placeholder="CPF ou CNPJ" value="${escapeAttr(c.cnpjCpf||'')}"></div><div class="field"><label>Telefone</label><input id="cfgTelefone" data-mask="phone" inputmode="tel" maxlength="15" value="${escapeAttr(c.telefone||'')}"></div><div class="field"><label>WhatsApp</label><input id="cfgWhatsapp" data-mask="phone" inputmode="tel" maxlength="15" value="${escapeAttr(c.whatsapp||'')}"></div><div class="field"><label>E-mail</label><input id="cfgEmail" type="email" value="${escapeAttr(c.email||'')}"></div><div class="field full"><label>Site</label><input id="cfgSite" value="${escapeAttr(c.site||'')}"></div><div class="field"><label>CEP</label><input id="cfgCep" data-mask="cep" inputmode="numeric" maxlength="9" placeholder="00000-000" value="${escapeAttr(c.cep||'')}"></div><div class="field"><label>Endereço</label><input id="cfgEndereco" value="${escapeAttr(c.endereco||'')}"></div><div class="field"><label>Número</label><input id="cfgNumero" value="${escapeAttr(c.numero||'')}"></div><div class="field"><label>Complemento</label><input id="cfgComplemento" value="${escapeAttr(c.complemento||'')}"></div><div class="field"><label>Bairro</label><input id="cfgBairro" value="${escapeAttr(c.bairro||'')}"></div><div class="field"><label>Cidade</label><input id="cfgCidade" value="${escapeAttr(c.cidade||'')}"></div><div class="field"><label>Estado</label><select id="cfgEstado">${['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(x=>`<option ${c.estado===x?'selected':''}>${x}</option>`).join('')}</select></div></div></section>
  <section class="settings-panel" data-settings-panel="identidade"><div class="settings-heading"><div><h2>Identidade visual</h2><p>Adicione a logo do cliente e personalize as cores do painel.</p></div></div><div class="brand-settings"><div class="logo-upload-card"><div id="companyLogoPreview" class="company-logo-preview">${c.logo?`<img src="${c.logo}">`:'<span>🐾</span><small>Nenhuma logo enviada</small>'}</div><label class="btn primary file-btn">Selecionar logo<input id="cfgLogoInput" type="file" accept="image/png,image/jpeg,image/webp" hidden></label><button class="btn ghost" data-action="remove-company-logo">Remover logo</button><p>Recomendado: PNG transparente, até 2 MB.</p></div><div class="form-grid"><div class="field"><label>Cor principal</label><input id="cfgCorPrincipal" type="color" value="${c.corPrincipal||'#5b21d6'}"></div><div class="field"><label>Cor de destaque</label><input id="cfgCorDestaque" type="color" value="${c.corDestaque||'#ff8a1f'}"></div><div class="field full"><label>Tema</label><select id="cfgTema"><option value="claro" ${c.tema!=='escuro'?'selected':''}>Claro</option><option value="escuro" ${c.tema==='escuro'?'selected':''}>Escuro (experimental)</option></select></div></div></div></section>
  <section class="settings-panel" data-settings-panel="agenda"><div class="settings-heading"><div><h2>Agenda e atendimento</h2><p>Defina horários, intervalo e dias de funcionamento.</p></div></div><div class="form-grid"><div class="field"><label>Início do expediente</label><input id="cfgInicioAgenda" type="time" value="${c.inicioAgenda||'08:00'}"></div><div class="field"><label>Fim do expediente</label><input id="cfgFimAgenda" type="time" value="${c.fimAgenda||'18:00'}"></div><div class="field"><label>Intervalo padrão</label><select id="cfgIntervalo"><option value="15" ${Number(c.intervaloAgenda)===15?'selected':''}>15 minutos</option><option value="30" ${Number(c.intervaloAgenda||30)===30?'selected':''}>30 minutos</option><option value="45" ${Number(c.intervaloAgenda)===45?'selected':''}>45 minutos</option><option value="60" ${Number(c.intervaloAgenda)===60?'selected':''}>60 minutos</option></select></div><div class="field"><label>Status inicial</label><select id="cfgStatusInicial"><option ${c.statusInicial!=='Confirmado'?'selected':''}>Agendado</option><option ${c.statusInicial==='Confirmado'?'selected':''}>Confirmado</option></select></div><div class="field full"><label>Dias de funcionamento</label><div class="days-picker">${[['1','Seg'],['2','Ter'],['3','Qua'],['4','Qui'],['5','Sex'],['6','Sáb'],['0','Dom']].map(([v,l])=>`<label><input type="checkbox" name="cfgDia" value="${v}" ${days.includes(v)?'checked':''}><span>${l}</span></label>`).join('')}</div></div></div></section>
  <section class="settings-panel" data-settings-panel="vendas"><div class="settings-heading"><div><h2>Vendas e cupom</h2><p>Preferências do caixa e da impressão térmica.</p></div></div><div class="form-grid"><div class="field"><label>Largura da impressora</label><select id="cfgImpressora"><option value="80" ${String(c.impressora||'80')==='80'?'selected':''}>80 mm</option><option value="58" ${String(c.impressora)==='58'?'selected':''}>58 mm</option></select></div><div class="field"><label>Forma de pagamento padrão</label><select id="cfgPagamentoPadrao">${['PIX','Dinheiro','Cartão de débito','Cartão de crédito'].map(x=>`<option ${c.pagamentoPadrao===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field full"><label>Mensagem no rodapé do cupom</label><textarea id="cfgRodapeCupom">${escapeHtml(c.rodapeCupom||'Obrigado pela preferência!')}</textarea></div><div class="field full"><label class="switch-row"><input id="cfgImprimirAuto" type="checkbox" ${c.imprimirAutomatico?'checked':''}><span>Imprimir automaticamente após a venda</span></label></div></div></section>
  <section class="settings-panel" data-settings-panel="categorias"><div class="settings-heading"><div><h2>Categorias financeiras</h2><p>Cadastre as categorias usadas em receitas, despesas e boletos.</p></div></div>
   <div class="finance-category-grid">
    ${['receita','despesa','boleto'].map(type=>`<article class="finance-category-card"><div><span>${type==='receita'?'RECEITAS':type==='despesa'?'DESPESAS':'BOLETOS'}</span><h3>${type==='receita'?'Categorias de receitas':type==='despesa'?'Categorias de despesas':'Categorias de boletos'}</h3></div><div class="finance-category-add"><input data-category-input="${type}" placeholder="Nova categoria"><button class="btn primary" data-action="add-finance-category" data-category-type="${type}">Adicionar</button></div><div class="finance-category-list">${financialCategories(type).map(name=>`<div><span>${escapeHtml(name)}</span><button data-action="delete-finance-category" data-category-type="${type}" data-category-name="${escapeAttr(name)}">✕</button></div>`).join('')}</div></article>`).join('')}
   </div>
  </section>
  <section class="settings-panel" data-settings-panel="estoque"><div class="settings-heading"><div><h2>Estoque</h2><p>Defina alertas e padrões para novos produtos.</p></div></div><div class="form-grid"><div class="field"><label>Estoque mínimo padrão</label><input id="cfgEstoqueMin" type="number" min="0" value="${Number(c.estoqueMinimoPadrao??3)}"></div><div class="field"><label>Unidade padrão</label><select id="cfgUnidadeEstoque"><option ${c.unidadeEstoque!=='kg'?'selected':''}>unidade</option><option ${c.unidadeEstoque==='kg'?'selected':''}>kg</option><option ${c.unidadeEstoque==='litro'?'selected':''}>litro</option></select></div><div class="field full"><label class="switch-row"><input id="cfgBaixaEstoque" type="checkbox" ${c.baixaEstoqueAutomatica!==false?'checked':''}><span>Dar baixa automática ao finalizar venda</span></label></div></div></section>
  <section class="settings-panel" data-settings-panel="fidelidade"><div class="settings-heading"><div><h2>Programa de fidelidade</h2><p>Configure o acúmulo de pontos dos clientes.</p></div></div><div class="form-grid"><div class="field"><label>Pontos por R$ 1,00</label><input id="cfgPontos" type="number" min="0" step="0.1" value="${Number(c.pontosPorReal??1)}"></div><div class="field"><label>Cashback sobre a venda (%)</label><input id="cfgCashback" type="number" min="0" max="100" step="0.1" value="${Number(c.percentualCashback??2)}"></div><div class="field"><label>Validade dos pontos</label><select id="cfgValidadePontos"><option value="0" ${!Number(c.validadePontos)?'selected':''}>Sem validade</option><option value="90" ${Number(c.validadePontos)===90?'selected':''}>90 dias</option><option value="180" ${Number(c.validadePontos)===180?'selected':''}>180 dias</option><option value="365" ${Number(c.validadePontos)===365?'selected':''}>1 ano</option></select></div><div class="field full"><label class="switch-row"><input id="cfgUsarFidelidade" type="checkbox" ${c.usarFidelidade!==false?'checked':''}><span>Ativar programa de fidelidade</span></label></div></div></section>
  <section class="settings-panel" data-settings-panel="notificacoes"><div class="settings-heading"><div><h2>Notificações</h2><p>Escolha quais alertas aparecem no sistema.</p></div></div><div class="switch-list"><label class="switch-row"><input id="cfgAlertaEstoque" type="checkbox" ${c.alertaEstoque!==false?'checked':''}><span><b>Estoque baixo</b><small>Avisar quando produtos atingirem o mínimo.</small></span></label><label class="switch-row"><input id="cfgAlertaAniversario" type="checkbox" ${c.alertaAniversario!==false?'checked':''}><span><b>Aniversariantes</b><small>Mostrar pets aniversariantes da semana.</small></span></label><label class="switch-row"><input id="cfgAlertaAgenda" type="checkbox" ${c.alertaAgenda!==false?'checked':''}><span><b>Agenda do dia</b><small>Lembrar atendimentos pendentes.</small></span></label></div></section>
  <section class="settings-panel" data-settings-panel="usuarios">
   <div class="settings-heading"><div><h2>Usuários da empresa</h2><p>Gerencie quem pode acessar o ForgePets usando o próprio e-mail.</p></div><button class="btn primary" data-action="add-company-user">＋ Adicionar usuário por e-mail</button></div>
   <div class="current-user-card"><div class="current-user-avatar">${escapeHtml((currentForgeUser?.name||c.nomeUsuario||'U').charAt(0).toUpperCase())}</div><div><small>USUÁRIO LOGADO</small><strong>${escapeHtml(currentForgeUser?.name||c.nomeUsuario||'Usuário')}</strong><span>${escapeHtml(currentForgeUser?.email||c.emailUsuario||'')}</span></div><i>${escapeHtml(userRoleLabel(currentForgeUser?.role)||c.perfilUsuario||'Administrador')}</i></div>
   <div class="company-users-list">${companyUsers.length?companyUsers.map(u=>`<article><div class="company-user-avatar">${escapeHtml((u.name||u.email||'U').charAt(0).toUpperCase())}</div><div><strong>${escapeHtml(u.name||'Usuário')}</strong><span>${escapeHtml(u.email)}</span></div><i>${escapeHtml(userRoleLabel(u.role))}</i><b class="${u.active?'active':'inactive'}">${u.active?'Ativo':'Inativo'}</b></article>`).join(''):'<div class="settings-users-empty"><span>👥</span><div><strong>Carregando usuários...</strong><p>Os acessos da empresa aparecerão aqui.</p></div></div>'}</div>
  </section>
  <section class="settings-panel" data-settings-panel="modulos"><div class="settings-heading"><div><h2>Módulos adicionais</h2><p>Contrate somente os recursos extras que sua empresa precisa.</p></div></div><div class="module-market-grid"><article class="module-market-card featured"><span>FISCAL</span><h3>Emissão de notas fiscais</h3><p>Emissão de NFS-e de serviços, histórico, XML, PDF e envio ao cliente. Disponibilidade conforme a integração do município.</p><strong>R$ 49<small>/mês</small></strong><button class="btn primary" data-action="request-module" data-module="FISCAL">Solicitar ativação</button></article><article class="module-market-card"><span>EM BREVE</span><h3>WhatsApp Oficial</h3><p>Confirmações, lembretes e mensagens usando a API oficial.</p><strong>R$ 39<small>/mês</small></strong><button class="btn ghost" disabled>Em breve</button></article><article class="module-market-card"><span>EM BREVE</span><h3>Agendamento Online</h3><p>Página pública para os clientes solicitarem horários.</p><strong>R$ 39<small>/mês</small></strong><button class="btn ghost" disabled>Em breve</button></article></div><div class="notice">A ativação de módulos pagos será confirmada pelo Forge Pets. O Módulo Fiscal exigirá configuração individual dos dados e credenciais fiscais da empresa.</div></section>
  <section class="settings-panel" data-settings-panel="dados"><div class="settings-heading"><div><h2>Dados e segurança</h2><p>Os dados da empresa são sincronizados com o Neon e ficam disponíveis em todos os dispositivos.</p></div></div><div class="workspace-sync-card"><div><span class="workspace-sync-icon">☁</span><div><b>Sincronização da empresa</b><small data-workspace-status>${workspaceStatusText()}</small></div></div><button class="btn primary" data-action="sync-company-data">Sincronizar agora</button></div><div class="data-actions"><button class="btn ghost" data-action="backup">Exportar backup JSON</button><label class="btn ghost file-btn">Importar backup<input type="file" id="settingsBackupInput" accept="application/json" hidden></label><button class="btn danger" data-action="reset-system">Limpar dados deste navegador</button></div><div class="notice"><b>Importante:</b> no primeiro acesso desta atualização, abra primeiro o Forge Pets no computador principal da loja. Ele enviará os cadastros existentes para o Neon; depois celular e outros computadores receberão os mesmos dados.</div></section>
  <section class="settings-panel" data-settings-panel="plano"><div class="settings-heading"><div><h2>Plano e assinatura</h2><p>Consulte seu plano atual, a cobrança recorrente, suas faturas e altere quando precisar.</p></div></div><div class="subscription-card"><div><span>Plano atual</span><strong>${activePlan()}</strong><small>${money(planPrice())} por mês</small></div><div class="subscription-status"><span class="badge green">${activeSubscription().status==='pending'?'Pagamento pendente':'Ativo'}</span><small>Próxima cobrança: ${nextChargeLabel()} · ${paymentMethodLabel(activeSubscription().paymentMethod)}</small></div></div><div class="plan-settings-actions"><button class="btn primary" data-action="show-plans">Ver planos e trocar</button><div class="plan-rule-note">Após um upgrade, a redução para um plano inferior ficará disponível somente após <b>3 meses</b>.</div></div><div class="subscription-billing-section"><div class="section-title"><div><h2>Faturas da assinatura</h2><p>Acompanhe vencimentos, pagamentos e o histórico mensal do ForgePets.</p></div></div>${subscriptionInvoicesHtml()}</div></section>
  <div class="settings-savebar"><span>As alterações são aplicadas ao salvar.</span><button class="btn primary" data-action="save-config">Salvar todas as configurações</button></div>
 </div></div>`}
};
function normalize(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function sortAlpha(rows,key){return [...rows].sort((a,b)=>String(a[key]||'').localeCompare(String(b[key]||''),'pt-BR',{sensitivity:'base'}))}
function escapeAttr(v){return String(v||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}
function setClientSearch(v){clientSearch=v;document.querySelector('#content').innerHTML=views.clientes()}
function setPetSearch(v){petSearch=v;document.querySelector('#content').innerHTML=views.pets()}
function daysFromNow(n){const d=new Date();d.setDate(d.getDate()+Number(n||0));return d.toISOString().slice(0,10);}
function daysAgo(n){const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10)}

function reportDateOnly(value){
 const raw=String(value||'').trim();
 if(!raw)return '';
 const direct=raw.match(/^(\d{4}-\d{2}-\d{2})/);
 if(direct)return direct[1];
 const parsed=new Date(raw);
 if(Number.isNaN(parsed.getTime()))return '';
 return `${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,'0')}-${String(parsed.getDate()).padStart(2,'0')}`;
}
function inPeriodInclusive(value,start,end){
 const date=reportDateOnly(value);
 return Boolean(date&&(!start||date>=start)&&(!end||date<=end));
}
function payableReportDate(item){
 return reportDateOnly(item.status==='pago'?(item.paidAt||item.pagoEm||item.vencimento):item.vencimento);
}

function inPeriod(date,start,end){return inPeriodInclusive(date,start,end)}
function formatDateBR(v){if(!v)return '-';const [y,m,d]=v.split('-');return `${d}/${m}/${y}`}
function reportServiceName(id){return db.data.servicos.find(s=>String(s.id)===String(id))?.nome||'Serviço não identificado'}
function reportProfessionalOptions(){return [...new Set(db.data.agenda.map(a=>String(a.profissional||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'))}
function reportFilters(){return window.forgeReportFilters||(window.forgeReportFilters={service:'all',professional:'all',status:'all',payment:'all',search:''})}
function reportSaleDate(v){return String(v.data||v.createdAt||'').slice(0,10)}

function exportReportPdf(){
 const source=document.querySelector('.reports-pro');
 if(!source)return toast('Abra a tela de Relatórios antes de exportar.','error');
 const popup=window.open('','_blank','width=1200,height=850');
 if(!popup)return toast('O navegador bloqueou a janela do PDF. Permita pop-ups para o Forge Pets.','error');
 const clone=source.cloneNode(true);
 clone.querySelectorAll('button,.reports-filter-card').forEach(element=>element.remove());
 const companyName=escapeHtml(db.data.config?.nomeEmpresa||db.data.config?.empresa||'Pet shop');
 const period=`${formatDateBR(reportStart)} até ${formatDateBR(reportEnd)}`;
 const generated=new Date().toLocaleString('pt-BR');
 popup.document.open();
 popup.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório Forge Pets - ${companyName}</title><style>
  @page{size:A4;margin:13mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#1f1630;background:#fff;font-size:11px}.pdf-header{display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-radius:16px;background:linear-gradient(135deg,#28104e,#6d28d9);color:#fff;margin-bottom:18px}.brand{display:flex;align-items:center;gap:12px}.brand-mark{width:48px;height:48px;border-radius:14px;background:#fff;color:#6d28d9;display:grid;place-items:center;font-weight:900;font-size:24px}.brand h1{font-size:23px;margin:0}.brand h1 span{color:#ff8a1c}.brand p{margin:4px 0 0;color:#ddd0f6}.pdf-meta{text-align:right;line-height:1.6}.pdf-meta b{display:block;font-size:13px}.reports-hero{background:#f5f0ff!important;color:#28104e!important;border:1px solid #ded1f5;border-radius:15px;padding:16px 18px;margin-bottom:13px}.reports-hero span{font-size:9px;font-weight:900;letter-spacing:.13em;color:#6d28d9}.reports-hero h2{font-size:20px;margin:5px 0}.reports-hero p{margin:0;color:#6e647a}.reports-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}.reports-kpis article{border:1px solid #e4ddec;border-radius:11px;padding:10px;background:#fff}.reports-kpis small{display:block;color:#766e80;font-weight:700}.reports-kpis strong{display:block;font-size:17px;margin:5px 0;color:#28104e}.reports-kpis span{color:#847b8e;font-size:9px}.reports-main-grid{display:grid;grid-template-columns:1fr;gap:13px}.card{border:1px solid #e2dbea;border-radius:13px;padding:13px;margin-bottom:13px;break-inside:avoid}.section-title{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #6d28d9;padding-bottom:8px;margin-bottom:9px}.section-title h2{font-size:15px;margin:0;color:#28104e}.section-title p{margin:3px 0 0;color:#756d80}.table-wrap{overflow:visible}table{width:100%;border-collapse:collapse}th{background:#f2edfa;color:#392357;text-transform:uppercase;font-size:8px;letter-spacing:.04em;text-align:left;padding:7px;border-bottom:1px solid #dcd3e7}td{padding:7px;border-bottom:1px solid #eee9f3;vertical-align:top}.table-sub{display:block;color:#837a8d;font-size:8px;margin-top:2px}.badge{display:inline-block;border-radius:999px;padding:3px 7px;background:#eee9f5;font-size:8px;font-weight:700}.green{background:#dcfce7;color:#166534}.red{background:#fee2e2;color:#991b1b}.yellow{background:#fef3c7;color:#92400e}.purple{background:#ede9fe;color:#5b21b6}.reports-payable-summary{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:9px}.reports-payable-summary>div{border:1px solid #e7dfef;border-radius:10px;padding:9px}.report-bar{height:7px!important}.report-bar span{display:block;height:100%;background:#6d28d9;border-radius:999px}.pdf-footer{margin-top:15px;padding-top:8px;border-top:1px solid #ddd4e7;display:flex;justify-content:space-between;color:#80768b;font-size:8px}.empty{text-align:center;padding:16px;color:#81778d}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.card{break-inside:avoid}.reports-payables-card{break-before:page}.pdf-footer{position:running(footer)}}
 </style></head><body><header class="pdf-header"><div class="brand"><div class="brand-mark">F</div><div><h1>Forge<span>Pets</span></h1><p>${companyName}</p></div></div><div class="pdf-meta"><b>Relatório gerencial</b><span>Período: ${period}</span><br><span>Emitido: ${generated}</span></div></header>${clone.outerHTML}<footer class="pdf-footer"><span>Forge Pets - Gestão inteligente para pet shops</span><span>${companyName}</span></footer><script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`);
 popup.document.close();
 toast('Relatório preparado. Escolha “Salvar como PDF” na impressão.','success');
}

function reportView(){
 ensureData();
 const filters=reportFilters();
 const allAgenda=db.data.agenda.filter(a=>inPeriod(a.data,reportStart,reportEnd));
 const agenda=allAgenda.filter(a=>{
  const serviceOk=filters.service==='all'||String(a.servicoId)===filters.service;
  const professionalOk=filters.professional==='all'||String(a.profissional||'')===filters.professional;
  const statusOk=filters.status==='all'||String(a.status||'Agendado')===filters.status;
  const pet=db.data.pets.find(p=>p.id===a.petId),client=pet&&db.data.clientes.find(c=>c.id===pet.clienteId),service=reportServiceName(a.servicoId);
  const searchOk=!filters.search||normalize([pet?.nome,client?.nome,service,a.profissional,a.status].join(' ')).includes(normalize(filters.search));
  return serviceOk&&professionalOk&&statusOk&&searchOk;
 });
 const sales=(db.data.vendas||[]).filter(v=>inPeriod(reportSaleDate(v),reportStart,reportEnd)).filter(v=>filters.payment==='all'||String(v.forma||'')===filters.payment);
 const serviceSales=[];
 sales.forEach(v=>(v.itens||[]).filter(i=>i.tipo==='servico').forEach(i=>{
  const serviceId=String(i.id||i.servicoId||'');
  if(filters.service!=='all'&&serviceId!==filters.service)return;
  serviceSales.push({sale:v,serviceId,nome:i.nome||reportServiceName(serviceId),qtd:Number(i.qtd||1),total:Number(i.preco||i.valor||0)*Number(i.qtd||1)});
 }));
 const payables=(db.data.despesas||[]).filter(item=>inPeriodInclusive(payableReportDate(item),reportStart,reportEnd));
 const openPayables=payables.filter(item=>item.status!=='pago');
 const paidPayables=payables.filter(item=>item.status==='pago');
 const totalOpenPayables=openPayables.reduce((sum,item)=>sum+Number(item.valor||0)+Number(item.juros||0)+Number(item.multa||0),0);
 const totalPaidPayables=paidPayables.reduce((sum,item)=>sum+Number(item.valorPago??item.valor??0),0);
 const cash=(db.data.caixa||[]).filter(x=>inPeriodInclusive(x.data,reportStart,reportEnd));
 const entradas=cash.filter(x=>x.tipo==='entrada'&&(filters.payment==='all'||String(x.forma||'')===filters.payment));
 const saidas=cash.filter(x=>x.tipo==='saida');
 const serviceRevenue=serviceSales.reduce((s,x)=>s+x.total,0);
 const totalEntradas=entradas.reduce((s,x)=>s+Number(x.valor||0),0);
 const totalSaidas=saidas.reduce((s,x)=>s+Number(x.valor||0),0);
 const completed=agenda.filter(a=>a.status==='Concluído');
 const canceled=agenda.filter(a=>a.status==='Cancelado');
 const noShow=agenda.filter(a=>a.status==='Não compareceu');
 const serviceMap={};
 db.data.servicos.forEach(s=>serviceMap[String(s.id)]={id:String(s.id),nome:s.nome,agendados:0,concluidos:0,cancelados:0,receita:0,quantidadeVendida:0});
 agenda.forEach(a=>{const key=String(a.servicoId);const row=serviceMap[key]||(serviceMap[key]={id:key,nome:reportServiceName(key),agendados:0,concluidos:0,cancelados:0,receita:0,quantidadeVendida:0});row.agendados++;if(a.status==='Concluído')row.concluidos++;if(a.status==='Cancelado')row.cancelados++;});
 serviceSales.forEach(x=>{const key=String(x.serviceId);const row=serviceMap[key]||(serviceMap[key]={id:key,nome:x.nome,agendados:0,concluidos:0,cancelados:0,receita:0,quantidadeVendida:0});row.receita+=x.total;row.quantidadeVendida+=x.qtd;});
 const serviceRows=Object.values(serviceMap).filter(x=>x.agendados||x.receita).sort((a,b)=>b.receita-a.receita||b.concluidos-a.concluidos);
 const maxRevenue=Math.max(1,...serviceRows.map(x=>x.receita));
 const professionalMap={};
 agenda.forEach(a=>{const name=String(a.profissional||'Não informado');professionalMap[name]=professionalMap[name]||{nome:name,total:0,concluidos:0,cancelados:0};professionalMap[name].total++;if(a.status==='Concluído')professionalMap[name].concluidos++;if(a.status==='Cancelado')professionalMap[name].cancelados++;});
 const professionals=Object.values(professionalMap).sort((a,b)=>b.concluidos-a.concluidos);
 const paymentOptions=[...new Set((db.data.vendas||[]).map(v=>v.forma).filter(Boolean))].sort();
 const appointmentRows=agenda.length?agenda.sort((a,b)=>`${b.data}${b.hora}`.localeCompare(`${a.data}${a.hora}`)).map(a=>{const pet=db.data.pets.find(p=>p.id===a.petId),client=pet&&db.data.clientes.find(c=>c.id===pet.clienteId);return `<tr><td>${formatDateBR(a.data)}<small class="table-sub">${escapeHtml(a.hora||'')}</small></td><td><b>${escapeHtml(reportServiceName(a.servicoId))}</b></td><td>${escapeHtml(pet?.nome||'Pet')}<small class="table-sub">${escapeHtml(client?.nome||'Tutor')}</small></td><td>${escapeHtml(a.profissional||'Não informado')}</td><td><span class="badge ${a.status==='Concluído'?'green':a.status==='Cancelado'||a.status==='Não compareceu'?'red':'yellow'}">${escapeHtml(a.status||'Agendado')}</span></td></tr>`}).join(''):'<tr><td colspan="5"><div class="empty">Nenhum atendimento encontrado com os filtros selecionados.</div></td></tr>';
 return `<section class="reports-pro">
  <div class="reports-hero"><div><span>INTELIGÊNCIA DO PET SHOP</span><h2>Relatórios de serviços e desempenho</h2><p>Analise banho, tosa e demais serviços com filtros combinados e resultados em tempo real.</p></div><div class="reports-export-actions"><button class="btn ghost" data-action="export-service-report">⇩ Exportar CSV</button><button class="btn ghost" data-action="export-report-pdf">▣ Exportar PDF</button></div></div>
  <div class="card reports-filter-card"><div class="section-title"><div><h2>Filtros do relatório</h2><p>${formatDateBR(reportStart)} até ${formatDateBR(reportEnd)}</p></div><button class="btn ghost" data-action="clear-report-filters">Limpar filtros</button></div>
   <div class="period-presets"><button class="btn ghost" data-action="report-period" data-days="7">7 dias</button><button class="btn ghost" data-action="report-period" data-days="14">14 dias</button><button class="btn ghost" data-action="report-period" data-days="30">30 dias</button><button class="btn ghost" data-action="report-period" data-days="90">90 dias</button><button class="btn ghost" data-action="report-month">Este mês</button></div>
   <div class="reports-filter-grid">
    <div class="field"><label>Data inicial</label><input id="reportStart" type="date" value="${reportStart}"></div><div class="field"><label>Data final</label><input id="reportEnd" type="date" value="${reportEnd}"></div>
    <div class="field"><label>Serviço</label><select id="reportService"><option value="all">Todos os serviços</option>${sortAlpha(db.data.servicos,'nome').map(s=>`<option value="${escapeAttr(s.id)}" ${filters.service===String(s.id)?'selected':''}>${escapeHtml(s.nome)}</option>`).join('')}</select></div>
    <div class="field"><label>Funcionário</label><select id="reportProfessional"><option value="all">Todos os funcionários</option>${reportProfessionalOptions().map(n=>`<option value="${escapeAttr(n)}" ${filters.professional===n?'selected':''}>${escapeHtml(n)}</option>`).join('')}</select></div>
    <div class="field"><label>Status</label><select id="reportStatus"><option value="all">Todos os status</option>${['Agendado','Confirmado','Em atendimento','Concluído','Cancelado','Não compareceu'].map(n=>`<option ${filters.status===n?'selected':''}>${n}</option>`).join('')}</select></div>
    <div class="field"><label>Pagamento</label><select id="reportPayment"><option value="all">Todas as formas</option>${paymentOptions.map(n=>`<option value="${escapeAttr(n)}" ${filters.payment===n?'selected':''}>${escapeHtml(n)}</option>`).join('')}</select></div>
    <div class="field reports-search"><label>Busca</label><input id="reportSearch" value="${escapeAttr(filters.search)}" placeholder="Pet, tutor ou serviço..."></div>
    <button class="btn primary reports-apply" data-action="apply-report-filters">Aplicar filtros</button>
   </div>
  </div>
  <div class="reports-kpis"><article><small>Faturamento filtrado</small><strong>${money(filters.service==='all'?totalEntradas:serviceRevenue)}</strong><span>${serviceSales.reduce((s,x)=>s+x.qtd,0)} serviço(s) vendido(s)</span></article><article><small>Serviços concluídos</small><strong>${completed.length}</strong><span>de ${agenda.length} atendimento(s)</span></article><article><small>Ticket médio de serviços</small><strong>${money(serviceSales.length?serviceRevenue/serviceSales.reduce((s,x)=>s+x.qtd,0):0)}</strong><span>por serviço vendido</span></article><article><small>Cancelamentos</small><strong>${canceled.length}</strong><span>${noShow.length} não comparecimento(s)</span></article><article><small>Resultado financeiro</small><strong>${money(totalEntradas-totalSaidas)}</strong><span>entradas menos saídas</span></article><article><small>Contas a pagar</small><strong>${money(totalOpenPayables)}</strong><span>${openPayables.length} pendente(s) no período</span></article><article><small>Despesas pagas</small><strong>${money(totalPaidPayables)}</strong><span>${paidPayables.length} pagamento(s) no período</span></article></div>
  <div class="reports-main-grid"><div class="card reports-service-card"><div class="section-title"><div><h2>Desempenho por serviço</h2><p>Quantidade, conclusão e faturamento.</p></div></div>${serviceRows.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Serviço</th><th>Agendados</th><th>Concluídos</th><th>Receita</th><th>Ticket médio</th></tr></thead><tbody>${serviceRows.map(x=>`<tr><td><b>${escapeHtml(x.nome)}</b><div class="report-bar"><i style="width:${Math.max(3,x.receita/maxRevenue*100)}%"></i></div></td><td>${x.agendados}</td><td>${x.concluidos}</td><td><b>${money(x.receita)}</b></td><td>${money(x.quantidadeVendida?x.receita/x.quantidadeVendida:0)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Nenhum serviço no período.</div>'}</div>
  <div class="card reports-ranking"><div class="section-title"><div><h2>Ranking da equipe</h2><p>Atendimentos realizados no período.</p></div></div>${professionals.length?professionals.map((x,i)=>`<div class="report-rank-row"><b>${i+1}º</b><span>${escapeHtml(x.nome)}<small>${x.total} atendimento(s) · ${x.cancelados} cancelado(s)</small></span><strong>${x.concluidos}</strong></div>`).join(''):'<div class="empty">Nenhum funcionário informado nos atendimentos.</div>'}</div></div>
  <div class="card reports-payables-card"><div class="section-title"><div><h2>Contas a pagar</h2><p>Vencidas, pendentes e pagas dentro do período selecionado.</p></div><span class="badge purple">${payables.length} registro(s)</span></div>
   <div class="reports-payable-summary"><div><small>Pendente</small><strong>${money(totalOpenPayables)}</strong></div><div><small>Pago</small><strong>${money(totalPaidPayables)}</strong></div></div>
   <div class="table-wrap"><table class="table"><thead><tr><th>Descrição</th><th>Categoria</th><th>Vencimento</th><th>Pagamento</th><th>Status</th><th>Valor</th></tr></thead><tbody>${payables.length?payables.sort((a,b)=>String(a.vencimento||'').localeCompare(String(b.vencimento||''))).map(item=>`<tr><td><b>${escapeHtml(item.descricao||item.empresa||'Despesa')}</b></td><td>${escapeHtml(item.categoria||'Geral')}</td><td>${formatDateBR(reportDateOnly(item.vencimento))}</td><td>${item.status==='pago'&&item.paidAt?formatDateBR(reportDateOnly(item.paidAt)):'—'}</td><td><span class="badge ${item.status==='pago'?'green':reportDateOnly(item.vencimento)<today()?'red':'yellow'}">${item.status==='pago'?'Paga':reportDateOnly(item.vencimento)<today()?'Vencida':'A vencer'}</span></td><td><b>${money(item.status==='pago'?Number(item.valorPago??item.valor??0):Number(item.valor||0)+Number(item.juros||0)+Number(item.multa||0))}</b></td></tr>`).join(''):'<tr><td colspan="6"><div class="empty">Nenhuma conta a pagar no período.</div></td></tr>'}</tbody></table></div>
  </div>
  <div class="card"><div class="section-title"><div><h2>Detalhamento dos atendimentos</h2><p>Resultado completo conforme os filtros aplicados.</p></div><span class="badge purple">${agenda.length} registro(s)</span></div><div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Serviço</th><th>Pet / Tutor</th><th>Funcionário</th><th>Status</th></tr></thead><tbody>${appointmentRows}</tbody></table></div></div>
 </section>`;
}


function stockMovementsFor(productId){
 ensureData();
 return (db.data.estoqueMovimentos||[])
  .filter(item=>String(item.produtoId)===String(productId))
  .sort((a,b)=>String(b.createdAt||b.data||'').localeCompare(String(a.createdAt||a.data||'')));
}
function stockMovementLabel(type){return ({entrada:'Entrada',saida:'Saída',ajuste:'Ajuste'})[type]||'Movimentação';}
function stockMovementClass(type){return type==='entrada'?'green':type==='saida'?'red':'yellow';}
function saveStockMovement(product,type,quantity,meta={}){
 ensureData();
 const movement={id:uid(),produtoId:product.id,produtoNome:product.nome,tipo:type,quantidade:Number(quantity||0),saldo:Number(product.qtd||0),data:meta.data||today(),custoUnitario:Number(meta.custoUnitario??product.custo??0),fornecedor:String(meta.fornecedor||'').trim(),motivo:String(meta.motivo||'').trim(),observacoes:String(meta.observacoes||'').trim(),createdAt:new Date().toISOString()};
 db.data.estoqueMovimentos.unshift(movement);
 return movement;
}
function openStockMovementModal(productId,type='entrada'){
 const product=db.data.estoque.find(item=>String(item.id)===String(productId));
 if(!product)return toast('Produto não encontrado.','error');
 const isEntry=type==='entrada';
 modal(isEntry?'Adicionar estoque':'Retirar estoque',`<div class="stock-movement-product"><div><small>PRODUTO</small><h3>${escapeHtml(product.nome)}</h3><span>Estoque atual: <b>${Number(product.qtd||0)} ${escapeHtml(product.unidade||'unidade')}</b></span></div></div>
 <div class="form-grid">
  <div class="field"><label>Quantidade *</label><input id="stockMoveQty" type="number" min="1" step="1" value="1"></div>
  <div class="field"><label>Data</label><input id="stockMoveDate" type="date" value="${today()}"></div>
  ${isEntry?`<div class="field"><label>Custo unitário da compra</label><input id="stockMoveCost" data-mask="money" inputmode="numeric" value="${money(product.custo||0)}"></div><div class="field"><label>Fornecedor</label><input id="stockMoveSupplier" placeholder="Opcional"></div>`:`<div class="field full"><label>Motivo</label><select id="stockMoveReason"><option value="Uso interno">Uso interno</option><option value="Perda / avaria">Perda / avaria</option><option value="Ajuste de inventário">Ajuste de inventário</option><option value="Outro">Outro</option></select></div>`}
  <div class="field full"><label>Observação</label><textarea id="stockMoveObs" rows="3" placeholder="Opcional"></textarea></div>
 </div>
 ${isEntry?'<div class="notice">Se informar novo custo, o custo atual do produto será atualizado.</div>':''}`,
 close=>{
  const quantity=Math.max(0,Number($('#stockMoveQty').value||0));
  if(!quantity)return setModalError('Informe a quantidade.');
  if(!isEntry&&quantity>Number(product.qtd||0))return setModalError(`Estoque insuficiente. Disponível: ${Number(product.qtd||0)}.`);
  const before=Number(product.qtd||0);
  product.qtd=isEntry?before+quantity:before-quantity;
  const cost=isEntry?parseLocaleNumber($('#stockMoveCost')?.value||0):Number(product.custo||0);
  if(isEntry&&cost>=0)product.custo=cost;
  saveStockMovement(product,isEntry?'entrada':'saida',quantity,{data:$('#stockMoveDate').value||today(),custoUnitario:cost,fornecedor:$('#stockMoveSupplier')?.value||'',motivo:$('#stockMoveReason')?.value||'',observacoes:$('#stockMoveObs').value||''});
  db.save();close();toast(isEntry?`Estoque atualizado: ${before} → ${product.qtd}.`:`Saída registrada: ${before} → ${product.qtd}.`,'success');
 },isEntry?'Adicionar ao estoque':'Confirmar saída');
 applyInputMasks($('.modal'));
}
function openStockEditModal(productId){
 const product=db.data.estoque.find(item=>String(item.id)===String(productId));
 if(!product)return toast('Produto não encontrado.','error');
 modal('Editar produto',`<div class="form-grid">
  <div class="field full"><label>Nome do produto *</label><input id="editStockName" value="${escapeAttr(product.nome||'')}"></div>
  <div class="field"><label>EAN / Código de barras</label><input id="editStockEan" data-mask="ean" inputmode="numeric" maxlength="14" value="${escapeAttr(product.ean||'')}"></div>
  <div class="field"><label>Marca</label><input id="editStockBrand" value="${escapeAttr(product.marca||'')}"></div>
  <div class="field"><label>Categoria</label><input id="editStockCategory" value="${escapeAttr(product.categoria||'')}"></div>
  <div class="field"><label>Unidade</label><select id="editStockUnit">${['unidade','kg','litro','caixa','pacote'].map(unit=>`<option ${String(product.unidade||'unidade')===unit?'selected':''}>${unit}</option>`).join('')}</select></div>
  <div class="field"><label>Estoque mínimo</label><input id="editStockMin" type="number" min="0" value="${Number(product.min||0)}"></div>
  <div class="field"><label>Custo unitário</label><input id="editStockCost" data-mask="money" inputmode="numeric" value="${money(product.custo||0)}"></div>
  <div class="field"><label>Preço de venda</label><input id="editStockSale" data-mask="money" inputmode="numeric" value="${money(product.valorVenda??product.custo??0)}"></div>
 </div><div class="notice">A quantidade é alterada pelos botões Adicionar estoque e Retirar estoque, mantendo histórico.</div>`,
 close=>{
  const name=$('#editStockName').value.trim();
  const ean=onlyDigits($('#editStockEan').value);
  if(!name)return setModalError('Informe o nome do produto.');
  if(!validEan(ean))return setModalError('O EAN deve possuir 8, 12, 13 ou 14 dígitos.');
  if(ean&&db.data.estoque.some(item=>item.id!==product.id&&onlyDigits(item.ean)===ean))return setModalError('Já existe outro produto com este EAN.');
  Object.assign(product,{nome:name,ean,marca:$('#editStockBrand').value.trim(),categoria:$('#editStockCategory').value.trim(),unidade:$('#editStockUnit').value,min:Math.max(0,Number($('#editStockMin').value||0)),custo:parseLocaleNumber($('#editStockCost').value),valorVenda:parseLocaleNumber($('#editStockSale').value),updatedAt:new Date().toISOString()});
  db.save();close();toast('Produto atualizado.','success');
 },'Salvar alterações');
 applyInputMasks($('.modal'));
}
function openStockProductModal(productId){
 const product=db.data.estoque.find(item=>String(item.id)===String(productId));
 if(!product)return toast('Produto não encontrado.','error');
 const movements=stockMovementsFor(product.id).slice(0,10);
 const low=Number(product.qtd||0)<=Number(product.min||0);
 modal('Produto no estoque',`<div class="stock-product-modal">
  <div class="stock-product-hero"><div><small>${escapeHtml(product.categoria||'PRODUTO')}</small><h2>${escapeHtml(product.nome)}</h2><p>${product.marca?escapeHtml(product.marca)+' · ':''}${product.ean?`EAN ${escapeHtml(product.ean)}`:'Sem EAN cadastrado'}</p></div><span class="badge ${low?'red':'green'}">${low?'Estoque baixo':'Estoque OK'}</span></div>
  <div class="stock-product-kpis"><div><small>Quantidade</small><strong>${Number(product.qtd||0)}</strong><span>${escapeHtml(product.unidade||'unidade')}</span></div><div><small>Estoque mínimo</small><strong>${Number(product.min||0)}</strong></div><div><small>Custo</small><strong>${money(product.custo||0)}</strong></div><div><small>Venda</small><strong>${money(product.valorVenda??product.custo??0)}</strong></div></div>
  <div class="stock-product-actions">
   <button class="stock-action-card entry" type="button" id="stockAddButton"><span>＋</span><div><b>Adicionar estoque</b><small>Nova compra / reposição</small></div></button>
   <button class="stock-action-card exit" type="button" id="stockRemoveButton"><span>−</span><div><b>Retirar estoque</b><small>Uso, perda ou ajuste</small></div></button>
   <button class="stock-action-card edit" type="button" id="stockEditButton"><span>✎</span><div><b>Editar produto</b><small>Preço, EAN, mínimo...</small></div></button>
  </div>
  <div class="stock-history"><div class="stock-history-head"><h3>Últimas movimentações</h3><span>${stockMovementsFor(product.id).length} registro(s)</span></div>
   ${movements.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Data</th><th>Tipo</th><th>Qtd.</th><th>Saldo</th><th>Detalhe</th></tr></thead><tbody>${movements.map(item=>`<tr><td>${formatDateBR(item.data)}</td><td><span class="badge ${stockMovementClass(item.tipo)}">${stockMovementLabel(item.tipo)}</span></td><td><b>${item.tipo==='entrada'?'+':'-'}${Number(item.quantidade||0)}</b></td><td>${Number(item.saldo||0)}</td><td>${escapeHtml(item.fornecedor||item.motivo||item.observacoes||'—')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="empty">Ainda não há movimentações registradas para este produto.</div>'}
  </div>
 </div>`,close=>close(),'Fechar');
 $('#stockAddButton').onclick=()=>{document.querySelector('#modalRoot [data-close]')?.click();setTimeout(()=>openStockMovementModal(product.id,'entrada'),60)};
 $('#stockRemoveButton').onclick=()=>{document.querySelector('#modalRoot [data-close]')?.click();setTimeout(()=>openStockMovementModal(product.id,'saida'),60)};
 $('#stockEditButton').onclick=()=>{document.querySelector('#modalRoot [data-close]')?.click();setTimeout(()=>openStockEditModal(product.id),60)};
}

function tableSimple(rows,heads,map,type){if(!rows.length)return '<div class="empty">Nenhum registro.</div>';return `<div class="table-wrap"><table class="table"><thead><tr>${heads.map(h=>`<th>${h}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map(x=>`<tr>${map(x).map(v=>`<td>${v}</td>`).join('')}<td><button class="btn danger" data-action="delete-row" data-type="${type}" data-id="${x.id}">Excluir</button></td></tr>`).join('')}</tbody></table></div>`}
function formatAgendaDate(value){const [year,month,day]=String(value||'').split('-').map(Number);if(!year||!month||!day)return {weekday:'',dayMonth:value||'',time:''};const date=new Date(year,month-1,day);const weekdays=['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];const months=['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];return {weekday:weekdays[date.getDay()],dayMonth:`${String(day).padStart(2,'0')} ${months[month-1]}`}}

function appointmentItems(appointment){
 if(Array.isArray(appointment?.itens)&&appointment.itens.length)return appointment.itens;
 const service=db.data.servicos.find(s=>s.id===appointment?.servicoId);
 return service?[{servicoId:service.id,nome:service.nome,categoria:service.categoria||'',qtd:1,valor:Number(service.valor||0),total:Number(service.valor||0)}]:[];
}
function appointmentServiceNames(appointment){
 return appointmentItems(appointment).map(item=>`${item.nome}${Number(item.qtd||1)>1?` ×${item.qtd}`:''}`).join(' + ')||'Serviço';
}
function appointmentTotal(appointment){
 return appointmentItems(appointment).reduce((sum,item)=>sum+Number(item.total??Number(item.valor||0)*Number(item.qtd||1)),0);
}

function selectedAgendaDate(){
 return window.forgeAgendaSelectedDate||today();
}
function attendanceFilterState(){
 return window.forgeAttendanceFilters||{from:'',to:'',search:'',status:'todos'};
}
function appointmentSearchMatches(appointment,term){
 if(!term)return true;
 const normalized=normalize(term);
 const pet=db.data.pets.find(item=>item.id===appointment.petId);
 const tutor=pet&&db.data.clientes.find(item=>item.id===pet.clienteId);
 const services=appointmentItems(appointment).map(item=>item.nome).join(' ');
 return [
  pet?.nome,
  tutor?.nome,
  tutor?.cpf,
  tutor?.telefone,
  services,
  appointment.data,
  appointment.hora,
  appointment.status
 ].some(value=>normalize(String(value||'')).includes(normalized));
}
function filteredAttendances(){
 const filters=attendanceFilterState();
 return [...db.data.agenda]
  .filter(item=>{
   if(filters.from&&item.data<filters.from)return false;
   if(filters.to&&item.data>filters.to)return false;
   if(filters.status!=='todos'&&(item.status||'Agendado')!==filters.status)return false;
   return appointmentSearchMatches(item,filters.search);
  })
  .sort((a,b)=>(b.data+b.hora).localeCompare(a.data+a.hora));
}
function attendanceGroups(rows){
 if(!rows.length)return '<div class="empty">Nenhum atendimento encontrado neste período.</div>';
 const groups=new Map();
 rows.forEach(item=>{
  if(!groups.has(item.data))groups.set(item.data,[]);
  groups.get(item.data).push(item);
 });
 return [...groups.entries()].map(([date,items])=>`<section class="attendance-day-group">
  <div class="attendance-day-heading">
   <div><small>${formatAgendaDate(date).weekday}</small><h3>${formatDateBR(date)}</h3></div>
   <span>${items.length} atendimento(s)</span>
  </div>
  ${agendaList(items.sort((a,b)=>a.hora.localeCompare(b.hora)))}
 </section>`).join('');
}

function availableAgendaTimesByDuration(date,ignoreId='',requestedDuration=60){
 const cfg=db.data.config||{};
 const start=cfg.inicioAgenda||'08:00';
 const end=cfg.fimAgenda||'18:00';
 const step=Math.max(5,Number(cfg.intervaloAgenda||30));
 const duration=Math.max(15,Number(requestedDuration||60));
 const toMin=value=>{const [h,m]=String(value||'00:00').split(':').map(Number);return h*60+m};
 const fmt=value=>`${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;

 // Cada novo atendimento precisa caber inteiro entre os atendimentos existentes.
 // Ex.: serviço de 90 min não pode aparecer às 09:00 se já há atendimento às 10:00.
 const busy=(db.data.agenda||[])
  .filter(item=>item.id!==ignoreId&&item.data===date&&!['Cancelado','Concluído','Não compareceu'].includes(item.status))
  .map(item=>{
   const appointmentStart=toMin(item.hora);
   let storedDuration=60;
   if(item.startsAt&&item.endsAt){
    storedDuration=Math.max(15,Math.round((new Date(item.endsAt)-new Date(item.startsAt))/60000));
   }else{
    const itemList=appointmentItems(item);
    storedDuration=itemList.length
     ? itemList.reduce((sum,appointmentItem)=>{
        const service=db.data.servicos.find(service=>service.id===appointmentItem.servicoId);
        return sum+Math.max(15,Number(service?.duracao||60))*Math.max(1,Number(appointmentItem.qtd||1));
       },0)
     : Math.max(15,Number(db.data.servicos.find(service=>service.id===item.servicoId)?.duracao||60));
   }
   return [appointmentStart,appointmentStart+storedDuration];
  });

 const slots=[];
 const endMin=toMin(end);
 for(let minute=toMin(start);minute+duration<=endMin;minute+=step){
  const requestedEnd=minute+duration;
  const overlaps=busy.some(([busyStart,busyEnd])=>minute<busyEnd&&requestedEnd>busyStart);
  if(!overlaps)slots.push(fmt(minute));
 }
 return slots;
}
function agendaList(rows){if(!rows.length)return '<div class="empty">Nenhum agendamento.</div>';return `<div class="calendar-list">${rows.map(a=>{const p=db.data.pets.find(x=>x.id===a.petId),c=p&&db.data.clientes.find(x=>x.id===p.clienteId),dateLabel=formatAgendaDate(a.data);return `<div class="appointment"><div class="appointment-date"><span class="appointment-weekday">${dateLabel.weekday}</span><strong class="appointment-day-month">${dateLabel.dayMonth}</strong><span class="appointment-hour">${a.hora}</span></div><div><strong>${p?.nome||'Pet'}</strong><div style="color:var(--muted);margin-top:4px">${escapeHtml(appointmentServiceNames(a))} · ${c?.nome||'Tutor'} · <b>${money(appointmentTotal(a))}</b></div></div><div><span class="badge ${a.status==='Concluído'?'green':a.status==='Cancelado'?'red':'yellow'}">${a.status||'Agendado'}</span> ${!['Concluído','Cancelado'].includes(a.status)?`<button class="btn ghost" data-action="finish-appointment" data-id="${a.id}">Concluir</button> <button class="btn ghost" data-action="cancel-appointment" data-id="${a.id}">Cancelar</button>`:''} <button class="btn danger" data-action="delete-appointment" data-id="${a.id}">Excluir</button></div></div>`}).join('')}</div>`}
function openContractAcceptance(onAccepted){const root=document.createElement('div');root.className='contract-overlay';root.innerHTML=`<div class="contract-modal"><header><div><small>ACEITE ELETRÔNICO</small><strong>Contrato Forge Pets</strong></div><button type="button" class="icon-btn" data-contract-close>×</button></header><div class="contract-scroll" id="contractScroll">${FORGEPETS_CONTRACT_HTML}</div><div class="contract-progress"><span id="contractProgressBar"></span></div><label class="contract-accept-row disabled"><input id="contractAgree" type="checkbox" disabled><span>Li integralmente e concordo com o contrato, a cobrança recorrente e os termos apresentados.</span></label><footer><button type="button" class="btn ghost" data-contract-close>Voltar</button><button type="button" class="btn primary" id="confirmContract" disabled>Concordar e continuar</button></footer></div>`;document.body.appendChild(root);const scroll=root.querySelector('#contractScroll'),agree=root.querySelector('#contractAgree'),confirm=root.querySelector('#confirmContract'),row=root.querySelector('.contract-accept-row'),bar=root.querySelector('#contractProgressBar');const update=()=>{const max=Math.max(1,scroll.scrollHeight-scroll.clientHeight),pct=Math.min(100,Math.round(scroll.scrollTop/max*100));bar.style.width=pct+'%';if(scroll.scrollTop+scroll.clientHeight>=scroll.scrollHeight-12){agree.disabled=false;row.classList.remove('disabled');}};scroll.addEventListener('scroll',update);agree.addEventListener('change',()=>confirm.disabled=!agree.checked);root.querySelectorAll('[data-contract-close]').forEach(x=>x.onclick=()=>root.remove());confirm.onclick=()=>{document.querySelector('#contractAccepted').value='1';root.remove();toast('Contrato aceito. Agora confirme a assinatura.','success');onAccepted?.();};setTimeout(update,50);}
function modal(title,body,onSave,saveText='Salvar'){window.closeForgeConnect?.();const root=$('#modalRoot');root.innerHTML=`<div class="modal-overlay"><div class="modal"><div class="modal-header"><strong>${title}</strong><button type="button" class="icon-btn" data-close>&times;</button></div><div class="modal-body">${body}</div><div class="modal-footer"><button type="button" class="btn ghost" data-close>Cancelar</button><button type="button" class="btn primary" id="modalSave">${saveText}</button></div></div></div>`;root.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>root.innerHTML='');applyInputMasks(root);bindCepLookup(root);const save=$('#modalSave');save.onclick=async()=>{if(save.disabled)return;clearModalError();const original=save.textContent;save.disabled=true;save.textContent='Salvando...';try{await onSave(()=>root.innerHTML='');}finally{if(document.body.contains(save)){save.disabled=false;save.textContent=original;}}};}
function toast(message,type='auto',options={}){
 const text=String(message||'').trim();
 if(!text)return;
 if(type==='auto'){
  const lower=text.toLowerCase();
  if(/não foi possível|erro|inválid|expirad|insuficiente|obrigatór|não encontrado|não encontrada/.test(lower))type='error';
  else if(/atenção|aviso|selecione|informe|maior que|disponível/.test(lower))type='warning';
  else if(/sucesso|cadastrad|atualizad|salv|concluíd|finalizad|excluíd|importad|exportad|paga/.test(lower))type='success';
  else type='info';
 }
 const root=$('#toastRoot');
 if(!root)return;
 const icons={success:'✓',error:'!',warning:'!',info:'i'};
 const titles={success:'Tudo certo',error:'Não foi possível concluir',warning:'Atenção',info:'ForgePets'};
 const d=document.createElement('div');
 d.className=`toast toast-${type}`;
 d.setAttribute('role',type==='error'?'alert':'status');
 d.innerHTML=`<span class="toast-icon">${icons[type]||'i'}</span><span class="toast-copy"><strong>${titles[type]||'ForgePets'}</strong><small>${escapeHtml(text)}</small></span><button type="button" class="toast-close" aria-label="Fechar">×</button>`;
 root.appendChild(d);
 requestAnimationFrame(()=>d.classList.add('show'));
 const close=()=>{d.classList.remove('show');setTimeout(()=>d.remove(),180)};
 d.querySelector('.toast-close').onclick=close;
 setTimeout(close,Number(options.duration||4200));
}

function ensureData(){db.data.clientes=db.data.clientes||[];db.data.pets=db.data.pets||[];db.data.agenda=db.data.agenda||[];db.data.servicos=db.data.servicos||[];db.data.caixa=db.data.caixa||[];db.data.despesas=db.data.despesas||[];db.data.receitasPrevistas=db.data.receitasPrevistas||[];db.data.pendencias=db.data.pendencias||[];db.data.estoque=db.data.estoque||[];db.data.estoqueMovimentos=db.data.estoqueMovimentos||[];db.data.boletos=db.data.boletos||[];db.data.vendas=db.data.vendas||[];db.data.cupons=db.data.cupons||[];db.data.campanhas=db.data.campanhas||[];db.data.loyaltyHistory=db.data.loyaltyHistory||[];db.data.recompensas=db.data.recompensas||[{id:'reward-banho',nome:'Banho gratuito',pontos:500,valor:60,ativo:true},{id:'reward-hidratacao',nome:'Hidratação gratuita',pontos:300,valor:35,ativo:true},{id:'reward-vale20',nome:'Vale-compras de R$ 20,00',pontos:200,valor:20,ativo:true}];db.data.config={empresa:'Meu Pet Shop',nomeUsuario:'Amanda',emailUsuario:'admin@forgepets.com',telefoneUsuario:'',fotoUsuario:'',perfilUsuario:'Administrador',corPrincipal:'#5b21d6',corDestaque:'#ff8a1f',pontosPorReal:1,percentualCashback:2,cuponsAtivos:true,campanhaAniversario:true,beneficiosVip:{Bronze:0,Prata:3,Ouro:5,Diamante:8},cupomAniversarioPercentual:10,cupomAniversarioValidade:15,financeCategories:{receita:['Serviços','Produtos','Banho e Tosa','Outras receitas'],despesa:['Aluguel','Água','Energia','Internet','Telefone','Marketing','Funcionários','Impostos','Fornecedores','Outras despesas'],boleto:['Aluguel','Energia','Internet','Telefone','Impostos','Fornecedores','Outros boletos']},...db.data.config};}

function vipLevel(cliente){const pts=Number(cliente?.pontos||0),levels=[...(db.data.config.niveisVip||[{nome:'Bronze',min:0},{nome:'Prata',min:500},{nome:'Ouro',min:1500},{nome:'Diamante',min:5000}])].sort((a,b)=>Number(a.min)-Number(b.min));return levels.filter(x=>pts>=Number(x.min||0)).pop()?.nome||'Bronze';}
function vipDiscount(cliente){return Number((db.data.config.beneficiosVip||{})[vipLevel(cliente)]||0);}
function addLoyaltyHistory(clienteId,tipo,descricao,valor,meta={}){db.data.loyaltyHistory.unshift({id:uid(),clienteId,tipo,descricao,valor:Number(valor||0),data:new Date().toISOString(),...meta});}
function validClientCoupons(clienteId){const now=today();return db.data.cupons.filter(c=>c.clienteId===clienteId&&c.status==='ativo'&&(!c.validade||c.validade>=now));}
function runPremiumAutomations(){ensureData();if(!hasFeature('vip'))return;const cfg=db.data.config,now=new Date(),year=now.getFullYear();if(cfg.campanhaAniversario!==false){getWeekBirthdays(7).forEach(p=>{const key=`birthday-${p.id}-${year}`,c=db.data.clientes.find(x=>x.id===p.clienteId);if(!c||db.data.campanhas.some(x=>x.key===key))return;const validade=new Date(p.nextBirthday);validade.setDate(validade.getDate()+Number(cfg.cupomAniversarioValidade||15));const codigo=`NIVER${String(p.nome||'PET').replace(/\W/g,'').toUpperCase().slice(0,5)}${year}`;const cupom={id:uid(),codigo,clienteId:c.id,petId:p.id,tipo:'percentual',valor:Number(cfg.cupomAniversarioPercentual||10),origem:'Aniversário',validade:validade.toISOString().slice(0,10),status:'ativo',createdAt:new Date().toISOString()};db.data.cupons.push(cupom);db.data.campanhas.push({id:uid(),key,tipo:'aniversario',clienteId:c.id,petId:p.id,status:'pendente',createdAt:new Date().toISOString(),mensagem:`Olá, ${c.nome}! 🎉 O aniversário de ${p.nome} está chegando. Preparamos o cupom ${codigo} com ${cupom.valor}% de desconto, válido até ${formatDateBR(cupom.validade)}.`});});}
 db.data.clientes.forEach(c=>{const level=vipLevel(c),key=`vip-${c.id}-${level}`;if(level!=='Bronze'&&!db.data.cupons.some(x=>x.key===key)){const discount=vipDiscount(c);if(discount>0){const exp=new Date();exp.setDate(exp.getDate()+30);db.data.cupons.push({id:uid(),key,codigo:`VIP${level.toUpperCase().slice(0,3)}${String(c.id).slice(-4).toUpperCase()}`,clienteId:c.id,tipo:'percentual',valor:discount,origem:`Benefício ${level}`,validade:exp.toISOString().slice(0,10),status:'ativo',createdAt:new Date().toISOString()});}}});
 localStorage.setItem('vetcoreShopPro',JSON.stringify(db.data));}
function loyaltyReport(){const h=db.data.loyaltyHistory||[],earned=h.filter(x=>['pontos_ganhos','cashback_gerado'].includes(x.tipo)),redeemed=h.filter(x=>['pontos_resgatados','cashback_usado','cupom_usado'].includes(x.tipo));const vip=db.data.clientes.reduce((acc,c)=>{const l=vipLevel(c);acc[l]=(acc[l]||0)+1;return acc;},{});return {earned,redeemed,vip};}



function financialCategories(type='despesa'){
 ensureData();
 const categories=db.data.config.financeCategories||{};
 const defaults={
  receita:['Serviços','Produtos','Banho e Tosa','Outras receitas'],
  despesa:['Aluguel','Água','Energia','Internet','Telefone','Marketing','Funcionários','Impostos','Fornecedores','Outras despesas'],
  boleto:['Aluguel','Energia','Internet','Telefone','Impostos','Fornecedores','Outros boletos']
 };
 const list=Array.isArray(categories[type])&&categories[type].length?categories[type]:defaults[type];
 return [...new Set(list.map(x=>String(x).trim()).filter(Boolean))];
}
function categoryOptions(type,selected=''){
 return financialCategories(type).map(name=>`<option value="${escapeAttr(name)}" ${name===selected?'selected':''}>${escapeHtml(name)}</option>`).join('');
}
function openRevenueModal(){
 modal('Nova receita',`<div class="form-grid">
  <div class="field full"><label>Descrição *</label><input id="revenueDescription" placeholder="Ex.: Receita de convênio, aporte, venda externa" data-trim></div>
  <div class="field"><label>Categoria *</label><select id="revenueCategory">${categoryOptions('receita')}</select></div>
  <div class="field"><label>Valor *</label><input id="revenueValue" data-mask="money" inputmode="numeric" placeholder="R$ 0,00"></div>
  <div class="field"><label>Data *</label><input id="revenueDate" type="date" value="${today()}"></div>
  <div class="field"><label>Situação</label><select id="revenueStatus"><option value="recebido">Já recebida</option><option value="previsto">A receber</option></select></div>
  <div class="field"><label>Forma de recebimento</label><select id="revenueMethod"><option>PIX</option><option>Dinheiro</option><option>Cartão de débito</option><option>Cartão de crédito</option><option>Transferência</option><option>Boleto</option></select></div>
  <div class="field full"><label>Observações</label><textarea id="revenueNotes" rows="3"></textarea></div>
 </div><div class="notice">Receitas previstas não aumentam o saldo real até serem marcadas como recebidas.</div>`,close=>{
  const descricao=$('#revenueDescription').value.trim();
  const categoria=$('#revenueCategory').value;
  const valor=parseLocaleNumber($('#revenueValue').value);
  const data=$('#revenueDate').value;
  const status=$('#revenueStatus').value;
  const forma=$('#revenueMethod').value;
  if(!descricao||!categoria||valor<=0||!data)return toast('Preencha descrição, categoria, valor e data.','error');
  if(status==='recebido'){
   db.data.caixa.push({id:uid(),tipo:'entrada',data,descricao,valor,forma,categoria,observacoes:$('#revenueNotes').value.trim(),createdAt:new Date().toISOString()});
  }else{
   db.data.receitasPrevistas.push({id:uid(),descricao,categoria,valor,data,status:'previsto',forma,observacoes:$('#revenueNotes').value.trim(),createdAt:new Date().toISOString()});
  }
  db.save();close();render();toast(status==='recebido'?'Receita lançada no saldo real.':'Receita adicionada à previsão.','success');
 },'Salvar receita');
 applyInputMasks($('.modal'));
}


async function openFinanceTrash(){
 try{
  const result=await cloud.request('/api/forge/finance/trash');
  const items=Array.isArray(result.items)?result.items:[];
  const typeLabel={boleto:'Boleto',despesa:'Despesa',receita:'Receita prevista',entrada:'Entrada',saida:'Saída'};
  const rows=items.length?items.map(item=>`<tr>
   <td><span class="badge gray">${typeLabel[item.type]||item.type}</span></td>
   <td><b>${escapeHtml(item.title||'Registro financeiro')}</b><small class="table-sub">${escapeHtml(item.category||'Sem categoria')}</small></td>
   <td>${item.date?formatDateBR(String(item.date).slice(0,10)):'—'}</td>
   <td><b>${money(item.amount||0)}</b></td>
   <td>${item.deletedAt?new Date(item.deletedAt).toLocaleString('pt-BR'):'—'}</td>
   <td><button class="btn primary small" data-restore-finance-id="${escapeAttr(item.id)}" data-restore-finance-type="${escapeAttr(item.type)}">Restaurar</button></td>
  </tr>`).join(''):'<tr><td colspan="6"><div class="empty">A lixeira financeira está vazia.</div></td></tr>';

  modal('Lixeira financeira',`<div class="finance-trash-intro"><span>♻</span><div><h3>Registros excluídos</h3><p>Os itens permanecem no Neon e podem ser restaurados. Nada é apagado definitivamente nesta tela.</p></div></div>
   <div class="table-wrap finance-trash-table"><table class="table"><thead><tr><th>Tipo</th><th>Registro</th><th>Data original</th><th>Valor</th><th>Excluído em</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`,
   close=>close(),
   'Fechar'
  );

  document.querySelectorAll('[data-restore-finance-id]').forEach(button=>{
   button.addEventListener('click',async()=>{
    button.disabled=true;
    button.textContent='Restaurando...';
    try{
     await cloud.request('/api/forge/finance/trash',{
      method:'PATCH',
      body:JSON.stringify({
       id:button.dataset.restoreFinanceId,
       type:button.dataset.restoreFinanceType
      })
     });
     await financeCloud.sync();
     document.querySelector('.modal-close')?.click();
     toast('Registro restaurado no Financeiro.','success');
    }catch(error){
     button.disabled=false;
     button.textContent='Restaurar';
     toast(error.message||'Não foi possível restaurar o registro.','error');
    }
   });
  });
 }catch(error){
  toast(error.message||'Não foi possível carregar a lixeira financeira.','error');
 }
}

function dateAtNoon(value){
 if(!value)return null;
 const date=new Date(`${String(value).slice(0,10)}T12:00:00`);
 return Number.isNaN(date.getTime())?null:date;
}
function expenseStatus(expense){
 if(expense.status==='pago')return 'paid';
 const due=dateAtNoon(expense.vencimento);
 const now=dateAtNoon(today());
 if(!due||!now)return 'upcoming';
 if(due.getTime()<now.getTime())return 'overdue';
 if(due.getTime()===now.getTime())return 'today';
 return 'upcoming';
}
function expenseStatusLabel(status){
 return ({overdue:'Vencida',today:'Vence hoje',upcoming:'A vencer',paid:'Paga'})[status]||'A vencer';
}
function expenseStatusClass(status){
 return ({overdue:'red',today:'yellow',upcoming:'orange',paid:'green'})[status]||'gray';
}
function pendingIncomeItems(){
 ensureData();
 return db.data.receitasPrevistas||[];
}
function financialSummary(){
 ensureData();
 const realBalance=balance();
 const pendingExpenses=db.data.despesas.filter(x=>x.status!=='pago');
 const upcoming=pendingExpenses.filter(x=>expenseStatus(x)==='upcoming').reduce((s,x)=>s+Number(x.valor||0),0);
 const dueToday=pendingExpenses.filter(x=>expenseStatus(x)==='today').reduce((s,x)=>s+Number(x.valor||0),0);
 const overdue=pendingExpenses.filter(x=>expenseStatus(x)==='overdue').reduce((s,x)=>s+Number(x.valor||0),0);
 const pendingIncome=pendingIncomeItems().filter(x=>x.status!=='recebido').reduce((s,x)=>s+Number(x.valor||0),0);
 const pendingTotal=upcoming+dueToday+overdue;
 return {
  realBalance,
  pendingIncome,
  upcoming,
  dueToday,
  overdue,
  availableAfterExpenses:realBalance-pendingTotal,
  forecastBalance:realBalance+pendingIncome-pendingTotal,
  upcomingCount:pendingExpenses.filter(x=>expenseStatus(x)==='upcoming').length,
  dueTodayCount:pendingExpenses.filter(x=>expenseStatus(x)==='today').length,
  overdueCount:pendingExpenses.filter(x=>expenseStatus(x)==='overdue').length,
  paidCount:db.data.despesas.filter(x=>x.status==='pago').length
 };
}
function filteredExpenses(filter='all'){
 ensureData();
 const rows=[...db.data.despesas].sort((a,b)=>String(a.vencimento||'').localeCompare(String(b.vencimento||'')));
 if(filter==='all')return rows;
 return rows.filter(x=>expenseStatus(x)===filter);
}
function financeFilterButton(key,label,current,count){
 return `<button class="${current===key?'active':''}" data-action="filter-expenses" data-filter="${key}">${label}<b>${count}</b></button>`;
}
function openExpenseModal(expense=null,initialStatus='pendente'){
 const editing=Boolean(expense);
 const currentStatus=expense?.status==='pago'?'pago':initialStatus;
 modal(editing?'Editar despesa':currentStatus==='pago'?'Registrar saída paga':'Nova conta a pagar',`<div class="form-grid">
  <div class="field full"><label>Descrição *</label><input id="expenseDescription" value="${escapeAttr(expense?.descricao||'')}" placeholder="Ex.: Aluguel, energia, fornecedor" data-trim></div>
  <div class="field"><label>Categoria</label><select id="expenseCategory">${categoryOptions('despesa',expense?.categoria||'')}</select></div>
  <div class="field"><label>Valor *</label><input id="expenseValue" data-mask="money" inputmode="numeric" value="${expense?money(expense.valor):''}" placeholder="R$ 0,00"></div>
  <div class="field"><label>Vencimento *</label><input id="expenseDueDate" type="date" value="${expense?.vencimento||today()}"></div>
  <div class="field"><label>Situação</label><select id="expensePaymentStatus"><option value="pendente" ${currentStatus!=='pago'?'selected':''}>Conta a pagar — não desconta agora</option><option value="pago" ${currentStatus==='pago'?'selected':''}>Já paga — descontar do saldo</option></select></div>
  <div class="field"><label>Forma de pagamento</label><select id="expensePaymentMethod">${['PIX','Dinheiro','Cartão de débito','Cartão de crédito','Boleto','Transferência'].map(name=>`<option ${name===(expense?.forma||'PIX')?'selected':''}>${name}</option>`).join('')}</select></div>
  <div class="field" id="expensePaidDateField" style="${currentStatus==='pago'?'':'display:none'}"><label>Data do pagamento</label><input id="expensePaidDate" type="date" value="${reportDateOnly(expense?.paidAt||expense?.pagoEm)||today()}"></div>
  <div class="field full"><label>Observações</label><textarea id="expenseNotes" rows="3">${escapeHtml(expense?.observacoes||'')}</textarea></div>
 </div><div id="expenseStatusNotice" class="notice">${currentStatus==='pago'?'Esta despesa será lançada imediatamente em Saídas realizadas e reduzirá o saldo.':'Enquanto estiver pendente, aparecerá apenas em Contas a pagar e no saldo previsto.'}</div>`,async close=>{
  const descricao=$('#expenseDescription').value.trim();
  const valor=parseLocaleNumber($('#expenseValue').value);
  const vencimento=$('#expenseDueDate').value;
  const status=$('#expensePaymentStatus').value;
  const paidDate=$('#expensePaidDate')?.value||today();
  if(!descricao||valor<=0||!vencimento)return toast('Preencha descrição, valor e vencimento.','error');

  const target=expense||{id:uid(),createdAt:new Date().toISOString()};
  const previousMovementId=target.caixaMovementId||null;
  Object.assign(target,{
   descricao,
   empresa:descricao,
   categoria:$('#expenseCategory').value.trim()||'Geral',
   valor,
   vencimento,
   status,
   forma:$('#expensePaymentMethod').value,
   observacoes:$('#expenseNotes').value.trim(),
   updatedAt:new Date().toISOString()
  });
  if(!editing)db.data.despesas.push(target);

  const linkedMovement=db.data.caixa.find(item=>
   String(item.id||'')===String(previousMovementId||'')||
   String(item.expenseId||item.sourceId||'')===String(target.id)
  );

  if(status==='pago'){
   const paidValue=Number(target.valor||0)+Number(target.juros||0)+Number(target.multa||0);
   const movement=linkedMovement||{id:uid(),createdAt:new Date().toISOString()};
   Object.assign(movement,{
    tipo:'saida',
    data:paidDate,
    descricao:target.descricao,
    categoria:target.categoria,
    valor:paidValue,
    forma:target.forma,
    source:'EXPENSE',
    sourceId:target.id,
    expenseId:target.id,
    observacoes:target.observacoes||''
   });
   if(!linkedMovement)db.data.caixa.push(movement);
   target.caixaMovementId=movement.id;
   target.paidAt=new Date(`${paidDate}T12:00:00`).toISOString();
   target.pagoEm=target.paidAt;
   target.valorPago=paidValue;
  }else{
   db.data.caixa=db.data.caixa.filter(item=>
    String(item.id||'')!==String(previousMovementId||'')&&
    String(item.expenseId||item.sourceId||'')!==String(target.id)
   );
   target.caixaMovementId=null;
   target.paidAt=null;
   target.pagoEm=null;
   target.valorPago=null;
  }

  db.save();
  if(financeCloud.ready){
   clearTimeout(financeCloud.saveTimer);
   await financeCloud.push();
  }
  close();render();
  toast(status==='pago'?`Saída registrada e descontada do saldo: ${money(target.valorPago)}.`:(editing?'Conta a pagar atualizada.':'Conta a pagar cadastrada.'),'success');
 },editing?'Salvar alterações':currentStatus==='pago'?'Registrar saída':'Cadastrar conta');
 applyInputMasks($('.modal'));
 const statusSelect=$('#expensePaymentStatus');
 statusSelect?.addEventListener('change',()=>{
  const paid=statusSelect.value==='pago';
  $('#expensePaidDateField').style.display=paid?'block':'none';
  $('#expenseStatusNotice').textContent=paid?'Esta despesa será lançada imediatamente em Saídas realizadas e reduzirá o saldo.':'Enquanto estiver pendente, aparecerá apenas em Contas a pagar e no saldo previsto.';
 });
}

function openExpenseChoice(){
 modal('Adicionar despesa',`<div class="expense-choice-grid">
  <button type="button" class="expense-choice-card" id="choosePendingExpense"><span>🗓</span><h3>Conta a pagar</h3><p>Cadastre uma despesa futura. Ela não reduz o saldo real até ser marcada como paga.</p></button>
  <button type="button" class="expense-choice-card paid" id="choosePaidExpense"><span>💸</span><h3>Saída já paga</h3><p>Registre um gasto que já aconteceu. Ele entra imediatamente em Saídas realizadas.</p></button>
 </div>`,close=>close(),'Fechar');
 $('#choosePendingExpense').onclick=()=>{$('.modal-close')?.click();setTimeout(()=>openExpenseModal(null,'pendente'),60)};
 $('#choosePaidExpense').onclick=()=>{$('.modal-close')?.click();setTimeout(()=>openExpenseModal(null,'pago'),60)};
}



function addMonthsToDate(dateString,months){
 const [year,month,day]=String(dateString||today()).split('-').map(Number);
 const target=new Date(year,month-1+Number(months||0),day,12,0,0);
 if(target.getDate()!==day)target.setDate(0);
 return `${target.getFullYear()}-${String(target.getMonth()+1).padStart(2,'0')}-${String(target.getDate()).padStart(2,'0')}`;
}
function splitMoneyInInstallments(total,count){
 const cents=Math.round(Number(total||0)*100);
 const quantity=Math.max(1,Number(count||1));
 const base=Math.floor(cents/quantity);
 const remainder=cents-base*quantity;
 return Array.from({length:quantity},(_,index)=>(base+(index===quantity-1?remainder:0))/100);
}

function fixedDayDate(baseDate,index,fixedDay){
 const [year,month]=String(baseDate||today()).split('-').map(Number);
 const target=new Date(year,month-1+index,1,12,0,0);
 const lastDay=new Date(target.getFullYear(),target.getMonth()+1,0).getDate();
 target.setDate(Math.min(Math.max(1,Number(fixedDay||1)),lastDay));
 return `${target.getFullYear()}-${String(target.getMonth()+1).padStart(2,'0')}-${String(target.getDate()).padStart(2,'0')}`;
}
function boletoDueDate(firstDue,index,mode,intervalDays,fixedDay){
 if(index===0)return firstDue;
 if(mode==='monthly')return addMonthsToDate(firstDue,index);
 if(mode==='fixed-day')return fixedDayDate(firstDue,index,Number(fixedDay||1));
 const base=new Date(`${firstDue}T12:00:00`);
 base.setDate(base.getDate()+Math.max(1,Number(intervalDays||1))*index);
 return `${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,'0')}-${String(base.getDate()).padStart(2,'0')}`;
}

function boletoFinancialTotal(invoiceTotal,tax,taxIncluded){
 const note=Math.max(0,Number(invoiceTotal||0));
 const taxValue=Math.max(0,Number(tax||0));
 return taxIncluded?note:note+taxValue;
}
function boletoBatchSummary(batch){
 const original=Number(batch[0]?.valorNota??batch.reduce((sum,item)=>sum+Number(item.valor||0),0));
 const tax=Number(batch[0]?.imposto||0);
 const total=Number(batch[0]?.totalFinanceiro??batch.reduce((sum,item)=>sum+Number(item.valor||0),0));
 const paid=batch.filter(item=>item.status==='pago').reduce((sum,item)=>sum+Number(item.valorPago??item.valor??0),0);
 return {original,tax,total,paid,pending:Math.max(0,total-paid)};
}


function financePeriodState(){
 const now=new Date();
 const currentMonth=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
 const lastDay=String(new Date(now.getFullYear(),now.getMonth()+1,0).getDate()).padStart(2,'0');
 const saved=window.financePeriodFilter||{};
 return {
  mode:saved.mode||'month',
  month:saved.month||currentMonth,
  from:saved.from||`${currentMonth}-01`,
  to:saved.to||`${currentMonth}-${lastDay}`
 };
}
function monthRange(monthValue){
 const [year,month]=String(monthValue||'').split('-').map(Number);
 if(!year||!month)return {from:'',to:''};
 const last=new Date(year,month,0).getDate();
 return {from:`${year}-${String(month).padStart(2,'0')}-01`,to:`${year}-${String(month).padStart(2,'0')}-${String(last).padStart(2,'0')}`};
}
function activeFinanceRange(){
 const state=financePeriodState();
 if(state.mode==='all')return {from:'',to:'',label:'Todo o período'};
 if(state.mode==='custom'){
  return {from:state.from||'',to:state.to||'',label:state.from&&state.to?`${formatDateBR(state.from)} até ${formatDateBR(state.to)}`:'Período personalizado'};
 }
 const range=monthRange(state.month);
 const [year,month]=String(state.month||'').split('-').map(Number);
 const raw=year&&month?new Date(year,month-1,1).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}):'Mês atual';
 return {...range,label:raw.charAt(0).toUpperCase()+raw.slice(1)};
}
function dateInFinanceRange(value){
 const date=String(value||'').slice(0,10),range=activeFinanceRange();
 if(!date)return false;
 if(range.from&&date<range.from)return false;
 if(range.to&&date>range.to)return false;
 return true;
}
function financePeriodSummary(){
 ensureData();
 const payables=(db.data.despesas||[]).filter(item=>dateInFinanceRange(item.vencimento));
 const revenues=(db.data.receitasPrevistas||[]).filter(item=>dateInFinanceRange(item.data||item.expectedDate));
 const transactions=(db.data.caixa||[]).filter(item=>dateInFinanceRange(item.data));

 const incomeReal=transactions.filter(item=>item.tipo==='entrada').reduce((sum,item)=>sum+Number(item.valor||0),0);
 const expenseReal=transactions.filter(item=>item.tipo==='saida').reduce((sum,item)=>sum+Number(item.valor||0),0);
 const realBalance=incomeReal-expenseReal;
 const pending=payables.filter(item=>item.status!=='pago');
 const updatedValue=item=>Number(item.valor||0)+Number(item.juros||0)+Number(item.multa||0);
 const upcoming=pending.filter(item=>expenseStatus(item)==='upcoming').reduce((sum,item)=>sum+updatedValue(item),0);
 const dueToday=pending.filter(item=>expenseStatus(item)==='today').reduce((sum,item)=>sum+updatedValue(item),0);
 const overdue=pending.filter(item=>expenseStatus(item)==='overdue').reduce((sum,item)=>sum+updatedValue(item),0);
 const pendingIncome=revenues.filter(item=>item.status!=='recebido').reduce((sum,item)=>sum+Number(item.valor||0),0);
 const pendingTotal=upcoming+dueToday+overdue;

 return {
  payables,revenues,transactions,incomeReal,expenseReal,realBalance,pendingIncome,upcoming,dueToday,overdue,
  availableAfterExpenses:realBalance-pendingTotal,
  forecastBalance:realBalance+pendingIncome-pendingTotal,
  upcomingCount:pending.filter(item=>expenseStatus(item)==='upcoming').length,
  dueTodayCount:pending.filter(item=>expenseStatus(item)==='today').length,
  overdueCount:pending.filter(item=>expenseStatus(item)==='overdue').length,
  paidCount:payables.filter(item=>item.status==='pago').length
 };
}
function financePeriodControls(){
 const state=financePeriodState(),range=activeFinanceRange();
 return `<div class="finance-period-panel">
  <div class="finance-period-head"><div><span>PERÍODO FINANCEIRO</span><h3>${escapeHtml(range.label)}</h3></div>
   <div class="finance-period-actions">
    <button class="${state.mode==='month'?'active':''}" data-action="set-finance-period-mode" data-mode="month">Mês específico</button>
    <button class="${state.mode==='custom'?'active':''}" data-action="set-finance-period-mode" data-mode="custom">Período personalizado</button>
    <button class="${state.mode==='all'?'active':''}" data-action="set-finance-period-mode" data-mode="all">Tudo</button>
   </div>
  </div>
  <div class="finance-period-fields">
   <div class="field" style="${state.mode==='month'?'':'display:none'}"><label>Mês</label><input id="financePeriodMonth" type="month" value="${escapeAttr(state.month)}"></div>
   <div class="field" style="${state.mode==='custom'?'':'display:none'}"><label>De</label><input id="financePeriodFrom" type="date" value="${escapeAttr(state.from)}"></div>
   <div class="field" style="${state.mode==='custom'?'':'display:none'}"><label>Até</label><input id="financePeriodTo" type="date" value="${escapeAttr(state.to)}"></div>
   <button class="btn primary" data-action="apply-finance-period">Aplicar filtro</button>
  </div>
 </div>`;
}

function boletoAlerts(){ensureData();const tomorrow=daysFromNow(1);return db.data.boletos.filter(x=>x.status!=='pago'&&x.vencimento===tomorrow);}
function updateNotificationBadge(){const badge=document.querySelector('[data-action="notifications"] b');if(!badge)return;const count=boletoAlerts().length;badge.textContent=String(count);badge.style.display=count?'grid':'none';badge.setAttribute('aria-label',`${count} boleto(s) vencendo amanhã`);}
function availableAgendaTimes(date,ignoreId='',serviceId=''){const cfg=db.data.config||{},start=cfg.inicioAgenda||'08:00',end=cfg.fimAgenda||'18:00',step=Math.max(5,Number(cfg.intervaloAgenda||30)),duration=Math.max(15,Number(db.data.servicos.find(s=>s.id===serviceId)?.duracao||60)),toMin=x=>{const [h,m]=String(x||'00:00').split(':').map(Number);return h*60+m},fmt=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`,busy=db.data.agenda.filter(a=>a.id!==ignoreId&&a.data===date&&!['Cancelado','Concluído','Não compareceu'].includes(a.status)).map(a=>{const d=Math.max(15,Number(db.data.servicos.find(s=>s.id===a.servicoId)?.duracao||60));const appointmentStart=toMin(a.hora);return[appointmentStart,appointmentStart+d]}),out=[],endMin=toMin(end);for(let n=toMin(start);n+duration<=endMin;n+=step){if(!busy.some(([a,b])=>n<b&&n+duration>a))out.push(fmt(n))}return out;}
function searchAll(term){term=(term||'').trim().toLowerCase();if(!term){render();return;}const clientes=db.data.clientes.filter(c=>[c.nome,c.telefone,c.cpf,c.email].some(v=>String(v||'').toLowerCase().includes(term)));const pets=db.data.pets.filter(p=>[p.nome,p.raca,p.especie].some(v=>String(v||'').toLowerCase().includes(term)));const agenda=db.data.agenda.filter(a=>{const p=db.data.pets.find(x=>x.id===a.petId),s=db.data.servicos.find(x=>x.id===a.servicoId);return [p?.nome,s?.nome,a.data,a.hora,a.status].some(v=>String(v||'').toLowerCase().includes(term))});$('#pageTitle').textContent='Resultados da busca';$('#pageSubtitle').textContent=`Busca por “${term}”`;$('#content').innerHTML=`<div class="two-col"><div class="card"><div class="section-title"><h2>Clientes (${clientes.length})</h2></div>${clientes.length?clientes.map(c=>`<div class="search-result clickable" data-action="go-clientes"><strong>${c.nome}</strong><small>${c.telefone||'Sem telefone'}</small></div>`).join(''):'<div class="empty">Nenhum cliente.</div>'}</div><div class="card"><div class="section-title"><h2>Pets (${pets.length})</h2></div>${pets.length?pets.map(p=>`<div class="search-result clickable" data-action="view-pet" data-id="${p.id}"><strong>${p.nome}</strong><small>${p.raca||p.especie}</small></div>`).join(''):'<div class="empty">Nenhum pet.</div>'}</div></div><div class="card" style="margin-top:16px"><div class="section-title"><h2>Atendimentos (${agenda.length})</h2></div>${agendaList(agenda)}</div>`;}
function movementModal(type='entrada'){actions['quick-movement']({dataset:{preset:type}})}


let fiscalExperienceState={moduleActive:false,config:null,documents:[],step:1};

function fiscalStatusLabel(status){
 const labels={DRAFT:'Rascunho',PROCESSING:'Processando',AUTHORIZED:'Autorizada',REJECTED:'Rejeitada',CANCELED:'Cancelada'};
 return labels[status]||status||'Rascunho';
}
function fiscalStatusClass(status){
 return ({AUTHORIZED:'green',REJECTED:'red',CANCELED:'red',PROCESSING:'yellow',DRAFT:'gray'})[status]||'gray';
}
function fiscalConfigComplete(c){
 return Boolean(c&&c.cnpj&&c.municipalRegistration&&c.city&&c.state&&c.ibgeCode&&c.serviceListCode&&c.issRate!==null&&c.issRate!==undefined);
}
function fiscalDocMoney(v){return money(Number(v||0))}
function fiscalDate(v){return v?new Date(v).toLocaleString('pt-BR'):'—'}

async function loadFiscalExperience(){
 const host=$('#content');
 if(!host||page!=='fiscal')return;
 try{
  const [cfgResult,docsResult]=await Promise.all([
   cloud.request('/api/forge/fiscal/config'),
   cloud.request('/api/forge/fiscal/documents')
  ]);
  fiscalExperienceState={
   moduleActive:Boolean(cfgResult.moduleActive),
   config:cfgResult.config||null,
   documents:Array.isArray(docsResult.documents)?docsResult.documents:[],
   step:1
  };
  renderFiscalExperience();
 }catch(error){
  host.innerHTML=`<section class="fiscal-experience"><div class="card fiscal-error"><span>!</span><h2>Não foi possível carregar o módulo</h2><p>${escapeHtml(error.message||'Tente novamente em instantes.')}</p><button class="btn primary" data-action="go-marketplace">Voltar ao Marketplace</button></div></section>`;
 }
}

function renderFiscalExperience(){
 const host=$('#content');
 if(!host||page!=='fiscal')return;
 const s=fiscalExperienceState;
 if(!s.moduleActive){
  host.innerHTML=`<section class="fiscal-experience"><div class="fiscal-locked">
   <div class="fiscal-locked-icon">🔒</div>
   <span class="fiscal-eyebrow">MÓDULO OPCIONAL</span>
   <h2>Emita NFS-e diretamente pelo Forge Pets</h2>
   <p>Integre os serviços do Caixa ao fluxo fiscal, acompanhe autorizações e mantenha XML e PDF organizados por empresa.</p>
   <div class="fiscal-benefits"><span>✓ Emissão pelo Caixa</span><span>✓ Histórico fiscal</span><span>✓ XML e PDF</span><span>✓ Dados por empresa</span></div>
   <strong>R$ 49,00 <small>/mês</small></strong>
   <button class="btn primary" data-action="go-marketplace">Contratar no Marketplace</button>
  </div></section>`;
  return;
 }
 if(!fiscalConfigComplete(s.config)){
  host.innerHTML=fiscalWizardHtml(s.config||{});
  bindFiscalWizard();
  return;
 }
 host.innerHTML=fiscalDashboardHtml(s.config,s.documents);
 bindFiscalDashboard();
}

function fiscalWizardHtml(c){
 const step=fiscalExperienceState.step||1;
 const titles=['Dados da empresa','Município','Tributação','Integração','Revisão'];
 const progress=titles.map((t,i)=>`<div class="fiscal-step ${i+1===step?'active':''} ${i+1<step?'done':''}"><i>${i+1<step?'✓':i+1}</i><span>${t}</span></div>`).join('');
 const common=`<div class="fiscal-wizard-head"><div><span class="fiscal-eyebrow">CONFIGURAÇÃO INICIAL</span><h2>Bem-vindo ao Módulo Fiscal</h2><p>Vamos preparar a empresa para emitir NFS-e. Os dados devem ser confirmados com a contabilidade.</p></div><b>Etapa ${step} de 5</b></div><div class="fiscal-progress">${progress}</div>`;
 let body='';
 if(step===1)body=`<div class="fiscal-wizard-card"><h3>Dados da empresa</h3><p>Identificação do prestador de serviços.</p><div class="form-grid">
  <div class="field"><label>Razão social</label><input id="fwLegalName" value="${escapeAttr(c.legalName||'')}" data-trim></div>
  <div class="field"><label>Nome fantasia</label><input id="fwTradeName" value="${escapeAttr(c.tradeName||db.data.config.empresa||'')}" data-trim></div>
  <div class="field"><label>CNPJ</label><input id="fwCnpj" value="${escapeAttr(c.cnpj||'')}" data-mask="cnpj" placeholder="00.000.000/0000-00"></div>
  <div class="field"><label>Inscrição Municipal</label><input id="fwMunicipalRegistration" value="${escapeAttr(c.municipalRegistration||'')}" data-trim></div>
 </div></div>`;
 if(step===2)body=`<div class="fiscal-wizard-card"><h3>Município emissor</h3><p>A NFS-e pertence ao município onde o serviço é tributado.</p><div class="form-grid">
  <div class="field"><label>Município</label><input id="fwCity" value="${escapeAttr(c.city||'')}" placeholder="Ex.: Gravataí" data-trim></div>
  <div class="field"><label>UF</label><input id="fwState" value="${escapeAttr(c.state||'RS')}" maxlength="2" placeholder="RS" data-trim></div>
  <div class="field full"><label>Código IBGE do município</label><input id="fwIbgeCode" value="${escapeAttr(c.ibgeCode||'')}" inputmode="numeric" maxlength="7" placeholder="7 dígitos"></div>
 </div><div class="notice">A compatibilidade será validada na etapa de integração. Alguns municípios usam o padrão nacional e outros mantêm sistema próprio.</div></div>`;
 if(step===3)body=`<div class="fiscal-wizard-card"><h3>Tributação do serviço</h3><p>Use os códigos informados pela contabilidade.</p><div class="form-grid">
  <div class="field"><label>Regime tributário</label><input id="fwTaxRegime" value="${escapeAttr(c.taxRegime||'')}" placeholder="Ex.: Simples Nacional" data-trim></div>
  <div class="field"><label>Código do serviço</label><input id="fwServiceListCode" value="${escapeAttr(c.serviceListCode||'')}" placeholder="Item da lista de serviços" data-trim></div>
  <div class="field"><label>CNAE</label><input id="fwCnae" value="${escapeAttr(c.cnae||'')}" data-trim></div>
  <div class="field"><label>NBS</label><input id="fwNbsCode" value="${escapeAttr(c.nbsCode||'')}" data-trim></div>
  <div class="field"><label>Alíquota de ISS (%)</label><input id="fwIssRate" value="${escapeAttr(c.issRate??'')}" inputmode="decimal" placeholder="2,00"></div>
  <label class="switch-field"><input id="fwSimples" type="checkbox" ${c.simplesNacional?'checked':''}><span></span><div><b>Optante pelo Simples Nacional</b><small>Confirme com a contabilidade.</small></div></label>
 </div></div>`;
 if(step===4)body=`<div class="fiscal-wizard-card"><h3>Integração</h3><p>Defina o ambiente e o sistema utilizado pelo município.</p><div class="form-grid">
  <div class="field"><label>Modelo de integração</label><select id="fwIntegrationType"><option value="NATIONAL" ${c.integrationType!=='MUNICIPAL'?'selected':''}>Padrão Nacional da NFS-e</option><option value="MUNICIPAL" ${c.integrationType==='MUNICIPAL'?'selected':''}>Sistema próprio da prefeitura</option></select></div>
  <div class="field" id="fwProviderField" style="${c.integrationType==='MUNICIPAL'?'':'display:none'}"><label>Provedor municipal</label><input id="fwMunicipalProvider" value="${escapeAttr(c.municipalProvider||'')}" placeholder="Ex.: IPM, Betha, Nota Control" data-trim></div>
  <div class="field"><label>Ambiente inicial</label><select id="fwEnvironment"><option value="HOMOLOGATION" ${c.environment!=='PRODUCTION'?'selected':''}>Homologação / testes</option><option value="PRODUCTION" ${c.environment==='PRODUCTION'?'selected':''}>Produção</option></select></div>
 </div><div class="fiscal-test-box"><span>🧪</span><div><b>Primeiro em homologação</b><p>A emissão real será liberada somente após validar os dados, credenciais e compatibilidade do município.</p></div></div></div>`;
 if(step===5)body=`<div class="fiscal-wizard-card fiscal-review"><h3>Revisão da configuração</h3><p>Confira os dados antes de salvar.</p>
  <div class="fiscal-review-grid">
   <div><small>Empresa</small><b>${escapeHtml(c.legalName||'Não informado')}</b><span>${escapeHtml(c.cnpj||'CNPJ pendente')}</span></div>
   <div><small>Município</small><b>${escapeHtml(c.city||'Não informado')} / ${escapeHtml(c.state||'—')}</b><span>IBGE ${escapeHtml(c.ibgeCode||'pendente')}</span></div>
   <div><small>Serviço</small><b>${escapeHtml(c.serviceListCode||'Não informado')}</b><span>ISS ${escapeHtml(String(c.issRate??'—'))}%</span></div>
   <div><small>Integração</small><b>${c.integrationType==='MUNICIPAL'?'Prefeitura / provedor':'Padrão Nacional'}</b><span>${c.environment==='PRODUCTION'?'Produção':'Homologação'}</span></div>
  </div>
  <label class="switch-field full"><input id="fwActive" type="checkbox" ${c.active?'checked':''}><span></span><div><b>Configuração pronta para emissão</b><small>Deixe desligado enquanto estiver apenas preparando os dados.</small></div></label>
 </div>`;
 return `<section class="fiscal-experience">${common}${body}<div class="fiscal-wizard-actions"><button class="btn ghost" id="fiscalWizardBack" ${step===1?'disabled':''}>← Voltar</button><button class="btn primary" id="fiscalWizardNext">${step===5?'Salvar configuração':'Próximo →'}</button></div></section>`;
}

function fiscalCollectStep(){
 const c={...(fiscalExperienceState.config||{})};
 const val=id=>$('#'+id)?.value?.trim();
 if($('#fwLegalName'))Object.assign(c,{legalName:val('fwLegalName'),tradeName:val('fwTradeName'),cnpj:val('fwCnpj'),municipalRegistration:val('fwMunicipalRegistration')});
 if($('#fwCity'))Object.assign(c,{city:val('fwCity'),state:(val('fwState')||'').toUpperCase(),ibgeCode:val('fwIbgeCode')});
 if($('#fwTaxRegime'))Object.assign(c,{taxRegime:val('fwTaxRegime'),serviceListCode:val('fwServiceListCode'),cnae:val('fwCnae'),nbsCode:val('fwNbsCode'),issRate:val('fwIssRate'),simplesNacional:$('#fwSimples').checked});
 if($('#fwIntegrationType'))Object.assign(c,{integrationType:val('fwIntegrationType'),municipalProvider:val('fwMunicipalProvider'),environment:val('fwEnvironment')});
 if($('#fwActive'))c.active=$('#fwActive').checked;
 fiscalExperienceState.config=c;
 return c;
}
function fiscalValidateStep(step,c){
 if(step===1&&(!c.cnpj||String(c.cnpj).replace(/\D/g,'').length!==14))return 'Informe um CNPJ válido com 14 dígitos.';
 if(step===1&&!c.municipalRegistration)return 'Informe a Inscrição Municipal.';
 if(step===2&&(!c.city||!c.state||c.state.length!==2))return 'Informe o município e a UF.';
 if(step===2&&String(c.ibgeCode||'').replace(/\D/g,'').length!==7)return 'Informe o código IBGE com 7 dígitos.';
 if(step===3&&!c.serviceListCode)return 'Informe o código do serviço.';
 if(step===3&&(c.issRate===''||c.issRate===null||c.issRate===undefined))return 'Informe a alíquota de ISS.';
 if(step===4&&c.integrationType==='MUNICIPAL'&&!c.municipalProvider)return 'Informe o provedor utilizado pela prefeitura.';
 return '';
}
function bindFiscalWizard(){
 applyInputMasks(document);
 $('#fwIntegrationType')?.addEventListener('change',e=>{$('#fwProviderField').style.display=e.target.value==='MUNICIPAL'?'block':'none';});
 $('#fiscalWizardBack').onclick=()=>{fiscalCollectStep();fiscalExperienceState.step=Math.max(1,fiscalExperienceState.step-1);renderFiscalExperience();};
 $('#fiscalWizardNext').onclick=async()=>{
  const c=fiscalCollectStep(),error=fiscalValidateStep(fiscalExperienceState.step,c);
  if(error)return toast(error,'error');
  if(fiscalExperienceState.step<5){fiscalExperienceState.step++;renderFiscalExperience();return;}
  try{
   const result=await cloud.request('/api/forge/fiscal/config',{method:'PUT',body:JSON.stringify(c)});
   fiscalExperienceState.config=result.config;
   toast(result.message||'Configuração fiscal salva.','success');
   renderFiscalExperience();
  }catch(error){toast(error.message||'Não foi possível salvar a configuração.','error');}
 };
}
function fiscalDashboardHtml(c,docs){
 const authorized=docs.filter(d=>d.status==='AUTHORIZED');
 const canceled=docs.filter(d=>d.status==='CANCELED');
 const now=new Date(),month=now.getMonth(),year=now.getFullYear();
 const monthly=authorized.filter(d=>{const x=new Date(d.issuedAt||d.createdAt);return x.getMonth()===month&&x.getFullYear()===year;});
 const todayDocs=authorized.filter(d=>new Date(d.issuedAt||d.createdAt).toDateString()===now.toDateString());
 const iss=monthly.reduce((sum,d)=>sum+Number(d.issAmount||0),0);
 const rows=docs.length?docs.map(d=>`<tr><td><b>${escapeHtml(d.nfseNumber||d.rpsNumber||'Aguardando')}</b></td><td>${fiscalDate(d.issuedAt||d.createdAt)}</td><td>${escapeHtml(d.tutorName||'Consumidor')}</td><td>${escapeHtml(d.serviceDescription||'Serviço')}</td><td><b>${fiscalDocMoney(d.serviceAmount)}</b></td><td><span class="badge ${fiscalStatusClass(d.status)}">${fiscalStatusLabel(d.status)}</span></td><td>${d.pdfUrl?`<a class="btn ghost" href="${escapeAttr(d.pdfUrl)}" target="_blank">PDF</a>`:'—'} ${d.xmlUrl?`<a class="btn ghost" href="${escapeAttr(d.xmlUrl)}" target="_blank">XML</a>`:''}</td></tr>`).join(''):'<tr><td colspan="7"><div class="empty">Nenhum documento fiscal registrado ainda.</div></td></tr>';
 return `<section class="fiscal-experience">
  <div class="fiscal-dashboard-hero"><div><span class="fiscal-eyebrow">MÓDULO FISCAL ATIVO</span><h2>Central de NFS-e</h2><p>${escapeHtml(c.tradeName||c.legalName||'Empresa')} · ${escapeHtml(c.city||'')} / ${escapeHtml(c.state||'')}</p></div><div class="fiscal-environment ${c.environment==='PRODUCTION'?'production':'homologation'}"><small>AMBIENTE</small><b>${c.environment==='PRODUCTION'?'Produção':'Homologação'}</b><span>${c.active?'Configuração liberada':'Configuração em preparação'}</span></div></div>
  <div class="fiscal-kpis">
   <article><span>🧾</span><small>Emitidas hoje</small><strong>${todayDocs.length}</strong><em>notas autorizadas</em></article>
   <article><span>📅</span><small>Emitidas no mês</small><strong>${monthly.length}</strong><em>${fiscalDocMoney(monthly.reduce((s,d)=>s+Number(d.serviceAmount||0),0))} em serviços</em></article>
   <article><span>↩</span><small>Canceladas</small><strong>${canceled.length}</strong><em>histórico total</em></article>
   <article><span>％</span><small>ISS estimado no mês</small><strong>${fiscalDocMoney(iss)}</strong><em>conforme documentos</em></article>
  </div>
  <div class="fiscal-dashboard-actions"><button class="btn primary" id="fiscalNewDocument" ${!c.active?'disabled':''}>＋ Emitir NFS-e</button><button class="btn ghost" id="fiscalEditConfig">⚙ Configurações</button><button class="btn ghost" id="fiscalRefresh">↻ Atualizar</button></div>
  ${!c.active?'<div class="notice fiscal-warning">A configuração ainda não está marcada como pronta para emissão. Revise os dados e conclua a homologação.</div>':''}
  <div class="card fiscal-history-card"><div class="section-title"><div><h2>Histórico fiscal</h2><p>Documentos vinculados à empresa.</p></div><div class="fiscal-filter"><input id="fiscalHistorySearch" placeholder="Buscar tutor, serviço ou número..."></div></div>
   <div class="table-wrap"><table class="table"><thead><tr><th>NFS-e / RPS</th><th>Data</th><th>Tutor</th><th>Serviço</th><th>Valor</th><th>Status</th><th>Arquivos</th></tr></thead><tbody id="fiscalHistoryRows">${rows}</tbody></table></div>
  </div>
 </section>`;
}
function openFiscalDocumentModal(prefill={}){
 const c=fiscalExperienceState.config||{},defaultRate=Number(c.issRate||0);
 modal('Nova NFS-e',`<div class="fiscal-issue-form"><div class="notice"><b>Emissão controlada:</b> este fluxo registra a solicitação no Forge Pets. A transmissão à prefeitura será habilitada após a integração do município.</div><div class="form-grid">
  <div class="field"><label>Tutor / tomador</label><input id="fdTutorName" value="${escapeAttr(prefill.tutorName||'')}" placeholder="Nome do cliente" data-trim></div>
  <div class="field"><label>CPF/CNPJ do tomador</label><input id="fdTutorDocument" value="${escapeAttr(prefill.tutorDocument||'')}" inputmode="numeric" placeholder="Somente números"></div>
  <div class="field full"><label>Descrição do serviço</label><textarea id="fdServiceDescription" rows="4" placeholder="Descreva o serviço prestado">${escapeHtml(prefill.serviceDescription||'')}</textarea></div>
  <div class="field"><label>Valor do serviço</label><input id="fdServiceAmount" data-mask="money" inputmode="numeric" value="${prefill.serviceAmount?money(prefill.serviceAmount):''}" placeholder="R$ 0,00"></div>
  <div class="field"><label>Alíquota de ISS</label><input value="${escapeAttr(String(defaultRate).replace('.',','))}%" disabled></div>
  <div class="field full"><label>Referência da venda</label><input id="fdSaleReference" value="${escapeAttr(prefill.saleReference||'')}" placeholder="Ex.: Venda #000123" data-trim></div>
 </div></div>`,async close=>{
  const tutorName=$('#fdTutorName')?.value.trim()||'',tutorDocument=onlyDigits($('#fdTutorDocument')?.value||''),serviceDescription=$('#fdServiceDescription')?.value.trim()||'',serviceAmount=parseLocaleNumber($('#fdServiceAmount')?.value),saleReference=$('#fdSaleReference')?.value.trim()||'';
  if(!serviceDescription||serviceAmount<=0)return setModalError('Informe a descrição e um valor válido para o serviço.');
  if(tutorDocument&&![11,14].includes(tutorDocument.length))return setModalError('O CPF/CNPJ do tomador deve ter 11 ou 14 dígitos.');
  try{
   const result=await cloud.request('/api/forge/fiscal/documents',{method:'POST',body:JSON.stringify({tutorName,tutorDocument,serviceDescription,serviceAmount,saleReference})});
   close();toast(result.message||'Documento fiscal registrado.','success');await loadFiscalExperience();
  }catch(error){setModalError(error.message||'Não foi possível registrar o documento fiscal.');}
 },'Registrar para emissão');
 applyInputMasks($('#modalRoot'));
}
function bindFiscalDashboard(){
 $('#fiscalEditConfig').onclick=()=>{fiscalExperienceState.step=1;renderFiscalExperience();};
 $('#fiscalRefresh').onclick=loadFiscalExperience;
 $('#fiscalNewDocument').onclick=()=>openFiscalDocumentModal();
 $('#fiscalHistorySearch')?.addEventListener('input',e=>{
  const q=normalize(e.target.value);
  const docs=fiscalExperienceState.documents.filter(d=>normalize([d.nfseNumber,d.rpsNumber,d.tutorName,d.serviceDescription,d.status].join(' ')).includes(q));
  $('#fiscalHistoryRows').innerHTML=docs.length?docs.map(d=>`<tr><td><b>${escapeHtml(d.nfseNumber||d.rpsNumber||'Aguardando')}</b></td><td>${fiscalDate(d.issuedAt||d.createdAt)}</td><td>${escapeHtml(d.tutorName||'Consumidor')}</td><td>${escapeHtml(d.serviceDescription||'Serviço')}</td><td><b>${fiscalDocMoney(d.serviceAmount)}</b></td><td><span class="badge ${fiscalStatusClass(d.status)}">${fiscalStatusLabel(d.status)}</span></td><td>${d.pdfUrl?`<a class="btn ghost" href="${escapeAttr(d.pdfUrl)}" target="_blank">PDF</a>`:'—'} ${d.xmlUrl?`<a class="btn ghost" href="${escapeAttr(d.xmlUrl)}" target="_blank">XML</a>`:''}</td></tr>`).join(''):'<tr><td colspan="7"><div class="empty">Nenhum resultado encontrado.</div></td></tr>';
 });
}

const actions={
 'open-stock-product':button=>openStockProductModal(button.dataset.id),
 'sync-company-data':async()=>{const button=document.querySelector('[data-action="sync-company-data"]');if(button){button.disabled=true;button.textContent='Sincronizando...';}try{await workspaceCloud.push();await cloud.sync();await financeCloud.sync();await workspaceCloud.push();toast('Dados sincronizados com o Neon.','success');}catch(error){toast(error.message||'Não foi possível sincronizar agora.','error');}finally{if(button){button.disabled=false;button.textContent='Sincronizar agora';}updateWorkspaceStatusUI();}},
 'delete-appointment':button=>{
  const appointment=db.data.agenda.find(item=>String(item.id)===String(button.dataset.id));
  if(!appointment)return toast('Atendimento não encontrado.','error');
  modal('Excluir atendimento',`<p>Excluir definitivamente este atendimento duplicado?</p><div class="notice danger">O atendimento e eventual valor em aberto vinculado serão removidos. Esta ação deve ser usada apenas para lançamentos duplicados.</div>`,async close=>{
   try{
    await cloud.request(`/api/forge/agenda/${appointment.id}?permanent=1`,{method:'DELETE'});
    db.data.agenda=db.data.agenda.filter(item=>String(item.id)!==String(appointment.id));
    db.data.pendencias=(db.data.pendencias||[]).filter(item=>String(item.agendaId||'')!==String(appointment.id));
    localStorage.setItem('vetcoreShopPro',JSON.stringify(db.data));
    close();render();toast('Atendimento duplicado excluído.','success');
   }catch(error){setModalError(error.message||'Não foi possível excluir o atendimento.');}
  },'Excluir atendimento');
 },
 'delete-expense':button=>{
  const expense=db.data.despesas.find(item=>String(item.id)===String(button.dataset.id));
  if(!expense)return toast('Despesa não encontrada.','error');
  modal('Excluir lançamento',`<p>Enviar <b>${escapeHtml(expense.descricao||'esta despesa')}</b> para a Lixeira?</p><div class="notice">Ela poderá ser restaurada depois em Financeiro → Lixeira.</div>`,close=>{
   db.data.despesas=db.data.despesas.filter(item=>String(item.id)!==String(expense.id));
   db.data.caixa=db.data.caixa.filter(item=>String(item.expenseId||item.sourceId||'')!==String(expense.id));
   db.save();close();render();toast('Lançamento enviado para a Lixeira.','success');
  },'Excluir lançamento');
 },
 'delete-finance-transaction':button=>{
  const transaction=db.data.caixa.find(item=>String(item.id)===String(button.dataset.id));
  if(!transaction)return toast('Movimentação não encontrada.','error');
  modal('Excluir movimentação',`<p>Enviar <b>${escapeHtml(transaction.descricao||'esta movimentação')}</b> para a Lixeira?</p><div class="notice">Se esta saída veio de uma despesa paga, a despesa voltará para pendente.</div>`,close=>{
   const linkedExpense=db.data.despesas.find(item=>String(item.id)===String(transaction.expenseId||transaction.sourceId||''));
   if(linkedExpense){
    linkedExpense.status='pendente';
    linkedExpense.paidAt=null;
    linkedExpense.pagoEm=null;
    linkedExpense.valorPago=null;
    linkedExpense.caixaMovementId=null;
   }
   db.data.caixa=db.data.caixa.filter(item=>String(item.id)!==String(transaction.id));
   db.save();close();render();toast('Movimentação enviada para a Lixeira.','success');
  },'Excluir movimentação');
 },

 'set-finance-period-mode':button=>{
  window.financePeriodFilter={...financePeriodState(),mode:button.dataset.mode||'month'};
  render();
 },
 'apply-finance-period':()=>{
  const state=financePeriodState();
  const next={...state,month:$('#financePeriodMonth')?.value||state.month,from:$('#financePeriodFrom')?.value||state.from,to:$('#financePeriodTo')?.value||state.to};
  if(next.mode==='custom'&&next.from&&next.to&&next.from>next.to)return toast('A data inicial não pode ser maior que a final.','error');
  window.financePeriodFilter=next;render();toast('Filtro financeiro aplicado.','success');
 },

 'finance-trash':()=>openFinanceTrash(),
 'add-finance-category':b=>{
  const type=b.dataset.categoryType;
  const input=$(`[data-category-input="${type}"]`);
  const value=input?.value.trim();
  if(!value)return toast('Digite o nome da categoria.','error');
  const cfg=db.data.config;
  cfg.financeCategories=cfg.financeCategories||{};
  const list=financialCategories(type);
  if(list.some(x=>normalize(x)===normalize(value)))return toast('Esta categoria já existe.','error');
  cfg.financeCategories[type]=[...list,value];
  db.save();render();document.querySelector(`[data-settings-tab="categorias"]`)?.click();toast('Categoria adicionada.','success');
 },
 'delete-finance-category':b=>{
  const type=b.dataset.categoryType,name=b.dataset.categoryName;
  modal('Excluir categoria',`<div class="notice danger">Excluir <b>${escapeHtml(name)}</b>? Os lançamentos antigos continuarão com essa categoria.</div>`,close=>{
   const cfg=db.data.config;cfg.financeCategories=cfg.financeCategories||{};
   cfg.financeCategories[type]=financialCategories(type).filter(x=>x!==name);
   db.save();close();render();document.querySelector(`[data-settings-tab="categorias"]`)?.click();toast('Categoria removida.','success');
  },'Excluir categoria');
 },
 'new-revenue':()=>openRevenueModal(),

 'filter-expenses':b=>{window.financeExpenseFilter=b.dataset.filter||'all';render();},
 'pay-expense':b=>{
  const expense=db.data.despesas.find(x=>String(x.id)===String(b.dataset.id));
  if(!expense)return toast('Despesa não encontrada.','error');
  modal('Confirmar pagamento',`<div class="payment-confirmation"><h3>${escapeHtml(expense.descricao)}</h3><p>Valor: <b>${money(expense.valor)}</b></p><p>Vencimento: <b>${formatDateBR(expense.vencimento)}</b></p><div class="notice">Ao confirmar, o valor será lançado como saída e passará a reduzir o saldo real.</div></div>`,close=>{
   const paidValue=Number(expense.valor||0)+Number(expense.juros||0)+Number(expense.multa||0);
   const paidDate=today();
   expense.status='pago';
   expense.paidAt=new Date(`${paidDate}T12:00:00`).toISOString();
   expense.pagoEm=expense.paidAt;
   expense.valorPago=paidValue;
   const existingMovement=db.data.caixa.find(item=>String(item.expenseId||item.sourceId||'')===String(expense.id));
   if(existingMovement){
    Object.assign(existingMovement,{tipo:'saida',data:paidDate,descricao:expense.descricao,valor:paidValue,forma:expense.forma||'PIX',expenseId:expense.id,sourceId:expense.id});
    expense.caixaMovementId=existingMovement.id;
   }else{
    const movement={id:uid(),tipo:'saida',data:paidDate,descricao:expense.descricao,valor:paidValue,forma:expense.forma||'PIX',expenseId:expense.id,sourceId:expense.id,createdAt:new Date().toISOString()};
    db.data.caixa.push(movement);
    expense.caixaMovementId=movement.id;
   }
   db.save();close();render();toast(`Despesa paga e descontada do saldo: ${money(paidValue)}.`,'success');
  },'Confirmar pagamento');
 },
 'edit-expense':b=>{const expense=db.data.despesas.find(x=>String(x.id)===String(b.dataset.id));if(expense)openExpenseModal(expense);},

 'view-subscription-invoice':b=>{const inv=subscriptionPayments().find(x=>String(x.id)===String(b.dataset.id));if(!inv)return toast('Fatura não encontrada.');const paid=inv.status==='paid';modal(`Fatura #${String(inv.id).slice(-8).toUpperCase()}`,`<div class="invoice-detail"><div class="invoice-detail-head"><div><span>FORGEPETS · ASSINATURA</span><h2>${escapeHtml(inv.companyName||activeSubscription().companyName||'Pet shop')}</h2><p>Plano ${escapeHtml(inv.plan||activePlan())}</p></div><i class="invoice-status ${subscriptionStatusClass(inv.status)}">${subscriptionStatusLabel(inv.status)}</i></div><div class="invoice-detail-grid"><div><small>Valor</small><strong>${money(inv.amount)}</strong></div><div><small>Vencimento</small><strong>${inv.due?new Date(`${inv.due}T12:00:00`).toLocaleDateString('pt-BR'):'—'}</strong></div><div><small>Forma de pagamento</small><strong>${escapeHtml(inv.method||'Não informado')}</strong></div><div><small>Pagamento</small><strong>${inv.paidAt?new Date(inv.paidAt).toLocaleString('pt-BR'):'Aguardando'}</strong></div></div><div class="invoice-description"><span>Descrição</span><b>Assinatura mensal ForgePets · Plano ${escapeHtml(inv.plan||activePlan())}</b><small>Competência: ${inv.subscriptionCycle?new Date(`${inv.subscriptionCycle}T12:00:00`).toLocaleDateString('pt-BR',{month:'long',year:'numeric'}):'—'}</small></div>${paid?'<div class="invoice-paid-note">✓ Pagamento confirmado. Esta fatura está quitada.</div>':'<div class="invoice-pending-note">Aguardando confirmação do pagamento.</div>'}</div>`,close=>close(),'Fechar');},
 'pay-subscription-invoice':b=>{const payments=subscriptionPayments(),inv=payments.find(x=>String(x.id)===String(b.dataset.id));if(!inv)return toast('Fatura não encontrada.');modal('Confirmar pagamento',`<p>Deseja simular o pagamento da fatura de <b>${money(inv.amount)}</b> com vencimento em <b>${new Date(`${inv.due}T12:00:00`).toLocaleDateString('pt-BR')}</b>?</p><div class="notice">Na versão online, esta confirmação será recebida automaticamente pelo Asaas.</div>`,close=>{inv.status='paid';inv.paidAt=new Date().toISOString();saveSubscriptionPayments(payments);const sub=activeSubscription();localStorage.setItem('forgepets_active_subscription',JSON.stringify({...sub,status:'active',lastPaymentStatus:'paid'}));close();render();toast('Fatura marcada como paga.');},'Confirmar pagamento');},
 'new-boleto-batch':()=>{
  modal('Cadastrar nota e boletos',`<div class="form-grid">
   <div class="field full"><label>Fornecedor / empresa *</label><input id="boletoEmpresa" data-trim placeholder="Nome do fornecedor"></div>
   <div class="field"><label>Número da nota</label><input id="boletoNumeroNota" placeholder="Ex.: 8457" data-trim></div>
   <div class="field"><label>Categoria *</label><select id="boletoCategoria">${categoryOptions('boleto')}</select></div>
   <div class="field"><label>Valor total da nota *</label><input id="boletoValorNota" data-mask="money" inputmode="numeric" placeholder="R$ 0,00"></div>
   <div class="field"><label>Imposto</label><input id="boletoImposto" data-mask="money" inputmode="numeric" placeholder="R$ 0,00"></div>
   <div class="field full"><label>Como considerar o imposto?</label><div class="boleto-tax-options">
    <label><input type="radio" name="boletoTaxMode" value="additional" checked> Somar o imposto ao valor da nota</label>
    <label><input type="radio" name="boletoTaxMode" value="included"> O imposto já está incluído no valor total</label>
   </div></div>
   <div class="field"><label>Entrada paga agora</label><input id="boletoEntrada" data-mask="money" inputmode="numeric" placeholder="R$ 0,00"></div>
   <div class="field"><label>Quantidade de parcelas *</label><input id="boletoQtd" type="number" min="1" max="60" value="1"></div>
   <div class="field"><label>Primeiro vencimento *</label><input id="boletoPrimeiroVencimento" type="date" value="${daysFromNow(1)}"></div>
   <div class="field"><label>Tipo de vencimento</label><select id="boletoIntervaloModo">
    <option value="monthly">Mensal</option>
    <option value="days">A cada X dias</option>
    <option value="fixed-day">Dia fixo de cada mês</option>
   </select></div>
   <div class="field" id="boletoIntervaloDiasField" style="display:none"><label>Intervalo em dias</label><input id="boletoIntervaloDias" type="number" min="1" max="365" value="7"></div>
   <div class="field" id="boletoDiaFixoField" style="display:none"><label>Dia fixo</label><input id="boletoDiaFixo" type="number" min="1" max="31" value="10"></div>
   <div class="field full"><label>Observações</label><textarea id="boletoObs" rows="3"></textarea></div>
   <div class="field full"><div id="boletoParcelPreview" class="boleto-installment-preview"></div></div>
  </div>`,close=>{
   const empresa=$('#boletoEmpresa').value.trim();
   const numeroNota=$('#boletoNumeroNota').value.trim();
   const categoria=$('#boletoCategoria').value;
   const valorNota=parseLocaleNumber($('#boletoValorNota').value);
   const imposto=parseLocaleNumber($('#boletoImposto').value);
   const impostoIncluso=document.querySelector('input[name="boletoTaxMode"]:checked')?.value==='included';
   const entrada=parseLocaleNumber($('#boletoEntrada').value);
   const qtd=Math.max(1,Math.min(60,Number($('#boletoQtd').value||1)));
   const firstDue=$('#boletoPrimeiroVencimento').value;
   const mode=$('#boletoIntervaloModo').value;
   const intervalDays=Math.max(1,Number($('#boletoIntervaloDias').value||1));
   const fixedDay=Math.min(31,Math.max(1,Number($('#boletoDiaFixo').value||1)));
   const observacoes=$('#boletoObs').value.trim();

   if(!empresa||!categoria||valorNota<=0||!firstDue)return toast('Preencha fornecedor, categoria, valor da nota e primeiro vencimento.');

   const totalFinanceiro=boletoFinancialTotal(valorNota,imposto,impostoIncluso);
   if(entrada<0||entrada>=totalFinanceiro)return toast('A entrada deve ser menor que o total financeiro.');
   const saldoParcelado=Math.max(0,totalFinanceiro-entrada);
   const values=splitMoneyInInstallments(saldoParcelado,qtd);
   const loteId=uid();

   if(entrada>0){
    db.data.caixa.push({
     id:uid(),
     tipo:'saida',
     data:today(),
     descricao:`Entrada da nota ${numeroNota||empresa}`,
     valor:entrada,
     forma:'PIX',
     categoria,
     observacoes,
     loteId,
     createdAt:new Date().toISOString()
    });
   }

   values.forEach((valor,index)=>{
    db.data.boletos.push({
     id:uid(),
     loteId,
     empresa,
     numeroNota,
     categoria,
     valor,
     valorNota,
     imposto,
     impostoIncluso,
     entrada,
     totalFinanceiro,
     saldoParcelado,
     quantidade:qtd,
     parcela:index+1,
     vencimento:boletoDueDate(firstDue,index,mode,intervalDays,fixedDay),
     intervaloModo:mode,
     intervaloDias:intervalDays,
     diaFixo:fixedDay,
     status:'aberto',
     juros:0,
     multa:0,
     observacoes,
     createdAt:new Date().toISOString()
    });
   });

   db.save();close();render();toast(`${qtd} parcela(s) criadas. Saldo parcelado: ${money(saldoParcelado)}.`);
  },'Criar parcelas');

  const preview=$('#boletoParcelPreview');
  const modeSelect=$('#boletoIntervaloModo');
  const toggleModeFields=()=>{
   $('#boletoIntervaloDiasField').style.display=modeSelect.value==='days'?'block':'none';
   $('#boletoDiaFixoField').style.display=modeSelect.value==='fixed-day'?'block':'none';
  };
  const drawPreview=()=>{
   const valorNota=parseLocaleNumber($('#boletoValorNota').value);
   const imposto=parseLocaleNumber($('#boletoImposto').value);
   const incluso=document.querySelector('input[name="boletoTaxMode"]:checked')?.value==='included';
   const entrada=parseLocaleNumber($('#boletoEntrada').value);
   const qtd=Math.max(1,Math.min(60,Number($('#boletoQtd').value||1)));
   const firstDue=$('#boletoPrimeiroVencimento').value;
   const mode=modeSelect.value;
   const intervalDays=Math.max(1,Number($('#boletoIntervaloDias').value||1));
   const fixedDay=Math.min(31,Math.max(1,Number($('#boletoDiaFixo').value||1)));
   const total=boletoFinancialTotal(valorNota,imposto,incluso);
   const saldo=Math.max(0,total-entrada);
   const values=splitMoneyInInstallments(saldo,qtd);

   preview.innerHTML=`<div class="boleto-preview-summary">
    <div><small>Valor da nota</small><b>${money(valorNota)}</b></div>
    <div><small>Imposto</small><b>${money(imposto)}</b></div>
    <div><small>Entrada</small><b>${money(entrada)}</b></div>
    <div><small>Total financeiro</small><strong>${money(total)}</strong></div>
    <div><small>Saldo parcelado</small><strong>${money(saldo)}</strong></div>
   </div>
   <div class="boleto-preview-list">${values.map((value,index)=>{
    const due=firstDue?boletoDueDate(firstDue,index,mode,intervalDays,fixedDay):'';
    return `<span><b>${index+1}/${qtd}</b> ${money(value)} <small>${due?formatDateBR(due):'—'}</small></span>`;
   }).join('')}</div>`;
  };

  ['boletoValorNota','boletoImposto','boletoEntrada','boletoQtd','boletoPrimeiroVencimento','boletoIntervaloDias','boletoDiaFixo'].forEach(id=>$('#'+id)?.addEventListener('input',drawPreview));
  modeSelect.addEventListener('change',()=>{toggleModeFields();drawPreview();});
  document.querySelectorAll('input[name="boletoTaxMode"]').forEach(input=>input.addEventListener('change',drawPreview));
  applyInputMasks($('.modal'));
  toggleModeFields();
  drawPreview();
 },
 'edit-boleto':b=>{const x=db.data.boletos.find(v=>v.id===b.dataset.id);if(!x)return;modal('Editar boleto',`<div class="form-grid"><div class="field full"><label>Empresa</label><input id="editBoletoEmpresa" value="${escapeAttr(x.empresa)}"></div><div class="field"><label>Valor</label><input id="editBoletoValor" type="text" data-mask="money" inputmode="numeric" value="${money(x.valor||0)}"></div><div class="field"><label>Vencimento</label><input id="editBoletoData" type="date" value="${x.vencimento}"></div></div>`,close=>{const empresa=$('#editBoletoEmpresa').value.trim(),valor=parseLocaleNumber($('#editBoletoValor').value),vencimento=$('#editBoletoData').value;if(!empresa||valor<=0||!vencimento)return toast('Preencha todos os campos.');Object.assign(x,{empresa,valor,vencimento});db.save();close();toast('Boleto atualizado.');});},
 'pay-boleto':b=>{const x=db.data.boletos.find(v=>v.id===b.dataset.id);if(!x)return;const total=Number(x.valor||0)+Number(x.juros||0)+Number(x.multa||0);x.status='pago';x.pagoEm=new Date().toISOString();x.valorPago=total;if(!db.data.caixa.some(m=>String(m.sourceId||m.expenseId||'')===String(x.id)))db.data.caixa.push({id:uid(),tipo:'saida',data:today(),descricao:`Boleto: ${x.empresa}`,categoria:x.categoria||'',valor:total,forma:x.forma||'Boleto',source:'PAYABLE',sourceId:x.id,createdAt:new Date().toISOString()});db.save();toast('Boleto marcado como pago e lançado no saldo real.');},
 'delete-boleto':b=>{const x=db.data.boletos.find(v=>v.id===b.dataset.id);if(!x)return;modal('Excluir boleto',`<p>Deseja excluir o boleto de <b>${escapeHtml(x.empresa)}</b> no valor de <b>${money(x.valor)}</b>?</p>`,close=>{db.data.boletos=db.data.boletos.filter(v=>v.id!==x.id);db.save();close();toast('Boleto excluído.');},'Excluir');},
 'new-client':()=>modal('Novo tutor',`<div class="form-grid"><div class="field"><label>Nome completo *</label><input id="fNome" data-trim autocomplete="name"></div><div class="field"><label>WhatsApp</label><input id="fTel" data-mask="phone" inputmode="tel"></div><div class="field"><label>CPF/CNPJ</label><input id="fCpf" data-mask="cpfcnpj" inputmode="numeric"></div><div class="field"><label>E-mail</label><input id="fEmail" type="email"></div><div class="field"><label>CEP</label><input id="fCep" data-mask="cep" data-cep-lookup data-status-target="cepLookupStatus" inputmode="numeric" maxlength="9" placeholder="00000-000"><small id="cepLookupStatus" class="cep-lookup-status"></small></div><div class="field"><label>Endereço</label><input id="fEndereco"></div><div class="field"><label>Número</label><input id="fNumero"></div><div class="field"><label>Complemento</label><input id="fComplemento"></div><div class="field"><label>Bairro</label><input id="fBairro"></div><div class="field"><label>Cidade</label><input id="fCidade"></div><div class="field"><label>Estado</label><input id="fEstado" maxlength="2" value="RS"></div><div class="field full"><label>Observações</label><textarea id="fObs"></textarea></div></div>`,async close=>{try{const name=$('#fNome').value.trim();if(!name){setModalError('Informe o nome completo do tutor.');return;}const email=$('#fEmail').value.trim();if(email&&!isValidEmail(email)){setModalError('Informe um e-mail válido ou deixe o campo vazio.');return;}const {tutor}=await cloud.request('/api/forge/tutores',{method:'POST',body:JSON.stringify({name,phone:$('#fTel').value,document:$('#fCpf').value,email,zipCode:$('#fCep').value,address:$('#fEndereco').value,number:$('#fNumero').value,complement:$('#fComplemento').value,neighborhood:$('#fBairro').value,city:$('#fCidade').value,state:$('#fEstado').value,notes:$('#fObs').value})});db.data.clientes.push(cloud.tutor(tutor));localStorage.setItem('vetcoreShopPro',JSON.stringify(db.data));close();render();toast('Tutor cadastrado no Neon.');}catch(e){setModalError(e.message||'Não foi possível salvar o tutor.');}}),
 'edit-client':b=>{const c=db.data.clientes.find(x=>x.id===b.dataset.id);if(!c)return;modal('Editar tutor',`<div class="form-grid"><div class="field"><label>Nome completo *</label><input id="fNome" value="${escapeAttr(c.nome)}"></div><div class="field"><label>WhatsApp</label><input id="fTel" data-mask="phone" value="${escapeAttr(c.telefone)}"></div><div class="field"><label>CPF/CNPJ</label><input id="fCpf" data-mask="cpfcnpj" value="${escapeAttr(c.cpf)}"></div><div class="field"><label>E-mail</label><input id="fEmail" type="email" value="${escapeAttr(c.email)}"></div><div class="field"><label>CEP</label><input id="fCep" data-mask="cep" data-cep-lookup data-status-target="cepLookupStatus" inputmode="numeric" maxlength="9" value="${escapeAttr(c.cep)}"><small id="cepLookupStatus" class="cep-lookup-status"></small></div><div class="field"><label>Endereço</label><input id="fEndereco" value="${escapeAttr(c.endereco)}"></div><div class="field"><label>Número</label><input id="fNumero" value="${escapeAttr(c.numero)}"></div><div class="field"><label>Complemento</label><input id="fComplemento" value="${escapeAttr(c.complemento)}"></div><div class="field"><label>Bairro</label><input id="fBairro" value="${escapeAttr(c.bairro)}"></div><div class="field"><label>Cidade</label><input id="fCidade" value="${escapeAttr(c.cidade)}"></div><div class="field"><label>Estado</label><input id="fEstado" maxlength="2" value="${escapeAttr(c.estado||'RS')}"></div><div class="field full"><label>Observações</label><textarea id="fObs">${escapeHtml(c.obs||'')}</textarea></div></div>`,async close=>{try{const name=$('#fNome').value.trim();if(!name){setModalError('Informe o nome completo do tutor.');return;}const email=$('#fEmail').value.trim();if(email&&!isValidEmail(email)){setModalError('Informe um e-mail válido ou deixe o campo vazio.');return;}const {tutor}=await cloud.request(`/api/forge/tutores/${c.id}`,{method:'PUT',body:JSON.stringify({name,phone:$('#fTel').value,document:$('#fCpf').value,email,zipCode:$('#fCep').value,address:$('#fEndereco').value,number:$('#fNumero').value,complement:$('#fComplemento').value,neighborhood:$('#fBairro').value,city:$('#fCidade').value,state:$('#fEstado').value,notes:$('#fObs').value})});Object.assign(c,cloud.tutor(tutor));localStorage.setItem('vetcoreShopPro',JSON.stringify(db.data));close();render();toast('Tutor atualizado.');}catch(e){setModalError(e.message||'Não foi possível atualizar o tutor.');}});},
 'new-pet':b=>modal('Adicionar pet',`<div class="form-grid"><div class="field"><label>Nome do pet *</label><input id="pNome"></div><div class="field"><label>Espécie</label><select id="pEspecie"><option>Canino</option><option>Felino</option><option>Outro</option></select></div><div class="field"><label>Raça</label><input id="pRaca"></div><div class="field"><label>Cor</label><input id="pCor"></div><div class="field"><label>Sexo</label><select id="pSexo"><option>Macho</option><option>Fêmea</option><option>Não informado</option></select></div><div class="field"><label>Porte</label><select id="pPorte"><option value="">Não informado</option><option>Pequeno</option><option>Médio</option><option>Grande</option></select></div><div class="field"><label>Peso (kg)</label><input id="pPeso" type="text" data-mask="decimal" data-decimals="3" inputmode="decimal" placeholder="0,000"></div><div class="field"><label>Castrado</label><select id="pCastrado"><option value="">Não informado</option><option>Sim</option><option>Não</option></select></div><div class="field"><label>Nascimento</label><input id="pNasc" type="date"></div><div class="field"><label>Temperamento</label><select id="pTemperamento"><option value="">Não informado</option><option>Calmo</option><option>Agitado</option><option>Medroso</option><option>Agressivo</option></select></div><div class="field full"><label>Preferências e cuidados</label><div class="pet-care-grid"><label><input type="checkbox" id="pSecador"> Não aceita secador</label><label><input type="checkbox" id="pMaquina"> Não aceita máquina</label><label><input type="checkbox" id="pSemPerfume"> Não usar perfume</label><label><input type="checkbox" id="pSemLaco"> Não usar laço/gravatinha</label></div></div><div class="field full"><label>Observações</label><textarea id="pObs"></textarea></div></div>`,async close=>{try{const name=$('#pNome').value.trim();if(!name)return toast('Informe o nome do pet.');const carePreferences={naoAceitaSecador:$('#pSecador').checked,naoAceitaMaquina:$('#pMaquina').checked,semPerfume:$('#pSemPerfume').checked,semLaco:$('#pSemLaco').checked,servicosPreferidos:[]};const {pet}=await cloud.request('/api/forge/pets',{method:'POST',body:JSON.stringify({tutorId:b.dataset.id,name,species:$('#pEspecie').value,breed:$('#pRaca').value,color:$('#pCor').value,sex:$('#pSexo').value,size:$('#pPorte').value,weight:parseLocaleNumber($('#pPeso').value),neutered:$('#pCastrado').value==='Sim',birthDate:$('#pNasc').value,temperament:$('#pTemperamento').value,careNotes:$('#pObs').value,carePreferences})});db.data.pets.push(cloud.pet(pet));localStorage.setItem('vetcoreShopPro',JSON.stringify(db.data));close();render();toast('Pet cadastrado no Neon.');}catch(e){toast(e.message);}}),
 'quick-appointment':()=>{
  if(!db.data.pets.length)return toast('Cadastre um cliente e um pet primeiro.');
  const firstService=db.data.servicos[0];
  if(!firstService)return toast('Cadastre pelo menos um serviço primeiro.');

  let selectedItems=[{
   id:uid(),
   serviceId:firstService.id,
   quantity:1,
   unitPrice:Number(firstService.valor||0)
  }];

  modal('Novo agendamento',`<div class="form-grid">
   <div class="field full">
    <label>Localizar tutor por nome completo ou CPF</label>
    <div class="appointment-client-search"><span>⌕</span><input id="aTutorBusca" autocomplete="off" placeholder="Digite o nome completo ou CPF do tutor"></div>
    <div id="aTutorResultados" class="appointment-search-results"><small>Digite para localizar o tutor.</small></div>
    <input id="aTutorId" type="hidden">
   </div>
   <div class="field full"><label>Pet do tutor</label><select id="aPet" disabled><option value="">Selecione primeiro o tutor</option></select></div>
   <div class="field full">
    <div class="appointment-services-head"><div><label>Serviços do atendimento</label><small>Adicione banho, tosa, subpelo e outros serviços no mesmo lançamento.</small></div><button type="button" class="btn ghost" id="addAppointmentService">＋ Adicionar serviço</button></div>
    <div id="appointmentServiceItems" class="appointment-service-items"></div>
    <div class="appointment-services-total"><span>Total do atendimento</span><strong id="appointmentServicesTotal">${money(firstService.valor||0)}</strong></div>
   </div>
   <div class="field"><label>Data</label><input id="aData" type="date" value="${page==='agenda'?selectedAgendaDate():today()}"></div>
   <div class="field"><label>Horário disponível</label><select id="aHora"></select><small id="aHoraStatus" class="field-help"></small></div>
   <div class="field full"><label>Observações</label><textarea id="aObs"></textarea></div>
  </div>`,async close=>{
   try{
    const tutorId=$('#aTutorId').value,petId=$('#aPet').value;
    if(!tutorId)return setModalError('Selecione o tutor.');
    if(!petId)return setModalError('Selecione o pet.');
    if(!selectedItems.length)return setModalError('Adicione pelo menos um serviço.');
    const date=$('#aData').value,time=$('#aHora').value;
    if(!date||!time)return setModalError('Selecione uma data e um horário disponível.');

    const items=selectedItems.map(item=>({
     serviceId:item.serviceId,
     quantity:Number(item.quantity||1),
     unitPrice:Number(item.unitPrice||0)
    }));

    const {appointment}=await cloud.request('/api/forge/agenda',{
     method:'POST',
     body:JSON.stringify({
      tutorId,
      petId,
      serviceId:items[0].serviceId,
      items,
      date,
      time,
      notes:$('#aObs').value
     })
    });

    db.data.agenda.push(cloud.appointment(appointment));
    localStorage.setItem('vetcoreShopPro',JSON.stringify(db.data));
    close();render();toast('Agendamento com múltiplos serviços salvo no Neon.');
   }catch(e){
    setModalError(e.message||'Não foi possível criar o agendamento.');
   }
  });

  const input=$('#aTutorBusca'),results=$('#aTutorResultados'),petSelect=$('#aPet'),tutorId=$('#aTutorId'),dateInput=$('#aData'),timeSelect=$('#aHora'),timeStatus=$('#aHoraStatus');
  const serviceBox=$('#appointmentServiceItems'),totalLabel=$('#appointmentServicesTotal');

  const selectedDuration=()=>selectedItems.reduce((sum,item)=>{
   const service=db.data.servicos.find(s=>s.id===item.serviceId);
   return sum+Math.max(15,Number(service?.duracao||60))*Math.max(1,Number(item.quantity||1));
  },0);

  const renderTimes=()=>{
   const times=availableAgendaTimesByDuration(dateInput.value,'',selectedDuration());
   timeSelect.innerHTML=times.length?times.map(t=>`<option value="${t}">${t}</option>`).join(''):'<option value="">Nenhum horário disponível</option>';
   timeSelect.disabled=!times.length;
   const duration=selectedDuration();
   if(times.length){
    const selected=timeSelect.value||times[0];
    const [h,m]=selected.split(':').map(Number);
    const finishMinutes=h*60+m+duration;
    const finish=`${String(Math.floor(finishMinutes/60)).padStart(2,'0')}:${String(finishMinutes%60).padStart(2,'0')}`;
    timeStatus.innerHTML=`${times.length} horário(s) que comportam <b>${duration} min</b>. Selecionado: <b>${selected} → ${finish}</b>.`;
   }else{
    timeStatus.innerHTML=`Nenhum intervalo de <b>${duration} min</b> cabe livre nesta data. Escolha outra data ou ajuste os serviços.`;
   }
  };

  const renderServiceItems=()=>{
   serviceBox.innerHTML=selectedItems.map((item,index)=>{
    const service=db.data.servicos.find(s=>s.id===item.serviceId)||db.data.servicos[0];
    return `<div class="appointment-service-row" data-item-id="${item.id}">
     <div class="field"><label>Serviço ${index+1}</label><select data-service-id>${db.data.servicos.map(s=>`<option value="${s.id}" ${s.id===item.serviceId?'selected':''}>${escapeHtml(s.nome)}</option>`).join('')}</select><small>${escapeHtml(service?.categoria||'Sem categoria')} · ${Number(service?.duracao||60)} min</small></div>
     <div class="field compact"><label>Qtd.</label><input data-service-qty type="number" min="1" max="99" value="${Number(item.quantity||1)}"></div>
     <div class="field"><label>Valor unitário</label><input data-service-price data-mask="money" inputmode="numeric" value="${money(item.unitPrice||0)}"></div>
     <button type="button" class="icon-btn appointment-remove-service" data-remove-service ${selectedItems.length===1?'disabled':''}>×</button>
    </div>`;
   }).join('');

   applyInputMasks(serviceBox);

   serviceBox.querySelectorAll('.appointment-service-row').forEach(row=>{
    const item=selectedItems.find(x=>x.id===row.dataset.itemId);
    row.querySelector('[data-service-id]').addEventListener('change',e=>{
     item.serviceId=e.target.value;
     const service=db.data.servicos.find(s=>s.id===item.serviceId);
     item.unitPrice=Number(service?.valor||0);
     renderServiceItems();renderTimes();
    });
    row.querySelector('[data-service-qty]').addEventListener('input',e=>{
     item.quantity=Math.max(1,Number(e.target.value||1));
     updateTotal();renderTimes();
    });
    row.querySelector('[data-service-price]').addEventListener('input',e=>{
     item.unitPrice=parseLocaleNumber(e.target.value);
     updateTotal();
    });
    row.querySelector('[data-remove-service]')?.addEventListener('click',()=>{
     if(selectedItems.length===1)return;
     selectedItems=selectedItems.filter(x=>x.id!==item.id);
     renderServiceItems();renderTimes();
    });
   });
   updateTotal();
  };

  const updateTotal=()=>{
   const total=selectedItems.reduce((sum,item)=>sum+Number(item.unitPrice||0)*Number(item.quantity||1),0);
   totalLabel.textContent=money(total);
  };

  $('#addAppointmentService').addEventListener('click',()=>{
   const available=db.data.servicos.find(service=>!selectedItems.some(item=>item.serviceId===service.id))||db.data.servicos[0];
   selectedItems.push({id:uid(),serviceId:available.id,quantity:1,unitPrice:Number(available.valor||0)});
   renderServiceItems();renderTimes();
  });

  dateInput.addEventListener('change',renderTimes);
  petSelect.addEventListener('change',renderTimes);
  timeSelect.addEventListener('change',renderTimes);
  renderServiceItems();renderTimes();

  const renderTutorResults=()=>{
   const term=normalize(input.value),digits=String(input.value||'').replace(/\D/g,'');
   if(term.length<2&&digits.length<3){
    results.innerHTML='<small>Digite pelo menos 2 letras do nome ou 3 números do CPF.</small>';return;
   }
   const matches=sortAlpha(db.data.clientes,'nome').filter(c=>normalize(c.nome).includes(term)||(digits&&String(c.cpf||'').replace(/\D/g,'').includes(digits))).slice(0,8);
   results.innerHTML=matches.length?matches.map(c=>`<button type="button" class="appointment-client-option" data-tutor-id="${c.id}"><strong>${c.nome}</strong><small>CPF: ${c.cpf||'Não informado'} · ${c.telefone||'Sem telefone'}</small></button>`).join(''):'<div class="appointment-no-result">Nenhum tutor encontrado.</div>';
  };

  input.addEventListener('input',()=>{
   tutorId.value='';petSelect.disabled=true;petSelect.innerHTML='<option value="">Selecione primeiro o tutor</option>';renderTutorResults();
  });

  results.addEventListener('click',e=>{
   const btn=e.target.closest('[data-tutor-id]');if(!btn)return;
   const c=db.data.clientes.find(x=>x.id===btn.dataset.tutorId);if(!c)return;
   tutorId.value=c.id;input.value=`${c.nome}${c.cpf?` · ${c.cpf}`:''}`;
   const pets=sortAlpha(db.data.pets.filter(p=>p.clienteId===c.id),'nome');
   petSelect.innerHTML=pets.map(p=>`<option value="${p.id}">${p.nome}${p.raca?` · ${p.raca}`:''}</option>`).join('');
   petSelect.disabled=!pets.length;
   results.innerHTML=`<div class="appointment-selected-client"><span>✓ Tutor selecionado</span><strong>${c.nome}</strong>${pets.length?'':`<small>Este tutor não possui pet cadastrado.</small>`}</div>`;
   renderTimes();
  });
 },
 'new-service':()=>modal('Novo serviço',`<div class="form-grid"><div class="field"><label>Nome</label><input id="sNome"></div><div class="field"><label>Valor</label><input id="sValor" type="text" data-mask="money" inputmode="numeric" placeholder="R$ 0,00"></div><div class="field"><label>Duração na agenda</label><select id="sDuracao"><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60" selected>1 hora</option><option value="90">1h30</option><option value="120">2 horas</option></select></div></div>`,async close=>{try{const name=$('#sNome').value.trim();if(!name)return setModalError('Informe o serviço.');const {service}=await cloud.request('/api/forge/servicos',{method:'POST',body:JSON.stringify({name,price:parseLocaleNumber($('#sValor').value),durationMinutes:Number($('#sDuracao').value||60)})});db.data.servicos.push(cloud.service(service));localStorage.setItem('vetcoreShopPro',JSON.stringify(db.data));close();render();toast('Serviço cadastrado no Neon.');}catch(e){setModalError(e.message||'Não foi possível salvar o serviço.');}}),
 'edit-service':b=>{const s=db.data.servicos.find(x=>x.id===b.dataset.id);if(!s)return toast('Serviço não encontrado.');modal('Editar serviço',`<div class="form-grid"><div class="field full"><label>Nome</label><input id="editSNome" value="${escapeAttr(s.nome)}"></div><div class="field"><label>Valor</label><input id="editSValor" type="text" data-mask="money" inputmode="numeric" value="${money(s.valor||0)}"></div><div class="field"><label>Duração na agenda</label><select id="editSDuracao">${[15,30,45,60,90,120,180].map(v=>`<option value="${v}" ${Number(s.duracao||60)===v?'selected':''}>${v<60?`${v} minutos`:v===60?'1 hora':`${Math.floor(v/60)}h${v%60?String(v%60).padStart(2,'0'):''}`}</option>`).join('')}</select></div></div>`,async close=>{try{const name=$('#editSNome').value.trim(),price=parseLocaleNumber($('#editSValor').value),durationMinutes=Number($('#editSDuracao').value||60);if(!name)return setModalError('Informe o nome do serviço.');if(!Number.isFinite(price)||price<0)return setModalError('Informe um valor válido.');const {service}=await cloud.request(`/api/forge/servicos/${s.id}`,{method:'PUT',body:JSON.stringify({name,price,durationMinutes})});Object.assign(s,cloud.service(service));localStorage.setItem('vetcoreShopPro',JSON.stringify(db.data));close();render();toast('Serviço atualizado.');}catch(e){setModalError(e.message||'Não foi possível atualizar o serviço.');}},'Salvar alterações');},

 'quick-movement':b=>modal('Nova movimentação',`<div class="form-grid"><div class="field"><label>Tipo</label><select id="cTipo"><option value="entrada" ${b?.dataset?.preset==='entrada'?'selected':''}>Entrada</option><option value="saida" ${b?.dataset?.preset==='saida'?'selected':''}>Saída</option></select></div><div class="field"><label>Data</label><input id="cData" type="date" value="${today()}"></div><div class="field full"><label>Descrição</label><input id="cDesc"></div><div class="field"><label>Valor</label><input id="cValor" type="text" data-mask="money" inputmode="numeric" placeholder="R$ 0,00"></div><div class="field"><label>Forma de pagamento</label><select id="cForma"><option>PIX</option><option>Dinheiro</option><option>Cartão de débito</option><option>Cartão de crédito</option></select></div></div>`,close=>{if(!$('#cDesc').value||!$('#cValor').value)return toast('Preencha descrição e valor.');db.data.caixa.push({id:uid(),tipo:$('#cTipo').value,data:$('#cData').value,descricao:$('#cDesc').value,valor:parseLocaleNumber($('#cValor').value),forma:$('#cForma').value});db.save();close();toast('Movimentação salva.');}),
 'new-stock':()=>modal('Novo produto',`<div class="form-grid"><div class="field full"><label>Nome do produto *</label><input id="eNome" data-trim autocomplete="off" placeholder="Ex.: Shampoo neutro 500 ml"></div><div class="field"><label>EAN / Código de barras</label><input id="eEan" data-mask="ean" inputmode="numeric" maxlength="14" autocomplete="off" placeholder="8, 12, 13 ou 14 dígitos"></div><div class="field"><label>Marca</label><input id="eMarca" data-trim placeholder="Ex.: Pet Society"></div><div class="field"><label>Categoria</label><input id="eCategoria" data-trim placeholder="Ex.: Higiene"></div><div class="field"><label>Unidade</label><select id="eUnidade"><option>unidade</option><option>kg</option><option>litro</option><option>caixa</option><option>pacote</option></select></div><div class="field"><label>Quantidade</label><input id="eQtd" type="number" min="0" step="1" inputmode="numeric" value="0"></div><div class="field"><label>Estoque mínimo</label><input id="eMin" type="number" min="0" step="1" inputmode="numeric" value="${Number(db.data.config.estoqueMinimoPadrao??3)}"></div><div class="field"><label>Custo unitário</label><input id="eCusto" type="text" data-mask="money" inputmode="numeric" placeholder="R$ 0,00"></div><div class="field full"><label>Preço de venda</label><input id="eVenda" type="text" data-mask="money" inputmode="numeric" placeholder="R$ 0,00"></div></div>`,close=>{const nome=$('#eNome').value.trim(),ean=onlyDigits($('#eEan').value);if(!nome)return toast('Informe o produto.');if(!validEan(ean))return toast('O EAN deve possuir 8, 12, 13 ou 14 dígitos.');if(ean&&db.data.estoque.some(p=>onlyDigits(p.ean)===ean))return toast('Já existe um produto cadastrado com este EAN.');const product={id:uid(),nome,ean,marca:$('#eMarca').value.trim(),categoria:$('#eCategoria').value.trim(),unidade:$('#eUnidade').value,qtd:Number($('#eQtd').value||0),min:Number($('#eMin').value||0),custo:parseLocaleNumber($('#eCusto').value),valorVenda:parseLocaleNumber($('#eVenda').value),createdAt:new Date().toISOString()};db.data.estoque.push(product);if(product.qtd>0)saveStockMovement(product,'entrada',product.qtd,{data:today(),custoUnitario:product.custo,motivo:'Estoque inicial'});db.save();close();toast('Produto cadastrado.');}),
 'finish-appointment':async b=>{
  const a=db.data.agenda.find(x=>x.id===b.dataset.id);
  if(!a)return;
  if(a.status==='Concluído')return toast('Este atendimento já foi finalizado.');
  try{
   const {appointment}=await cloud.request(`/api/forge/agenda/${a.id}`,{method:'PUT',body:JSON.stringify({status:'Concluído'})});
   Object.assign(a,cloud.appointment(appointment));
   const pet=db.data.pets.find(p=>p.id===a.petId),cliente=db.data.clientes.find(c=>c.id===pet?.clienteId);
   const itens=appointmentItems(a);
   const valor=appointmentTotal(a);
   if(!db.data.pendencias.some(x=>x.agendaId===a.id)){
    db.data.pendencias.push({
     id:uid(),
     agendaId:a.id,
     data:today(),
     pet:pet?.nome||'Pet',
     tutor:cliente?.nome||'Tutor',
     clienteId:cliente?.id||'',
     servico:appointmentServiceNames(a),
     itens:itens.map(item=>({...item})),
     valor,
     status:'aberto'
    });
   }
   db.save();render();toast(`Atendimento concluído. ${itens.length} serviço(s), total ${money(valor)}, ficaram em aberto no Caixa.`);
  }catch(e){toast(e.message||'Não foi possível concluir o atendimento.');}
 },
 'cancel-appointment':async b=>{const a=db.data.agenda.find(x=>x.id===b.dataset.id);if(!a)return;modal('Cancelar agendamento',`<p>Deseja cancelar este agendamento?</p><div class="notice">O horário será liberado para um novo atendimento.</div>`,async close=>{try{const {appointment}=await cloud.request(`/api/forge/agenda/${a.id}`,{method:'DELETE'});Object.assign(a,cloud.appointment(appointment));db.save();close();render();toast('Agendamento cancelado e horário liberado.');}catch(e){setModalError(e.message||'Não foi possível cancelar.');}},'Cancelar');},
 'delete-client':b=>{const c=db.data.clientes.find(x=>x.id===b.dataset.id);if(!c)return;modal('Excluir tutor',`<p>Deseja realmente excluir <b>${escapeHtml(c.nome)}</b> e todos os pets vinculados?</p><div class="notice">Esta ação não poderá ser desfeita.</div>`,async close=>{try{await cloud.request(`/api/forge/tutores/${c.id}`,{method:'DELETE'});db.data.clientes=db.data.clientes.filter(x=>x.id!==c.id);db.data.pets=db.data.pets.filter(x=>x.clienteId!==c.id);localStorage.setItem('vetcoreShopPro',JSON.stringify(db.data));close();render();toast('Tutor excluído.');}catch(e){toast(e.message);}},'Excluir');},
 'delete-row':b=>{const map={service:'servicos',cash:'caixa',stock:'estoque'};db.data[map[b.dataset.type]]=db.data[map[b.dataset.type]].filter(x=>x.id!==b.dataset.id);db.save();toast('Registro excluído.');},
 'save-config':()=>{const c=db.data.config;Object.assign(c,{empresa:$('#cfgEmpresa')?.value||c.empresa,razaoSocial:$('#cfgRazao')?.value||'',cnpjCpf:$('#cfgDocumento')?.value||'',telefone:$('#cfgTelefone')?.value||'',whatsapp:$('#cfgWhatsapp')?.value||'',email:$('#cfgEmail')?.value||'',site:$('#cfgSite')?.value||'',cep:$('#cfgCep')?.value||'',endereco:$('#cfgEndereco')?.value||'',numero:$('#cfgNumero')?.value||'',complemento:$('#cfgComplemento')?.value||'',bairro:$('#cfgBairro')?.value||'',cidade:$('#cfgCidade')?.value||'',estado:$('#cfgEstado')?.value||'RS',corPrincipal:$('#cfgCorPrincipal')?.value||c.corPrincipal,corDestaque:$('#cfgCorDestaque')?.value||c.corDestaque,tema:$('#cfgTema')?.value||'claro',inicioAgenda:$('#cfgInicioAgenda')?.value||'08:00',fimAgenda:$('#cfgFimAgenda')?.value||'18:00',intervaloAgenda:Number($('#cfgIntervalo')?.value||30),statusInicial:$('#cfgStatusInicial')?.value||'Agendado',diasFuncionamento:[...document.querySelectorAll('[name=cfgDia]:checked')].map(x=>x.value),impressora:$('#cfgImpressora')?.value||'80',pagamentoPadrao:$('#cfgPagamentoPadrao')?.value||'PIX',rodapeCupom:$('#cfgRodapeCupom')?.value||'',imprimirAutomatico:!!$('#cfgImprimirAuto')?.checked,estoqueMinimoPadrao:Number($('#cfgEstoqueMin')?.value||0),unidadeEstoque:$('#cfgUnidadeEstoque')?.value||'unidade',baixaEstoqueAutomatica:!!$('#cfgBaixaEstoque')?.checked,pontosPorReal:Number($('#cfgPontos')?.value||0),percentualCashback:Number($('#cfgCashback')?.value||0),validadePontos:Number($('#cfgValidadePontos')?.value||0),usarFidelidade:!!$('#cfgUsarFidelidade')?.checked,alertaEstoque:!!$('#cfgAlertaEstoque')?.checked,alertaAniversario:!!$('#cfgAlertaAniversario')?.checked,alertaAgenda:!!$('#cfgAlertaAgenda')?.checked});db.save();toast('Configurações salvas e aplicadas.');},
 'show-plans':()=>{const active=activePlan();modal('Planos ForgePets',`<p style="margin-top:0;color:var(--muted)">Clique no plano desejado para solicitar a alteração.</p><div class="modal-plan-grid">${Object.entries(PLAN_CATALOG).map(([name,p])=>`<button type="button" class="modal-plan ${name===active?'current':''}" data-action="request-plan" data-plan="${name}" ${name===active?'disabled':''}><b>${name}${name===active?' · Atual':''}</b><strong>${money(p.price)}<small>/mês</small></strong><span>${name==='Essencial'?'Gestão completa sem fidelidade':name==='Profissional'?'Pontos e cashback':'Fidelidade completa e automações'}</span></button>`).join('')}</div><div class="plan-rule-note">O upgrade é liberado imediatamente. Após o upgrade, a redução para um plano inferior ficará disponível somente após <b>3 meses</b>.</div>`,close=>close(),'Fechar');},
 'request-plan':b=>{
  const newPlan=b.dataset.plan,current=activePlan(),presetModule=b.dataset.module||'';if(!PLAN_CATALOG[newPlan]||(newPlan===current&&!presetModule))return;
  const OPTIONAL_MODULES={FISCAL:{label:'Módulo Fiscal',price:49,description:'Emissão de NFS-e de serviços, XML, PDF e histórico fiscal.'}};
  const planValue=PLAN_CATALOG[newPlan].price;
  const initialTotal=planValue+(presetModule==='FISCAL'?OPTIONAL_MODULES.FISCAL.price:0);
  const sub=activeSubscription(),isDowngrade=PLAN_CATALOG[newPlan].level<PLAN_CATALOG[current].level,lockUntil=sub.planLockUntil?new Date(sub.planLockUntil):null;
  if(isDowngrade&&lockUntil&&lockUntil>new Date())return toast(`A redução do plano estará disponível após ${lockUntil.toLocaleDateString('pt-BR')}.`);
  document.querySelector('#modalRoot').innerHTML='';
  const cfg=db.data.config||{};
  modal('Pagamento da assinatura',`<div class="checkout-shell"><div class="checkout-summary"><span>PLANO ESCOLHIDO</span><h2>${newPlan}</h2><strong>${money(initialTotal)}<small>/mês</small></strong><p>Seu novo plano será ativado conforme a confirmação do pagamento pelo Asaas.</p><ul><li>✓ Ativação após confirmação do pagamento</li><li>✓ Cobrança recorrente mensal automática</li><li>✓ Após um upgrade, o plano poderá ser reduzido somente após 3 meses</li><li>✓ Alteração registrada no Painel Master</li></ul></div><div class="checkout-form"><div class="form-grid"><div class="field"><label>Responsável</label><input id="payName" value="${escapeAttr(cfg.nomeUsuario||'')}" data-trim></div><div class="field"><label>Pet shop</label><input id="payCompany" value="${escapeAttr(cfg.empresa||'Meu Pet Shop')}" data-trim></div><div class="field"><label>CPF/CNPJ</label><input id="payDocument" value="${escapeAttr(cfg.cnpjCpf||'')}" data-mask="cpfcnpj" placeholder="000.000.000-00"></div><div class="field"><label>E-mail</label><input id="payEmail" type="email" value="${escapeAttr(cfg.email||cfg.emailUsuario||'')}" placeholder="financeiro@petshop.com"></div><div class="field"><label>Telefone</label><input id="payPhone" data-mask="phone" value="${escapeAttr(cfg.telefone||cfg.whatsapp||'')}" placeholder="(51) 99999-9999"></div><div class="field"><label>CEP do titular</label><input id="payPostalCode" data-mask="cep" value="${escapeAttr(cfg.cep||'')}" placeholder="00000-000"></div><div class="field"><label>Número do endereço</label><input id="payAddressNumber" value="${escapeAttr(cfg.numero||'')}" data-trim></div><div class="field full"><label>Forma de pagamento</label><div class="payment-methods"><label class="payment-option selected"><input type="radio" name="subscriptionMethod" value="card" checked><b>Cartão de crédito</b><small>Cobrança recorrente automática todos os meses.</small></label><label class="payment-option"><input type="radio" name="subscriptionMethod" value="pix"><b>PIX</b><small>Pagamento mensal por cobrança PIX.</small></label><label class="payment-option"><input type="radio" name="subscriptionMethod" value="boleto"><b>Boleto bancário</b><small>Boleto emitido automaticamente a cada vencimento.</small></label></div></div><div id="cardFields" class="card-fields full"><div class="field full"><label>Número do cartão</label><input id="payCard" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" maxlength="19"></div><div class="field"><label>Validade</label><input id="payExpiry" autocomplete="cc-exp" placeholder="MM/AA" maxlength="5"></div><div class="field"><label>CVV</label><input id="payCvv" inputmode="numeric" autocomplete="cc-csc" placeholder="000" maxlength="4"></div><div class="field full"><label>Nome impresso no cartão</label><input id="payCardName" autocomplete="cc-name" data-trim></div></div><div class="checkout-modules full"><div class="checkout-section-title"><div><b>Módulos adicionais</b><small>Ative somente os recursos que sua empresa precisa.</small></div></div><label class="checkout-module-option"><input id="moduleFiscal" type="checkbox" value="FISCAL" ${presetModule==='FISCAL'?'checked':''}><span class="checkout-module-icon">🧾</span><span class="checkout-module-copy"><b>Módulo Fiscal</b><small>Emissão de NFS-e de serviços, XML, PDF e histórico fiscal.</small></span><strong>+ ${money(49)}<small>/mês</small></strong></label></div><div class="checkout-total-card full"><div><span>Plano ${newPlan}</span><b id="checkoutPlanValue">${money(planValue)}</b></div><div id="checkoutModuleLine" style="display:none"><span>Módulo Fiscal</span><b>+ ${money(49)}</b></div><div class="checkout-total-line"><span>Total mensal</span><strong id="checkoutTotalValue">${money(initialTotal)}</strong></div></div><div class="contract-checkout-call full"><div><b>Contrato e cobrança recorrente</b><small>Antes de gerar a cobrança, será necessário ler e aceitar o contrato eletrônico.</small></div><span id="contractTotalValue">${money(initialTotal)}/mês</span></div><input id="contractAccepted" type="hidden" value="0"><div class="plan-rule-note full"><b>Importante:</b> após um upgrade, a redução para um plano inferior ficará disponível somente após 3 meses.</div><div class="checkout-security full">🔒 Seus dados são protegidos e processados com segurança pelo Asaas. O ForgePets não armazena o número, a validade nem o CVV do cartão.</div></div></div></div>`,async close=>{
    const name=$('#payName')?.value.trim(),companyName=$('#payCompany')?.value.trim(),doc=onlyDigits($('#payDocument')?.value),email=$('#payEmail')?.value.trim(),phone=onlyDigits($('#payPhone')?.value),postalCode=onlyDigits($('#payPostalCode')?.value),addressNumber=$('#payAddressNumber')?.value.trim(),method=document.querySelector('input[name="subscriptionMethod"]:checked')?.value||'card';
    const modules=$('#moduleFiscal')?.checked?['FISCAL']:[],checkoutTotal=PLAN_CATALOG[newPlan].price+modules.reduce((sum,code)=>sum+(OPTIONAL_MODULES[code]?.price||0),0);
    if(!name||!companyName||![11,14].includes(doc.length)||!email)return setModalError('Preencha responsável, pet shop, CPF/CNPJ e e-mail.');
    if($('#contractAccepted')?.value!=='1'){openContractAcceptance(()=>$('#modalSave')?.click());return;}
    let creditCard;
    if(method==='card'){
      const expiry=String($('#payExpiry')?.value||'').split('/'),number=onlyDigits($('#payCard')?.value),ccv=onlyDigits($('#payCvv')?.value),holderName=$('#payCardName')?.value.trim();
      if(!number||expiry.length!==2||!ccv||!holderName||!phone||postalCode.length!==8||!addressNumber)return setModalError('Para pagamento com cartão, preencha telefone, CEP, número do endereço e todos os dados do cartão.');
      const year=expiry[1].length===2?`20${expiry[1]}`:expiry[1];creditCard={number,expiryMonth:expiry[0],expiryYear:year,ccv,holderName};
    }
    try{
      const result=await cloud.request('/api/forge/subscription',{method:'POST',body:JSON.stringify({plan:newPlan,name,companyName,document:doc,email,phone,postalCode,addressNumber,method,creditCard,modules,contractAccepted:true,contractVersion:FORGEPETS_CONTRACT_VERSION})});
      const now=new Date(),next=result.nextDueDate||dateOnly(now),updated={...sub,companyName,pendingPlan:newPlan,price:checkoutTotal,modules,status:result.status||'pending',paymentMethod:method,nextChargeAt:next,lastPaymentStatus:result.status==='active'?'paid':'pending',planLockUntil:result.downgradeLockedUntil,planChangedAt:now.toISOString(),asaasSubscriptionId:result.subscriptionId,billingCustomer:{name,document:doc,email}};
      localStorage.setItem('forgepets_active_subscription',JSON.stringify(updated));
      close();renderNav();render();
      const copyValue=async(value,inputId)=>{try{await navigator.clipboard.writeText(value);toast('Código copiado.');}catch{const el=$(inputId);el?.select();document.execCommand('copy');toast('Código copiado.');}};
      const startStatusWatch=()=>{let checks=0;const timer=setInterval(async()=>{checks++;try{const status=await cloud.request('/api/forge/subscription?status=1');const box=$('#livePaymentStatus');if(status.active){clearInterval(timer);if(box){box.classList.remove('waiting');box.classList.add('confirmed');box.innerHTML='<span class="payment-status-icon">✓</span><div><b>Pagamento confirmado</b><small>Seu plano foi ativado automaticamente.</small></div>';}const current=activeSubscription();localStorage.setItem('forgepets_active_subscription',JSON.stringify({...current,status:'active',plan:newPlan,pendingPlan:null,lastPaymentStatus:'paid',modules:Array.isArray(status.modules)?status.modules:current.modules||[],activeModules:Array.isArray(status.activeModules)?status.activeModules:current.activeModules||[]}));document.querySelector('#trialAccessOverlay')?.remove();renderNav();render();}else if(box){box.classList.add('waiting');box.innerHTML='<span class="payment-status-icon">⌛</span><div><b>Aguardando pagamento</b><small>Verificação automática em andamento.</small></div>';}}catch{}if(checks>=120)clearInterval(timer)},3000);};
      const preparePaymentModal=()=>{const root=$('#modalRoot');root?.querySelector('.modal')?.classList.add('payment-modal-shell');const cancel=root?.querySelector('.modal-footer [data-close]');if(cancel)cancel.remove();const close=root?.querySelector('#modalSave');if(close)close.textContent='Fechar';};
      const openPixModal=pixData=>{const qrSrc=`data:image/png;base64,${pixData.encodedImage}`,expiry=pixData.expirationDate?new Date(pixData.expirationDate).toLocaleString('pt-BR'):'';modal('Pagamento por PIX',`<div class="payment-experience pix-payment-modal"><header class="payment-hero"><span class="payment-hero-icon">✓</span><div><h2>Assinatura criada</h2><p>Escaneie o QR Code ou use o PIX Copia e Cola.</p></div></header><div class="pix-payment-layout"><section class="pix-qr-card"><div class="pix-qr-frame"><img src="${escapeAttr(qrSrc)}" alt="QR Code PIX"></div><div class="payment-value"><small>Valor da assinatura</small><strong>${money(result?.totalValue||checkoutTotal)}</strong></div>${expiry?`<div class="payment-expiry"><small>Validade</small><b>${escapeHtml(expiry)}</b></div>`:''}</section><section class="pix-copy-card"><div><span class="payment-step">2</span><h3>PIX Copia e Cola</h3><p>Copie o código abaixo e cole no aplicativo do seu banco.</p></div><div class="payment-code-box"><textarea id="pixCopyPayload" readonly>${escapeHtml(pixData.payload)}</textarea><button type="button" class="btn primary copy-payment-code" id="copyPixPayload">📋 Copiar código PIX</button></div><div id="livePaymentStatus" class="payment-status waiting"><span class="payment-status-icon">⌛</span><div><b>Aguardando pagamento</b><small>Verificação automática em andamento.</small></div></div><div class="payment-security">🔒 Pagamento processado com segurança pelo Asaas.</div></section></div></div>`,closePix=>closePix(),'Fechar');setTimeout(()=>{preparePaymentModal();$('#copyPixPayload')?.addEventListener('click',()=>copyValue(pixData.payload,'#pixCopyPayload'));startStatusWatch();},0);};
      const openBoletoModal=boleto=>{const url=boleto.bankSlipUrl||boleto.invoiceUrl||'#',line=boleto.identificationField||'';modal('Pagamento por boleto',`<div class="payment-experience boleto-payment-modal"><header class="payment-hero"><span class="payment-hero-icon">✓</span><div><h2>Boleto gerado</h2><p>A cobrança também será enviada para o e-mail cadastrado.</p></div></header><div class="payment-summary-grid"><div><small>Plano</small><strong>${escapeHtml(newPlan)}</strong></div><div><small>Valor</small><strong>${money(boleto.value||result?.totalValue||checkoutTotal)}</strong></div><div><small>Vencimento</small><strong>${boleto.dueDate?new Date(`${boleto.dueDate}T12:00:00`).toLocaleDateString('pt-BR'):'—'}</strong></div></div>${line?`<section class="pix-copy-card boleto-code-card"><div><span class="payment-step">1</span><h3>Linha digitável</h3><p>Copie para pagar pelo aplicativo do seu banco.</p></div><div class="payment-code-box"><textarea id="boletoLine" readonly>${escapeHtml(line)}</textarea><button type="button" class="btn secondary copy-payment-code" id="copyBoletoLine">📋 Copiar linha digitável</button></div></section>`:''}<div class="boleto-primary-action"><a class="btn primary" href="${escapeAttr(url)}" target="_blank" rel="noopener">Abrir boleto</a></div><div id="livePaymentStatus" class="payment-status waiting"><span class="payment-status-icon">⌛</span><div><b>Aguardando pagamento</b><small>O plano será ativado após a confirmação bancária.</small></div></div><div class="payment-security">🔒 Cobrança emitida e protegida pelo Asaas.</div></div>`,closeBill=>closeBill(),'Fechar');setTimeout(()=>{preparePaymentModal();$('#copyBoletoLine')?.addEventListener('click',()=>copyValue(line,'#boletoLine'));startStatusWatch();},0);};
      const openCardModal=()=>{modal('Pagamento com cartão',`<div class="payment-experience card-payment-modal"><header class="payment-hero"><span class="payment-hero-icon">✓</span><div><h2>Dados enviados com segurança</h2><p>Estamos confirmando a assinatura com o Asaas.</p></div></header><div class="payment-summary-grid"><div><small>Plano</small><strong>${escapeHtml(newPlan)}</strong></div><div><small>Mensalidade</small><strong>${money(result?.totalValue||checkoutTotal)}</strong></div><div><small>Próxima cobrança</small><strong>${next?new Date(`${next}T12:00:00`).toLocaleDateString('pt-BR'):'—'}</strong></div><div><small>Forma</small><strong>Cartão de crédito</strong></div></div><div id="livePaymentStatus" class="payment-status waiting"><span class="payment-status-icon">⌛</span><div><b>Confirmando assinatura</b><small>A ativação acontece automaticamente.</small></div></div><div class="payment-security">🔒 Seus dados são processados diretamente pelo Asaas.</div></div>`,closeCard=>closeCard(),'Fechar');setTimeout(()=>{preparePaymentModal();startStatusWatch();},0);};
      if(method==='pix') setTimeout(async()=>{if(result.pix?.encodedImage&&result.pix?.payload)return openPixModal(result.pix);modal('Gerando PIX',`<div class="pix-generating"><span class="pix-loader"></span><b>Preparando seu QR Code…</b><small>A assinatura já foi criada. Aguarde alguns segundos.</small></div>`,closeWait=>closeWait(),'Fechar');for(let attempt=0;attempt<10;attempt++){await new Promise(resolve=>setTimeout(resolve,1200));try{const check=await cloud.request('/api/forge/subscription?pix=1');if(check.ready&&check.pix?.encodedImage){document.querySelector('#modalRoot').innerHTML='';return setTimeout(()=>openPixModal(check.pix),60);}}catch{}}setModalError('A assinatura foi criada, mas o QR Code ainda não ficou disponível. Abra novamente a área do plano em alguns instantes.');},80);
      else if(method==='boleto') setTimeout(async()=>{if(result.boleto)return openBoletoModal(result.boleto);modal('Gerando boleto',`<div class="pix-generating"><span class="pix-loader"></span><b>Preparando seu boleto…</b><small>A assinatura já foi criada. Aguarde alguns segundos.</small></div>`,closeWait=>closeWait(),'Fechar');for(let attempt=0;attempt<10;attempt++){await new Promise(resolve=>setTimeout(resolve,1200));try{const check=await cloud.request('/api/forge/subscription?payment=1');if(check.ready&&check.payment){document.querySelector('#modalRoot').innerHTML='';return setTimeout(()=>openBoletoModal(check.payment),60);}}catch{}}setModalError('A assinatura foi criada, mas o boleto ainda não ficou disponível. Tente novamente em alguns instantes.');},80);
      else openCardModal();
    }catch(error){setModalError(error.message||'Não foi possível criar a assinatura.');}
  },'Confirmar assinatura');
  setTimeout(()=>{document.querySelectorAll('input[name="subscriptionMethod"]').forEach(input=>input.addEventListener('change',()=>{document.querySelectorAll('.payment-option').forEach(x=>x.classList.toggle('selected',x.querySelector('input').checked));const selected=document.querySelector('input[name="subscriptionMethod"]:checked')?.value;$('#cardFields').style.display=selected==='card'?'grid':'none';}));const fiscal=$('#moduleFiscal');const updateCheckoutTotal=()=>{const total=PLAN_CATALOG[newPlan].price+(fiscal?.checked?OPTIONAL_MODULES.FISCAL.price:0);if($('#checkoutModuleLine'))$('#checkoutModuleLine').style.display=fiscal?.checked?'flex':'none';if($('#checkoutTotalValue'))$('#checkoutTotalValue').textContent=money(total);if($('#contractTotalValue'))$('#contractTotalValue').textContent=`${money(total)}/mês`;fiscal?.closest('.checkout-module-option')?.classList.toggle('selected',!!fiscal.checked);};fiscal?.addEventListener('change',updateCheckoutTotal);updateCheckoutTotal();},0);
 },
  'go-fiscal-config':()=>go('fiscal'),
 'go-fiscal':()=>go('fiscal'),
 'go-marketplace':()=>go('marketplace'),
 'request-module':async b=>{try{const result=await cloud.request('/api/forge/modules',{method:'POST',body:JSON.stringify({module:b.dataset.module})});toast(result.message||'Solicitação registrada.','success');}catch(error){toast(error.message||'Não foi possível solicitar o módulo.','error');}},
 'receive-service':b=>{const item=db.data.pendencias.find(x=>x.id===b.dataset.id);if(item)openReceivePaymentModal(item);},
 'loyalty-settings':()=>go('config'),
 'go-config':()=>go('config'),
 'remove-company-logo':()=>{db.data.config.logo='';db.save();toast('Logo removida.');},
 'reset-system':()=>modal('Limpar todos os dados','<p>Esta ação apagará todos os cadastros deste navegador.</p>',()=>db.reset(),'Apagar tudo'),

 'go-agenda':()=>go('agenda'),
 'go-clientes':()=>go('clientes'),
 'go-pets':()=>go('pets'),
 'go-atendimentos':b=>{go('atendimentos');if(b?.dataset?.status)setTimeout(()=>actions['filter-status']({dataset:{status:b.dataset.status}}),0);},
 'go-estoque':()=>go('estoque'),
 'go-financeiro':()=>go('financeiro'),
 'go-boletos':()=>{document.querySelector('#modalRoot').innerHTML='';go('boletos');},
 'go-caixa':()=>go('caixa'),
 'filter-service':b=>{go('agenda');setTimeout(()=>{const term=b.dataset.filter;const rows=db.data.agenda.filter(a=>(db.data.servicos.find(s=>s.id===a.servicoId)?.nome||'').toLowerCase().includes(term));$('#content').innerHTML=`<div class="card"><div class="section-title"><h2>Agendamentos de ${term}</h2><button class="btn primary" data-action="quick-appointment">Novo agendamento</button></div>${agendaList(rows)}</div>`;},0);},
 'filter-status':button=>{
  window.forgeAttendanceFilters={...attendanceFilterState(),status:button.dataset.status||'todos'};
  render();
 },
 'apply-agenda-date':()=>{
  const value=$('#agendaDatePicker')?.value||today();
  window.forgeAgendaSelectedDate=value;
  render();
 },
 'agenda-today':()=>{
  window.forgeAgendaSelectedDate=today();
  render();
 },
 'apply-attendance-filter':()=>{
  const from=$('#attendanceFrom')?.value||'';
  const to=$('#attendanceTo')?.value||'';
  const search=$('#attendanceSearch')?.value.trim()||'';
  if(from&&to&&from>to)return toast('A data inicial não pode ser maior que a data final.','error');
  window.forgeAttendanceFilters={...attendanceFilterState(),from,to,search};
  render();
 },
 'clear-attendance-filter':()=>{
  window.forgeAttendanceFilters={from:'',to:'',search:'',status:'todos'};
  render();
 },
 'edit-pet':b=>{const p=db.data.pets.find(x=>x.id===b.dataset.id);if(!p)return;modal('Editar pet',`<div class="form-grid"><div class="field"><label>Nome *</label><input id="pNome" value="${escapeAttr(p.nome)}"></div><div class="field"><label>Espécie</label><select id="pEspecie"><option ${p.especie==='Canino'?'selected':''}>Canino</option><option ${p.especie==='Felino'?'selected':''}>Felino</option><option ${p.especie==='Outro'?'selected':''}>Outro</option></select></div><div class="field"><label>Raça</label><input id="pRaca" value="${escapeAttr(p.raca)}"></div><div class="field"><label>Cor</label><input id="pCor" value="${escapeAttr(p.cor)}"></div><div class="field"><label>Sexo</label><select id="pSexo"><option ${p.sexo==='Macho'?'selected':''}>Macho</option><option ${p.sexo==='Fêmea'?'selected':''}>Fêmea</option><option ${p.sexo==='Não informado'?'selected':''}>Não informado</option></select></div><div class="field"><label>Porte</label><select id="pPorte"><option value="">Não informado</option><option ${p.porte==='Pequeno'?'selected':''}>Pequeno</option><option ${p.porte==='Médio'?'selected':''}>Médio</option><option ${p.porte==='Grande'?'selected':''}>Grande</option></select></div><div class="field"><label>Peso (kg)</label><input id="pPeso" type="text" data-mask="decimal" data-decimals="3" inputmode="decimal" value="${String(p.peso??'').replace('.',',')}"></div><div class="field"><label>Castrado</label><select id="pCastrado"><option ${p.castrado==='Sim'?'selected':''}>Sim</option><option ${p.castrado==='Não'?'selected':''}>Não</option></select></div><div class="field"><label>Nascimento</label><input id="pNasc" type="date" value="${escapeAttr(p.nascimento)}"></div><div class="field"><label>Temperamento</label><input id="pTemperamento" value="${escapeAttr(p.temperamento)}"></div><div class="field full"><label>Observações</label><textarea id="pObs">${escapeHtml(p.obs||'')}</textarea></div></div>`,async close=>{try{const name=$('#pNome').value.trim();if(!name)return toast('Informe o nome do pet.');const carePreferences={naoAceitaSecador:!!p.naoAceitaSecador,naoAceitaMaquina:!!p.naoAceitaMaquina,semPerfume:!!p.semPerfume,semLaco:!!p.semLaco,servicosPreferidos:p.servicosPreferidos||[]};const {pet}=await cloud.request(`/api/forge/pets/${p.id}`,{method:'PUT',body:JSON.stringify({name,species:$('#pEspecie').value,breed:$('#pRaca').value,color:$('#pCor').value,sex:$('#pSexo').value,size:$('#pPorte').value,weight:parseLocaleNumber($('#pPeso').value),neutered:$('#pCastrado').value==='Sim',birthDate:$('#pNasc').value,temperament:$('#pTemperamento').value,careNotes:$('#pObs').value,carePreferences})});Object.assign(p,cloud.pet(pet));localStorage.setItem('vetcoreShopPro',JSON.stringify(db.data));close();render();toast('Pet atualizado.');}catch(e){toast(e.message);}});},
 'delete-pet':b=>{const p=db.data.pets.find(x=>x.id===b.dataset.id);if(!p)return;modal('Excluir pet',`<p>Deseja excluir o cadastro de <b>${escapeHtml(p.nome)}</b>?</p><div class="notice">O pet ficará inativo no banco de dados.</div>`,async close=>{try{await cloud.request(`/api/forge/pets/${p.id}`,{method:'DELETE'});db.data.pets=db.data.pets.filter(x=>x.id!==p.id);localStorage.setItem('vetcoreShopPro',JSON.stringify(db.data));close();render();toast('Pet excluído.');}catch(e){toast(e.message);}},'Excluir');},
 'new-pet-select':()=>{if(!db.data.clientes.length)return toast('Cadastre um cliente primeiro.');modal('Escolha o tutor',`<div class="field"><label>Tutor</label><select id="petTutor">${db.data.clientes.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('')}</select></div>`,close=>{const id=$('#petTutor').value;close();actions['new-pet']({dataset:{id}});},'Continuar');},
 'quick-sale':()=>openSaleModal(),
 'new-entry':()=>openSaleModal(),
 'new-expense':()=>openExpenseChoice(),
 'new-pending-expense':()=>openExpenseModal(null,'pendente'),
 'new-paid-expense':()=>openExpenseModal(null,'pago'),
 'notifications':()=>{const bills=boletoAlerts();modal('Notificações',`<div class="notice-list">${bills.length?bills.map(x=>`<button class="notice notice-button" data-action="go-boletos"><span>🧾</span><div><b>Boleto vence amanhã</b><small>${escapeHtml(x.empresa)} · ${money(x.valor)} · ${formatDateBR(x.vencimento)}</small></div></button>`).join(''):'<div class="notice">✓ Nenhum boleto vence amanhã.</div>'}<div class="notice">⚠ Confira os produtos com estoque baixo.</div><div class="notice">📅 Revise os atendimentos de hoje.</div></div>`,close=>close(),'Fechar')},
 'birthdays-week':()=>openBirthdayWeek(),
 'whatsapp-center':()=>{if(!db.data.clientes.length)return toast('Cadastre clientes com WhatsApp primeiro.');modal('Central de WhatsApp',`<div class="form-grid"><div class="field full"><label>Cliente</label><select id="wCliente">${db.data.clientes.map(c=>`<option value="${c.id}">${c.nome} · ${c.telefone||'sem telefone'}</option>`).join('')}</select></div><div class="field full"><label>Mensagem</label><textarea id="wMsg">Olá! Passando para lembrar do atendimento do seu pet. 🐾</textarea></div></div>`,close=>{const c=db.data.clientes.find(x=>x.id===$('#wCliente').value);if(!c?.telefone)return toast('Este cliente não possui telefone.');const phone=c.telefone.replace(/\D/g,'');window.open(`https://wa.me/55${phone}?text=${encodeURIComponent($('#wMsg').value)}`,'_blank');close();},'Abrir WhatsApp');},
 'add-company-user':()=>{
  modal('Adicionar usuário por e-mail',`<div class="invite-user-intro"><span>✉</span><div><strong>Novo acesso ao ForgePets</strong><p>Cadastre o e-mail e gere uma senha temporária para o novo usuário.</p></div></div><div class="form-grid"><div class="field"><label>Nome *</label><input id="newUserName" data-trim placeholder="Nome do usuário"></div><div class="field"><label>E-mail *</label><input id="newUserEmail" type="email" placeholder="usuario@empresa.com.br"></div><div class="field"><label>Perfil</label><select id="newUserRole"><option value="EMPLOYEE">Atendente</option><option value="MANAGER">Gerente</option><option value="OWNER">Administrador</option></select></div><div class="field"><label>Senha temporária</label><input id="newUserPassword" type="text" value="${Math.random().toString(36).slice(-4).toUpperCase()}${Math.floor(1000+Math.random()*9000)}"></div></div><div class="notice">O usuário poderá entrar imediatamente com esse e-mail e a senha temporária.</div>`,async close=>{
   const name=$('#newUserName').value.trim(),email=$('#newUserEmail').value.trim().toLowerCase(),role=$('#newUserRole').value,password=$('#newUserPassword').value;
   if(!name)return setModalError('Informe o nome do usuário.');if(!isValidEmail(email))return setModalError('Informe um e-mail válido.');if(password.length<6)return setModalError('A senha temporária deve ter pelo menos 6 caracteres.');
   try{await cloud.request('/api/forge/users',{method:'POST',body:JSON.stringify({name,email,role,password})});close();await loadCompanyUsers({rerender:true});modal('Usuário adicionado',`<div class="user-created-success"><span>✓</span><h3>Acesso criado com sucesso</h3><p>Envie estes dados ao novo usuário:</p><div><small>E-mail</small><strong>${escapeHtml(email)}</strong></div><div><small>Senha temporária</small><strong>${escapeHtml(password)}</strong></div></div>`,c=>c(),'Concluir');}catch(error){setModalError(error.message||'Não foi possível adicionar o usuário.');}
  },'Criar acesso');
 },
 'user-menu':()=>toggleUserMenu(),
 'profile':()=>openProfileModal(),
 'change-password':()=>openPasswordModal(),
 'user-settings':()=>{closeUserMenu();go('config');},
 'logout':()=>{closeUserMenu();logout();},
 'view-client':b=>{const c=db.data.clientes.find(x=>x.id===b.dataset.id);if(!c)return;const pets=sortAlpha(db.data.pets.filter(p=>p.clienteId===c.id),'nome');modal(`Tutor: ${c.nome}`,`<div class="client-profile-grid"><div class="client-summary-card"><div class="client-avatar">${(c.nome||'?').charAt(0).toUpperCase()}</div><div><h3>${escapeHtml(c.nome)}</h3><p>${escapeHtml(c.telefone||'Sem telefone')}</p><p>${escapeHtml(c.email||'Sem e-mail')}</p><p>CPF: ${escapeHtml(c.cpf||'Não informado')}</p></div></div><div class="client-benefits"><div><small>Pontos</small><strong>${Number(c.pontos||0).toLocaleString('pt-BR')}</strong></div><div><small>Cashback disponível</small><strong>${money(c.cashback||0)}</strong></div></div></div><div class="section-title modal-section"><div><h2>Animais do tutor</h2><p>Clique em um animal para abrir a ficha e a linha do tempo.</p></div><div><button class="btn ghost" data-action="edit-client" data-id="${c.id}">Editar tutor</button> <button class="btn primary" data-action="new-pet" data-id="${c.id}">Adicionar pet</button></div></div>${pets.length?`<div class="tutor-pet-list">${pets.map(p=>`<button type="button" data-action="view-pet" data-id="${p.id}"><span class="mini-avatar">${p.especie==='Felino'?'🐱':p.especie==='Canino'?'🐶':'🐾'}</span><span><b>${escapeHtml(p.nome)}</b><small>${escapeHtml(p.especie||'')} ${p.raca?`· ${escapeHtml(p.raca)}`:''}</small></span><i>→</i></button>`).join('')}</div>`:'<div class="empty">Este tutor ainda não possui animais cadastrados.</div>'}`,close=>close(),'Fechar');},
 'view-pet':b=>{const p=db.data.pets.find(x=>x.id===b.dataset.id),c=p&&db.data.clientes.find(x=>x.id===p.clienteId);if(!p)return;const agendamentos=db.data.agenda.filter(a=>a.petId===p.id);const concluidos=agendamentos.filter(a=>a.status==='Concluído');const relacionados=db.data.pendencias.filter(x=>x.petId===p.id||agendamentos.some(a=>a.id===x.agendaId));const pagos=relacionados.filter(x=>x.status==='pago'),abertos=relacionados.filter(x=>x.status==='aberto');const totalGasto=pagos.reduce((s,x)=>s+Number(x.valor||0),0),ticket=pagos.length?totalGasto/pagos.length:0;const prox=agendamentos.filter(a=>a.status!=='Concluído'&&new Date(`${a.data}T${a.hora||'00:00'}`)>=new Date()).sort((a,b)=>new Date(`${a.data}T${a.hora}`)-new Date(`${b.data}T${b.hora}`))[0];const serviceCount={};concluidos.forEach(a=>{const sv=db.data.servicos.find(s=>s.id===a.servicoId);const n=sv?.nome||'Serviço';serviceCount[n]=(serviceCount[n]||0)+1});const events=[{date:p.createdAt||p.cadastroEm||'1900-01-01',title:'Pet cadastrado',text:'Cadastro criado no ForgePets.',type:'cadastro'}];agendamentos.forEach(a=>{const serv=db.data.servicos.find(s=>s.id===a.servicoId),pend=db.data.pendencias.find(x=>x.agendaId===a.id);events.push({date:`${a.data||''}T${a.hora||'00:00'}`,title:serv?.nome||'Atendimento',text:`${a.status||'Agendado'}${a.profissional?` · ${a.profissional}`:''}${a.obs?` · ${a.obs}`:''}`,type:a.status==='Concluído'?'concluido':'agenda'});if(pend)events.push({date:pend.paidAt||pend.data||a.data,title:pend.status==='pago'?'Pagamento recebido':'Valor em aberto no caixa',text:`${money(pend.valor||0)} · ${pend.forma||'Aguardando pagamento'}`,type:pend.status==='pago'?'pago':'aberto'});});events.sort((a,b)=>new Date(b.date)-new Date(a.date));const care=[p.temperamento&&`Temperamento: ${p.temperamento}`,p.naoAceitaSecador&&'Não aceita secador',p.naoAceitaMaquina&&'Não aceita máquina',p.semPerfume&&'Não usar perfume',p.semLaco&&'Não usar laço/gravatinha'].filter(Boolean);const prefs=(p.servicosPreferidos||[]).map(id=>db.data.servicos.find(s=>s.id===id)?.nome).filter(Boolean);modal(`Painel do pet · ${p.nome}`,`<div class="pet-dashboard"><div class="pet-dashboard-head"><div class="pet-big">${p.especie==='Felino'?'🐱':p.especie==='Canino'?'🐶':'🐾'}</div><div><h2>${escapeHtml(p.nome)}</h2><p><button class="link-btn inline-link" data-action="view-client" data-id="${c?.id||''}">Tutor: ${escapeHtml(c?.nome||'Não informado')}</button></p><div class="pet-tags"><span>${escapeHtml(p.especie||'Não informado')}</span>${p.raca?`<span>${escapeHtml(p.raca)}</span>`:''}${p.cor?`<span>${escapeHtml(p.cor)}</span>`:''}${p.porte?`<span>Porte ${escapeHtml(p.porte)}</span>`:''}</div></div></div><div class="pet-kpis"><div><small>Total gasto</small><strong>${money(totalGasto)}</strong></div><div><small>Ticket médio</small><strong>${money(ticket)}</strong></div><div><small>Atendimentos</small><strong>${concluidos.length}</strong></div><div><small>Em aberto</small><strong>${money(abertos.reduce((s,x)=>s+Number(x.valor||0),0))}</strong></div></div><div class="pet-panel-grid"><section class="pet-panel-card"><h3>Dados do pet</h3><p><b>Sexo:</b> ${escapeHtml(p.sexo||'Não informado')}</p><p><b>Castrado:</b> ${escapeHtml(p.castrado||'Não informado')}</p><p><b>Nascimento:</b> ${p.nascimento?new Date(`${p.nascimento}T12:00:00`).toLocaleDateString('pt-BR'):'Não informado'}</p><p><b>Próximo agendamento:</b> ${prox?`${new Date(`${prox.data}T12:00:00`).toLocaleDateString('pt-BR')} às ${prox.hora}`:'Nenhum'}</p></section><section class="pet-panel-card"><h3>Preferências e cuidados</h3>${care.length?`<div class="care-list">${care.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div>`:'<p class="muted">Nenhum cuidado específico informado.</p>'}${prefs.length?`<p><b>Serviços preferidos:</b> ${escapeHtml(prefs.join(', '))}</p>`:''}${p.obs?`<p><b>Observações:</b> ${escapeHtml(p.obs)}</p>`:''}</section><section class="pet-panel-card"><h3>Serviços realizados</h3>${Object.keys(serviceCount).length?`<div class="service-count-list">${Object.entries(serviceCount).sort((a,b)=>b[1]-a[1]).map(([n,q])=>`<div><span>${escapeHtml(n)}</span><strong>${q}</strong></div>`).join('')}</div>`:'<p class="muted">Nenhum serviço concluído.</p>'}</section><section class="pet-panel-card"><h3>Fidelidade do tutor</h3>${hasFeature('fidelidade')?`<div class="loyalty-mini"><div><small>Pontos</small><strong>${Number(c?.pontos||0).toLocaleString('pt-BR')}</strong></div><div><small>Cashback</small><strong>${money(c?.cashback||0)}</strong></div></div>`:'<p class="muted">Disponível nos planos Profissional e Premium.</p>'}</section></div><div class="pet-timeline-header"><h2>Linha do tempo</h2><p>Agendamentos, serviços, valores em aberto e pagamentos deste pet.</p></div><div class="pet-timeline">${events.length?events.map(e=>`<div class="timeline-item ${e.type}"><div class="timeline-dot"></div><div><time>${e.date&&e.date!=='1900-01-01'?new Date(e.date).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:e.date.includes('T')?'short':undefined}):'Data não informada'}</time><h4>${escapeHtml(e.title)}</h4><p>${escapeHtml(e.text)}</p></div></div>`).join(''):'<div class="empty">Nenhum histórico registrado.</div>'}</div></div>`,close=>close(),'Fechar');},
 'add-points':()=>{if(!db.data.clientes.length)return toast('Cadastre clientes primeiro.');modal('Adicionar pontos',`<div class="form-grid"><div class="field"><label>Cliente</label><select id="ptCliente">${db.data.clientes.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('')}</select></div><div class="field"><label>Pontos</label><input id="ptValor" type="number" min="1" value="10"></div></div>`,close=>{const c=db.data.clientes.find(x=>x.id===$('#ptCliente').value);const v=Number($('#ptValor').value||0);c.pontos=Number(c.pontos||0)+v;addLoyaltyHistory(c.id,'pontos_ganhos','Ajuste manual de pontos',v);runPremiumAutomations();db.save();close();toast('Pontos adicionados.');});},
 'edit-points':b=>{const c=db.data.clientes.find(x=>x.id===b.dataset.id);modal(`Ajustar pontos de ${c.nome}`,`<div class="field"><label>Total de pontos</label><input id="ptEdit" type="number" value="${c.pontos||0}"></div>`,close=>{const before=Number(c.pontos||0),after=Number($('#ptEdit').value||0);c.pontos=after;addLoyaltyHistory(c.id,'ajuste_pontos','Ajuste manual de saldo',after-before);runPremiumAutomations();db.save();close();toast('Pontos atualizados.');});},
 'adjust-loyalty':b=>{const c=db.data.clientes.find(x=>x.id===b.dataset.id);if(!c)return;modal(`Ajustar fidelidade · ${c.nome}`,`<div class="form-grid"><div class="field"><label>Total de pontos</label><input id="loyaltyPoints" type="number" min="0" value="${Number(c.pontos||0)}"></div><div class="field"><label>Cashback disponível</label><input id="loyaltyCashback" type="text" data-mask="money" inputmode="numeric" value="${money(c.cashback||0)}"></div><div class="field full"><label>Motivo do ajuste</label><input id="loyaltyReason" placeholder="Ex.: correção de saldo, campanha, cortesia"></div></div>`,close=>{const oldP=Number(c.pontos||0),oldC=Number(c.cashback||0),newP=Math.max(0,Number($('#loyaltyPoints').value||0)),newC=Math.max(0,parseLocaleNumber($('#loyaltyCashback').value)),reason=$('#loyaltyReason').value.trim()||'Ajuste manual';c.pontos=newP;c.cashback=newC;if(newP!==oldP)addLoyaltyHistory(c.id,'ajuste_pontos',reason,newP-oldP);if(newC!==oldC)addLoyaltyHistory(c.id,'ajuste_cashback',reason,newC-oldC);runPremiumAutomations();db.save();close();toast('Saldos de fidelidade atualizados.');});},
 'redeem-reward':b=>{const c=db.data.clientes.find(x=>x.id===b.dataset.id);if(!c)return;const available=db.data.recompensas.filter(r=>r.ativo!==false&&Number(c.pontos||0)>=Number(r.pontos||0));modal(`Resgatar recompensa · ${c.nome}`,available.length?`<div class="reward-choice">${available.map(r=>`<label><input type="radio" name="rewardChoice" value="${r.id}"><span><b>${escapeHtml(r.nome)}</b><small>${r.pontos} pontos · ${money(r.valor)} de crédito</small></span></label>`).join('')}</div>`:'<div class="empty">O tutor ainda não possui pontos suficientes.</div>',close=>{const id=document.querySelector('[name=rewardChoice]:checked')?.value;if(!id)return toast('Selecione uma recompensa.');const r=db.data.recompensas.find(x=>x.id===id);c.pontos=Number(c.pontos||0)-Number(r.pontos);c.cashback=Number(c.cashback||0)+Number(r.valor||0);addLoyaltyHistory(c.id,'pontos_resgatados',`Recompensa: ${r.nome}`,-Number(r.pontos),{recompensaId:r.id});addLoyaltyHistory(c.id,'cashback_gerado',`Crédito da recompensa: ${r.nome}`,Number(r.valor),{recompensaId:r.id});db.save();close();toast('Recompensa resgatada e convertida em crédito.');},'Resgatar');},
 'new-reward':()=>modal('Nova recompensa',`<div class="form-grid"><div class="field full"><label>Nome</label><input id="rewardName"></div><div class="field"><label>Pontos necessários</label><input id="rewardPoints" type="number" min="1"></div><div class="field"><label>Valor do benefício</label><input id="rewardValue" type="text" data-mask="money" inputmode="numeric" placeholder="R$ 0,00"></div></div>`,close=>{if(!$('#rewardName').value.trim()||Number($('#rewardPoints').value)<=0)return toast('Preencha nome e pontos.');db.data.recompensas.push({id:uid(),nome:$('#rewardName').value.trim(),pontos:Number($('#rewardPoints').value),valor:parseLocaleNumber($('#rewardValue').value),ativo:true});db.save();close();toast('Recompensa criada.');}),
 'new-coupon':()=>{if(!hasFeature('cupons'))return;modal('Criar cupom',`<div class="form-grid"><div class="field"><label>Cliente</label><select id="couponClient"><option value="">Cupom geral</option>${db.data.clientes.map(c=>`<option value="${c.id}">${c.nome}</option>`).join('')}</select></div><div class="field"><label>Código</label><input id="couponCode" value="PROMO${Math.floor(Math.random()*900+100)}"></div><div class="field"><label>Tipo</label><select id="couponType"><option value="percentual">Percentual</option><option value="valor">Valor em reais</option></select></div><div class="field"><label>Desconto</label><input id="couponValue" type="text" data-mask="decimal" data-decimals="2" inputmode="decimal" value="10,00"></div><div class="field"><label>Validade</label><input id="couponExpiry" type="date" value="${daysFromNow(30)}"></div></div>`,close=>{const code=$('#couponCode').value.trim().toUpperCase();if(!code)return toast('Informe o código.');db.data.cupons.push({id:uid(),codigo:code,clienteId:$('#couponClient').value,tipo:$('#couponType').value,valor:parseLocaleNumber($('#couponValue').value),validade:$('#couponExpiry').value,status:'ativo',origem:'Manual',createdAt:new Date().toISOString()});db.save();close();toast('Cupom criado.');});},
 'send-campaign':b=>{const x=db.data.campanhas.find(c=>c.id===b.dataset.id),c=x&&db.data.clientes.find(c=>c.id===x.clienteId);if(!x||!c)return;if(!c.telefone)return toast('O tutor não possui WhatsApp cadastrado.');window.open(`https://wa.me/55${onlyDigits(c.telefone)}?text=${encodeURIComponent(x.mensagem)}`,'_blank');x.status='enviada';x.sentAt=new Date().toISOString();db.save();toast('Campanha marcada como enviada.');},

 'apply-report-filters':()=>{const f=reportFilters();const start=$('#reportStart').value,end=$('#reportEnd').value;if(!start||!end)return toast('Selecione a data inicial e final.');if(start>end)return toast('A data inicial não pode ser maior que a final.');reportStart=start;reportEnd=end;f.service=$('#reportService').value;f.professional=$('#reportProfessional').value;f.status=$('#reportStatus').value;f.payment=$('#reportPayment').value;f.search=$('#reportSearch').value.trim();render();toast('Relatório atualizado.','success');},
 'clear-report-filters':()=>{window.forgeReportFilters={service:'all',professional:'all',status:'all',payment:'all',search:''};reportStart=daysAgo(29);reportEnd=today();render();},
 'export-report-pdf':()=>exportReportPdf(),
 'export-service-report':()=>{const f=reportFilters(),rows=db.data.agenda.filter(a=>inPeriod(a.data,reportStart,reportEnd)).filter(a=>(f.service==='all'||String(a.servicoId)===f.service)&&(f.professional==='all'||String(a.profissional||'')===f.professional)&&(f.status==='all'||String(a.status||'Agendado')===f.status));const csv=['Data;Hora;Serviço;Pet;Tutor;Funcionário;Status',...rows.map(a=>{const p=db.data.pets.find(x=>x.id===a.petId),c=p&&db.data.clientes.find(x=>x.id===p.clienteId);return [a.data,a.hora,reportServiceName(a.servicoId),p?.nome||'',c?.nome||'',a.profissional||'',a.status||''].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')})].join('\n');const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`relatorio-servicos-${reportStart}-${reportEnd}.csv`;link.click();URL.revokeObjectURL(url);toast('Relatório exportado.','success');},
 'report-period':b=>{const n=Number(b.dataset.days||30);reportEnd=today();reportStart=daysAgo(n-1);render();},
 'report-month':()=>{const d=new Date();reportStart=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`;reportEnd=today();render();},
 'apply-report-period':()=>{const start=$('#reportStart').value,end=$('#reportEnd').value;if(!start||!end)return toast('Selecione a data inicial e final.');if(start>end)return toast('A data inicial não pode ser maior que a final.');reportStart=start;reportEnd=end;render();toast('Relatório atualizado.');},
 'forge-labs-info':()=>openForgeLabsInfo(),
 'terms-info':()=>openLegalInfo('Termos de Uso','O ForgePets é licenciado para uso da empresa contratante conforme o plano ativo. O acesso é individual e os dados cadastrados são de responsabilidade do usuário. Cópia, revenda ou distribuição não autorizada do sistema não são permitidas.'),
 'privacy-info':()=>openLegalInfo('Política de Privacidade','Os dados inseridos no ForgePets são utilizados exclusivamente para o funcionamento da gestão do pet shop. Informações de clientes, pets, vendas e atendimentos devem ser tratadas conforme a LGPD e as políticas internas da empresa contratante.'),
 'support-info':()=>{closeUserMenu();openForgeConnect('chat');},
 'backup':exportBackup
};

function initSystemFooter(){
 const update=()=>{
  const online=navigator.onLine;
  const state=document.querySelector('.server-state'),text=$('#serverStatusText');
  if(state)state.classList.toggle('offline',!online);
  if(text)text.textContent=online?'Online':'Offline · Modo local';
  const sync=$('#lastSyncTime');if(sync)sync.textContent=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
 };
 update();
 window.addEventListener('online',update);window.addEventListener('offline',update);
 setInterval(()=>{const sync=$('#lastSyncTime');if(sync&&navigator.onLine)sync.textContent=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});},60000);
}
function openForgeLabsInfo(){
 modal('Sobre o ForgePets',`<div class="forge-labs-modal"><div class="forge-labs-mark"><div class="forge-labs-symbol">F</div><div><h3>Forge Labs</h3><p>Tecnologia criada para transformar negócios.</p></div></div><div class="system-info-grid"><div><small>Produto</small><strong>ForgePets</strong></div><div><small>Versão</small><strong>v9.6.0</strong></div><div><small>Build</small><strong>2026.07.31</strong></div><div><small>Ambiente</small><strong>Produção</strong></div><div><small>Licença</small><strong>Profissional</strong></div><div><small>Status</small><strong>${navigator.onLine?'Online':'Offline · Modo local'}</strong></div></div><div class="notice">Desenvolvido por <strong>Forge Labs</strong>. Todos os direitos reservados.</div></div>`,close=>close(),'Fechar');
}
function openLegalInfo(title,text){
 modal(title,`<div class="legal-copy"><p>${text}</p><h4>Uso responsável</h4><p>O usuário deve manter suas credenciais seguras, realizar backups periódicos e utilizar o sistema somente para atividades legítimas do estabelecimento.</p><h4>Suporte</h4><p>Em caso de dúvidas, utilize o Forge Connect dentro do sistema.</p></div>`,close=>close(),'Entendi');
}

function openSaleModal(){
 if(!db.data.servicos.length&&!db.data.estoque.length)return toast('Cadastre ao menos um produto ou serviço.');
 saleCart=[];
 const root=$('#modalRoot');
 root.innerHTML=`<div class="modal-overlay"><div class="modal sale-modal pdv-modal"><div class="modal-header pdv-header"><div><small>CAIXA · PONTO DE VENDA</small><strong>Nova venda</strong></div><div class="pdv-sale-number">Venda #${String((db.data.vendas?.length||0)+1).padStart(6,'0')}</div><button class="icon-btn" data-close>&times;</button></div><div class="modal-body pdv-body">
 <div class="pdv-grid"><section class="pdv-main"><div class="pdv-customer-bar"><div class="field"><label>Tutor / cliente</label><select id="saleClient"><option value="">Consumidor não identificado</option>${sortAlpha(db.data.clientes,'nome').map(c=>`<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join('')}</select></div><div class="pdv-clock"><small>Data e hora</small><strong>${new Date().toLocaleDateString('pt-BR')} · ${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</strong></div></div>
 <div class="pdv-product-search"><div class="field"><label>Pesquisar produto ou serviço</label><div class="sale-search"><span>⌕</span><input id="saleSearch" type="search" placeholder="Digite o nome ou código..." autocomplete="off"></div></div><div class="field"><label>Item encontrado</label><select id="saleItem"></select><small class="sale-search-result" id="saleSearchResult"></small></div><button class="btn primary pdv-add" id="saleAdd">＋ Adicionar</button></div>
 <div id="saleBenefits"></div><div id="saleCart"></div></section>
 <aside class="pdv-summary"><div class="pdv-summary-title"><span>Resumo da venda</span><small>Atualizado em tempo real</small></div><div id="saleTotals"></div><div class="pdv-payment"><label>Forma de pagamento</label><div class="pdv-payment-options" id="salePaymentOptions">${['PIX','Dinheiro','Cartão de débito','Cartão de crédito'].map((x,i)=>`<button type="button" class="pdv-payment-btn ${i===0?'active':''}" data-payment="${x}">${x==='PIX'?'▣':x==='Dinheiro'?'R$':x.includes('débito')?'D':x.includes('crédito')?'C':'••'}<span>${x}</span></button>`).join('')}</div><input type="hidden" id="salePayment" value="PIX"><div id="saleCashPanel"></div></div><label class="pdv-fiscal-option"><input id="saleEmitFiscal" type="checkbox"><span><b>Registrar NFS-e desta venda</b><small>Cria uma solicitação fiscal com os serviços da venda.</small></span></label><div class="pdv-safe-note">🔒 Confira os valores antes de finalizar a venda.</div></aside></div></div>
 <div class="modal-footer sale-footer pdv-footer"><button class="btn ghost" data-close>Cancelar</button><div><button class="btn" id="saleFinish">Finalizar venda</button><button class="btn primary" id="saleFinishPrint">Finalizar e imprimir</button></div></div></div></div>`;
 root.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>root.innerHTML='');
 renderSaleItemOptions();
 $('#saleSearch').oninput=renderSaleItemOptions;
 $('#saleSearch').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();addSelectedSaleItem();}};
 $('#saleAdd').onclick=addSelectedSaleItem;
 $('#saleClient').onchange=()=>{renderSaleBenefits();renderSaleSummary();};
 root.querySelectorAll('[data-payment]').forEach(btn=>btn.onclick=()=>selectSalePayment(btn.dataset.payment));
 $('#saleFinish').onclick=()=>finishSale(false);
 $('#saleFinishPrint').onclick=()=>finishSale(true);
 renderSaleBenefits();renderSaleCart();selectSalePayment('PIX');
}
function renderSaleItemOptions(){
 const select=$('#saleItem'),result=$('#saleSearchResult');if(!select)return;
 const query=normalize($('#saleSearch')?.value||'');
 const servicos=sortAlpha(db.data.servicos,'nome').filter(s=>normalize(s.nome).includes(query));
 const produtos=sortAlpha(db.data.estoque,'nome').filter(p=>normalize(p.nome).includes(query));
 const groups=[];
 if(servicos.length)groups.push(`<optgroup label="Serviços">${servicos.map(s=>`<option value="servico:${s.id}">${escapeHtml(s.nome)} — ${money(s.valor)}</option>`).join('')}</optgroup>`);
 if(produtos.length)groups.push(`<optgroup label="Produtos">${produtos.map(p=>`<option value="produto:${p.id}" ${Number(p.qtd)<=0?'disabled':''}>${escapeHtml(p.nome)} — ${money(p.valorVenda??p.custo)} (${p.qtd} em estoque)</option>`).join('')}</optgroup>`);
 select.innerHTML=groups.join('')||'<option value="">Nenhum item encontrado</option>';
 select.disabled=!groups.length;
 if(result)result.textContent=`${servicos.length} serviço(s) e ${produtos.length} produto(s) encontrado(s)`;
}
function renderSaleBenefits(){const el=$('#saleBenefits');if(!el)return;const c=db.data.clientes.find(x=>x.id===$('#saleClient')?.value);if(!c){el.innerHTML='';renderSaleSummary();return;}const coupons=hasFeature('cupons')?validClientCoupons(c.id):[];el.innerHTML=`<div class="sale-benefits pdv-benefits"><div><small>Cashback disponível</small><strong>${money(c.cashback||0)}</strong></div>${hasFeature('vip')?`<div><small>Nível VIP</small><strong>${vipLevel(c)} · ${vipDiscount(c)}%</strong></div>`:''}<div class="field"><label>Usar cashback</label><input id="saleCashback" type="text" data-mask="money" inputmode="numeric" value="R$ 0,00"></div>${coupons.length?`<div class="field"><label>Cupom</label><select id="saleCoupon"><option value="">Nenhum</option>${coupons.map(x=>`<option value="${x.id}">${x.codigo} · ${x.tipo==='percentual'?x.valor+'%':money(x.valor)}</option>`).join('')}</select></div>`:''}</div>`;applyInputMasks(el);$('#saleCashback')?.addEventListener('input',renderSaleSummary);$('#saleCoupon')?.addEventListener('change',renderSaleSummary);renderSaleSummary();}
function addSelectedSaleItem(){
 const [tipo,id]=($('#saleItem').value||'').split(':');if(!id)return;
 const src=tipo==='servico'?db.data.servicos.find(x=>x.id===id):db.data.estoque.find(x=>x.id===id);if(!src)return;
 const existing=saleCart.find(x=>x.tipo===tipo&&x.id===id);
 if(existing){if(tipo==='produto'&&existing.qtd>=Number(src.qtd))return toast('Quantidade maior que o estoque disponível.');existing.qtd++;}
 else saleCart.push({tipo,id,nome:src.nome,preco:Number(tipo==='servico'?src.valor:(src.valorVenda??src.custo)||0),qtd:1});
 renderSaleCart();
}
function renderSaleCart(){
 const el=$('#saleCart');if(!el)return;
 el.innerHTML=`<div class="sale-cart-head"><div><strong>Itens da venda</strong><small>${saleCart.reduce((s,x)=>s+x.qtd,0)} unidade(s)</small></div><span>${saleCart.length} item(ns)</span></div>${saleCart.length?`<div class="sale-items pdv-items">${saleCart.map((x,i)=>`<div class="sale-row pdv-sale-row"><div class="pdv-item-icon">${x.tipo==='produto'?'▥':'✂'}</div><div class="pdv-item-copy"><strong>${escapeHtml(x.nome)}</strong><small>${x.tipo==='produto'?'Produto':'Serviço'} · ${money(x.preco)} por unidade</small></div><div class="qty-control"><button data-sale-minus="${i}">−</button><span>${x.qtd}</span><button data-sale-plus="${i}">+</button></div><strong class="pdv-line-total">${money(x.preco*x.qtd)}</strong><button class="sale-remove" data-sale-remove="${i}" title="Remover">×</button></div>`).join('')}</div>`:'<div class="empty pdv-empty"><b>Nenhum item adicionado</b><span>Pesquise um produto ou serviço acima para começar.</span></div>'}`;
 el.querySelectorAll('[data-sale-minus]').forEach(b=>b.onclick=()=>changeSaleQty(Number(b.dataset.saleMinus),-1));
 el.querySelectorAll('[data-sale-plus]').forEach(b=>b.onclick=()=>changeSaleQty(Number(b.dataset.salePlus),1));
 el.querySelectorAll('[data-sale-remove]').forEach(b=>b.onclick=()=>{saleCart.splice(Number(b.dataset.saleRemove),1);renderSaleCart();});
 renderSaleSummary();
}
function getSaleTotals(){
 const bruto=saleCart.reduce((s,x)=>s+x.preco*x.qtd,0);
 const cliente=db.data.clientes.find(c=>c.id===$('#saleClient')?.value);
 const cashUse=Math.min(parseLocaleNumber($('#saleCashback')?.value),Number(cliente?.cashback||0),bruto);
 const coupon=db.data.cupons.find(c=>c.id===$('#saleCoupon')?.value);
 let discount=0;
 if(coupon)discount=coupon.tipo==='percentual'?bruto*Number(coupon.valor)/100:Number(coupon.valor);
 discount=Math.min(discount,Math.max(0,bruto-cashUse));
 const vip=cliente&&hasFeature('vip')?bruto*vipDiscount(cliente)/100:0;
 discount=Math.min(Math.max(0,bruto-cashUse),Math.max(discount,vip));
 return {bruto,cliente,cashUse,coupon,discount,total:Math.max(0,bruto-cashUse-discount)};
}
function selectSalePayment(payment){
 const field=$('#salePayment');if(field)field.value=payment;
 document.querySelectorAll('#salePaymentOptions [data-payment]').forEach(btn=>btn.classList.toggle('active',btn.dataset.payment===payment));
 renderSaleCashPanel();
}
function renderSaleCashPanel(){
 const panel=$('#saleCashPanel');if(!panel)return;
 const payment=$('#salePayment')?.value||'PIX',total=getSaleTotals().total;
 if(payment!=='Dinheiro'){panel.innerHTML=`<div class="pdv-payment-status"><span>Pagamento selecionado</span><strong>${escapeHtml(payment)}</strong></div>`;return;}
 const current=parseLocaleNumber($('#saleReceived')?.value);
 panel.innerHTML=`<div class="pdv-cash-box"><div class="field"><label>Valor entregue pelo cliente</label><input id="saleReceived" type="text" data-mask="money" inputmode="numeric" placeholder="R$ 0,00" value="${current?money(current):''}"></div><div class="pdv-quick-cash">${[20,50,100,200].map(v=>`<button type="button" data-cash-value="${v}">${money(v)}</button>`).join('')}<button type="button" data-cash-exact>Valor exato</button></div><div id="saleChangeResult"></div></div>`;
 applyInputMasks(panel);$('#saleReceived').addEventListener('input',renderSaleChange);
 panel.querySelectorAll('[data-cash-value]').forEach(b=>b.onclick=()=>{$('#saleReceived').value=money(Number(b.dataset.cashValue));renderSaleChange();});
 panel.querySelector('[data-cash-exact]').onclick=()=>{$('#saleReceived').value=money(total);renderSaleChange();};
 renderSaleChange();
}
function renderSaleChange(){
 const box=$('#saleChangeResult');if(!box)return;
 const total=getSaleTotals().total,received=parseLocaleNumber($('#saleReceived')?.value),difference=received-total;
 if(!received){box.innerHTML=`<div class="pdv-change neutral"><span>Total a receber</span><strong>${money(total)}</strong></div>`;return;}
 if(difference<0)box.innerHTML=`<div class="pdv-change pending"><span>Valor que ainda falta</span><strong>${money(Math.abs(difference))}</strong></div>`;
 else box.innerHTML=`<div class="pdv-change success"><span>Troco para o cliente</span><strong>${money(difference)}</strong></div>`;
}
function renderSaleSummary(){
 const el=$('#saleTotals');if(!el)return;
 const {bruto,cashUse,discount,total}=getSaleTotals();
 el.innerHTML=`<div class="pdv-totals"><div><span>Subtotal</span><strong>${money(bruto)}</strong></div>${cashUse>0?`<div class="discount"><span>Cashback</span><strong>− ${money(cashUse)}</strong></div>`:''}${discount>0?`<div class="discount"><span>Descontos</span><strong>− ${money(discount)}</strong></div>`:''}<div class="pdv-grand-total"><span>TOTAL</span><strong>${money(total)}</strong></div></div>`;
 if($('#salePayment')?.value==='Dinheiro')renderSaleCashPanel();
}
function changeSaleQty(i,delta){const item=saleCart[i];if(!item)return;const src=item.tipo==='produto'?db.data.estoque.find(x=>x.id===item.id):null;const next=item.qtd+delta;if(next<1){saleCart.splice(i,1);return renderSaleCart();}if(src&&next>Number(src.qtd))return toast('Quantidade maior que o estoque disponível.');item.qtd=next;renderSaleCart();}
async function finishSale(printAfter){
 const finishButton=$('#saleFinish'),printButton=$('#saleFinishPrint');
 if(finishButton?.disabled||printButton?.disabled)return;
 if(!saleCart.length)return toast('Adicione ao menos um item.');
 for(const item of saleCart){if(item.tipo==='produto'){const p=db.data.estoque.find(x=>x.id===item.id);if(!p||Number(p.qtd)<item.qtd)return toast(`Estoque insuficiente para ${item.nome}.`);}}
 const {bruto,cliente,cashUse,coupon,discount,total}=getSaleTotals(),clienteId=$('#saleClient').value,forma=$('#salePayment').value;
 let valorRecebido=null,troco=0;
 if(forma==='Dinheiro'){
  valorRecebido=parseLocaleNumber($('#saleReceived')?.value);
  if(valorRecebido<total)return setModalError(`O valor recebido é insuficiente. Ainda faltam ${money(total-valorRecebido)}.`);
  troco=Math.max(0,valorRecebido-total);
 }
 clearModalError();
 let printWindow=null;
 if(printAfter){
  printWindow=window.open('','_blank','width=420,height=700');
  if(!printWindow)return toast('Permita pop-ups para imprimir o cupom.');
  printWindow.document.write('<!doctype html><html><body style="font-family:Arial;padding:24px">Preparando cupom...</body></html>');
  printWindow.document.close();
 }
 const originalFinishText=finishButton?.textContent,originalPrintText=printButton?.textContent;
 if(finishButton){finishButton.disabled=true;finishButton.textContent='Finalizando...';}
 if(printButton){printButton.disabled=true;printButton.textContent=printAfter?'Preparando impressão...':'Finalizando...';}
 try{
  const venda={id:uid(),numero:String((db.data.vendas?.length||0)+1).padStart(6,'0'),data:today(),hora:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}),clienteId,forma,total,valorBruto:bruto,cashbackUsado:cashUse,desconto:discount,cupomId:coupon?.id||'',valorRecebido,troco,itens:saleCart.map(x=>({...x}))};
  venda.itens.forEach(item=>{if(item.tipo==='produto'){const p=db.data.estoque.find(x=>x.id===item.id);if(p)p.qtd=Number(p.qtd)-item.qtd;}});
  db.data.vendas.push(venda);
  db.data.caixa.push({id:uid(),tipo:'entrada',data:venda.data,descricao:`Venda #${venda.numero} — ${venda.itens.map(x=>`${x.qtd}x ${x.nome}`).join(', ')}`,valor:total,valorBruto:bruto,cashbackUsado:cashUse,desconto:discount,forma,valorRecebido,troco,vendaId:venda.id});
  if(cliente){
   if(cashUse){cliente.cashback=Math.max(0,Number(cliente.cashback||0)-cashUse);addLoyaltyHistory(cliente.id,'cashback_usado','Cashback usado na venda',-cashUse,{vendaId:venda.id});}
   if(coupon){coupon.status='usado';coupon.usedAt=new Date().toISOString();addLoyaltyHistory(cliente.id,'cupom_usado',`Cupom ${coupon.codigo} utilizado`,-discount,{cupomId:coupon.id,vendaId:venda.id});}
   if(hasFeature('fidelidade')){const pts=Math.floor(total*Number(db.data.config.pontosPorReal||1));cliente.pontos=Number(cliente.pontos||0)+pts;addLoyaltyHistory(cliente.id,'pontos_ganhos','Pontos da venda',pts,{vendaId:venda.id});if(hasFeature('cashback')){const cb=total*Number(db.data.config.percentualCashback||0)/100;cliente.cashback=Number(cliente.cashback||0)+cb;addLoyaltyHistory(cliente.id,'cashback_gerado','Cashback da venda',cb,{vendaId:venda.id});}}
  }
  const emitFiscal=Boolean($('#saleEmitFiscal')?.checked),serviceItems=venda.itens.filter(x=>x.tipo==='servico');
  runPremiumAutomations();
  db.save();
  $('#modalRoot').innerHTML='';
  toast(forma==='Dinheiro'?`Venda finalizada. Troco: ${money(troco)}.`:`Venda finalizada: ${money(total)}.`);
  if(printAfter)printReceipt(venda,printWindow);
  if(emitFiscal&&serviceItems.length){
   try{
    await cloud.request('/api/forge/fiscal/documents',{method:'POST',body:JSON.stringify({saleReference:`Venda #${venda.numero}`,tutorName:cliente?.nome||'',tutorDocument:cliente?.cpf||'',serviceDescription:serviceItems.map(x=>`${x.qtd}x ${x.nome}`).join(' | '),serviceAmount:serviceItems.reduce((sum,x)=>sum+Number(x.preco)*Number(x.qtd),0)})});
    toast('Solicitação de NFS-e registrada no Módulo Fiscal.','success');
   }catch(error){toast(`Venda concluída, mas a NFS-e não foi registrada: ${error.message||'erro fiscal'}.`,'error');}
  }else if(emitFiscal&&!serviceItems.length){toast('Venda concluída. A NFS-e não foi criada porque não há serviços na venda.','error');}
 }catch(error){
  if(printWindow&&!printWindow.closed)printWindow.close();
  console.error('[ForgePets] Erro ao finalizar venda.',error);
  setModalError(error?.message||'Não foi possível finalizar a venda.');
 }finally{
  if(finishButton){finishButton.disabled=false;finishButton.textContent=originalFinishText||'Finalizar venda';}
  if(printButton){printButton.disabled=false;printButton.textContent=originalPrintText||'Finalizar e imprimir';}
 }
}
function printReceipt(venda,existingWindow=null){
 const cliente=db.data.clientes.find(c=>c.id===venda.clienteId);const empresa=db.data.config.empresa||'Meu Pet Shop';
 const receiptWidth=String(db.data.config.impressora||'80'),bodyWidth=receiptWidth==='58'?'52':'72'; const html=`<!doctype html><html><head><meta charset="utf-8"><title>Cupom ${venda.numero}</title><style>@page{size:${receiptWidth}mm auto;margin:3mm}*{box-sizing:border-box}body{width:${bodyWidth}mm;margin:0 auto;font-family:Arial,sans-serif;font-size:12px;color:#000}.center{text-align:center}.line{border-top:1px dashed #000;margin:8px 0}.item{display:grid;grid-template-columns:1fr auto;gap:6px;margin:5px 0}.muted{font-size:10px}h2{font-size:16px;margin:0 0 4px}strong.total{font-size:16px} </style></head><body><div class="center"><h2>${empresa}</h2><div>${db.data.config.telefone||''}</div><div>${db.data.config.cidade||''}</div><div class="line"></div><strong>CUPOM NÃO FISCAL</strong><div class="muted">Venda #${venda.numero} · ${formatDateBR(venda.data)} ${venda.hora}</div></div><div class="line"></div>${cliente?`<div>Cliente: ${cliente.nome}</div><div class="line"></div>`:''}${venda.itens.map(x=>`<div class="item"><div>${x.qtd}x ${x.nome}<div class="muted">${money(x.preco)} cada</div></div><strong>${money(x.preco*x.qtd)}</strong></div>`).join('')}<div class="line"></div><div class="item"><strong class="total">TOTAL</strong><strong class="total">${money(venda.total)}</strong></div><div>Pagamento: ${venda.forma}</div>${venda.forma==='Dinheiro'?`<div>Recebido: ${money(venda.valorRecebido||0)}</div><div>Troco: ${money(venda.troco||0)}</div>`:''}<div class="line"></div><div class="center">${escapeHtml(db.data.config.rodapeCupom||'Obrigado pela preferência!')}<br><span class="muted">Documento sem valor fiscal</span></div><script>window.onload=()=>{window.print();setTimeout(()=>window.close(),600)}<\/script></body></html>`;
 const w=existingWindow||window.open('','_blank','width=420,height=700');if(!w)return toast('Permita pop-ups para imprimir o cupom.');w.document.open();w.document.write(html);w.document.close();
}


function openReceivePaymentModal(item){
 const cliente=db.data.clientes.find(c=>c.id===item.clienteId),root=$('#modalRoot');
 let selected='PIX';
 root.innerHTML=`<div class="modal-overlay"><div class="modal receive-modal"><div class="modal-header receive-header"><div><small>RECEBIMENTO</small><strong>Confirmar pagamento</strong></div><button class="icon-btn" data-close>&times;</button></div><div class="modal-body receive-body"><section class="receive-summary"><div class="receive-pet-icon">🐾</div><div><small>ATENDIMENTO</small><h3>${escapeHtml(item.pet||'Pet')}</h3><p>${escapeHtml(item.tutor||cliente?.nome||'Tutor')} · ${escapeHtml(item.servico||'Serviço')}</p><span>${escapeHtml(item.data||'')}</span></div><strong>${money(item.valor||0)}</strong></section><section class="receive-payment"><label>Forma de pagamento</label><div class="receive-methods" id="receiveMethods">${['PIX','Dinheiro','Cartão de débito','Cartão de crédito'].map((x,i)=>`<button type="button" data-receive-method="${x}" class="${i===0?'active':''}">${x==='PIX'?'▣':x==='Dinheiro'?'R$':'▤'}<span>${x}</span></button>`).join('')}</div><div id="receiveCashArea"></div></section><div class="receive-total"><span>Total a receber</span><strong id="receiveFinalTotal">${money(item.valor||0)}</strong></div></div><div class="modal-footer"><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="confirmReceive">Confirmar recebimento</button></div></div></div>`;
 const close=()=>root.innerHTML='';root.querySelectorAll('[data-close]').forEach(b=>b.onclick=close);
 function renderCash(){const area=$('#receiveCashArea');if(selected!=='Dinheiro'){area.innerHTML='<div class="receive-confirm-note">O pagamento será registrado na forma selecionada.</div>';return;}area.innerHTML=`<div class="receive-cash-grid"><div class="field"><label>Cliente pagou</label><input id="receivePaid" data-mask="money" inputmode="numeric" placeholder="R$ 0,00"></div><div class="receive-change" id="receiveChange"><small>Troco</small><strong>R$ 0,00</strong></div></div><div class="pdv-quick-cash">${[20,50,100,200].map(v=>`<button type="button" data-receive-cash="${v}">${money(v)}</button>`).join('')}<button type="button" data-receive-exact>Valor exato</button></div>`;applyInputMasks(area);const update=()=>{const total=Number(item.valor||0),paid=parseLocaleNumber($('#receivePaid').value),diff=paid-total;$('#receiveChange').innerHTML=diff<0?`<small>Ainda falta</small><strong class="pending">${money(Math.abs(diff))}</strong>`:`<small>Troco</small><strong>${money(diff)}</strong>`;};$('#receivePaid').oninput=update;area.querySelectorAll('[data-receive-cash]').forEach(b=>b.onclick=()=>{$('#receivePaid').value=money(Number(b.dataset.receiveCash));update();});area.querySelector('[data-receive-exact]').onclick=()=>{$('#receivePaid').value=money(Number(item.valor||0));update();};}
 $('#receiveMethods').querySelectorAll('[data-receive-method]').forEach(b=>b.onclick=()=>{selected=b.dataset.receiveMethod;document.querySelectorAll('[data-receive-method]').forEach(x=>x.classList.toggle('active',x===b));renderCash();});renderCash();
 $('#confirmReceive').onclick=()=>{const bruto=Number(item.valor||0);let valorRecebido=null,troco=0;if(selected==='Dinheiro'){valorRecebido=parseLocaleNumber($('#receivePaid')?.value);if(valorRecebido<bruto)return setModalError(`O valor recebido é insuficiente. Ainda faltam ${money(bruto-valorRecebido)}.`);troco=Math.max(0,valorRecebido-bruto);}item.status='pago';item.paidAt=new Date().toISOString();item.forma=selected;item.valorBruto=bruto;item.valorRecebido=valorRecebido;item.troco=troco;db.data.caixa.push({id:uid(),tipo:'entrada',data:today(),descricao:`Atendimento: ${item.servico} — ${item.pet}`,valor:bruto,valorBruto:bruto,forma:selected,valorRecebido,troco,pendenciaId:item.id});if(cliente&&hasFeature('fidelidade')){const pontos=Math.floor(bruto*Number(db.data.config.pontosPorReal||1));cliente.pontos=Number(cliente.pontos||0)+pontos;addLoyaltyHistory(cliente.id,'pontos_ganhos','Pontos do atendimento',pontos,{pendenciaId:item.id});}runPremiumAutomations();db.save();close();toast(selected==='Dinheiro'?`Pagamento recebido. Troco: ${money(troco)}.`:`Pagamento recebido: ${money(bruto)}.`);};
}
function getWeekBirthdays(days=7){
 const start=new Date();start.setHours(0,0,0,0);
 return db.data.pets.filter(p=>p.nascimento).map(p=>{
  const parts=p.nascimento.split('-').map(Number);if(parts.length!==3)return null;
  const [,month,day]=parts;
  let next=new Date(start.getFullYear(),month-1,day);next.setHours(0,0,0,0);
  if(next<start)next=new Date(start.getFullYear()+1,month-1,day);
  const diff=Math.round((next-start)/86400000);
  if(diff<0||diff>=days)return null;
  const tutor=db.data.clientes.find(c=>c.id===p.clienteId);
  return {...p,nextBirthday:next,daysUntil:diff,age:next.getFullYear()-parts[0],tutor};
 }).filter(Boolean).sort((a,b)=>a.daysUntil-b.daysUntil||a.nome.localeCompare(b.nome,'pt-BR',{sensitivity:'base'}));
}
function birthdayDayLabel(item){
 if(item.daysUntil===0)return 'Hoje';
 if(item.daysUntil===1)return 'Amanhã';
 return item.nextBirthday.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'}).replace('.','');
}
function birthdayPreview(){
 const items=getWeekBirthdays(7);
 if(!db.data.pets.some(p=>p.nascimento))return '<div class="empty">Cadastre a data de nascimento dos pets.</div>';
 if(!items.length)return '<div class="empty">Nenhum aniversário nos próximos 7 dias.</div>';
 return items.slice(0,4).map(p=>`<button class="birthday birthday-button" data-action="view-pet" data-id="${p.id}"><span><span class="mini-avatar">${p.especie==='Felino'?'🐱':'🐶'}</span><span><b>${p.nome}</b><small>${p.tutor?.nome||'Tutor não informado'}</small></span></span><span><b>${birthdayDayLabel(p)}</b><small>${p.age} ano${p.age===1?'':'s'}</small></span></button>`).join('');
}
function openBirthdayWeek(){
 const items=getWeekBirthdays(7);
 const body=!db.data.pets.some(p=>p.nascimento)?'<div class="empty">Nenhum pet possui data de nascimento cadastrada.</div>':!items.length?'<div class="empty">Nenhum aniversário nos próximos 7 dias.</div>':`<div class="birthday-modal-list">${items.map(p=>`<button class="birthday birthday-button" data-birthday-pet="${p.id}"><span><span class="mini-avatar">${p.especie==='Felino'?'🐱':'🐶'}</span><span><b>${p.nome}</b><small>Tutor: ${p.tutor?.nome||'Não informado'}</small></span></span><span><b>${birthdayDayLabel(p)}</b><small>${p.nextBirthday.toLocaleDateString('pt-BR')} · fará ${p.age} ano${p.age===1?'':'s'}</small></span></button>`).join('')}</div>`;
 modal('🎁 Aniversariantes da semana',body,close=>close(),'Fechar');
 setTimeout(()=>document.querySelectorAll('[data-birthday-pet]').forEach(btn=>btn.onclick=()=>{document.querySelector('#modalRoot').innerHTML='';actions['view-pet']({dataset:{id:btn.dataset.birthdayPet}});}),0);
}


function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function escapeAttr(v){return escapeHtml(v);}

function closeUserMenu(){document.querySelector('.user-dropdown')?.remove();}
function toggleUserMenu(){
 const existing=document.querySelector('.user-dropdown');if(existing){existing.remove();return;}
 const top=$('.top-user');if(!top)return;
 const c=db.data.config||{},name=c.nomeUsuario||'Amanda';
 const menu=document.createElement('div');menu.className='user-dropdown';
 const avatar=c.fotoUsuario?`<span class="menu-avatar has-photo"><img src="${c.fotoUsuario}" alt=""></span>`:`<span class="menu-avatar">${escapeHtml(name.trim().charAt(0).toUpperCase()||'A')}</span>`;
 menu.innerHTML=`<div class="user-dropdown-head">${avatar}<div><strong>${escapeHtml(name)}</strong><small>${escapeHtml(c.emailUsuario||'')}</small></div></div><button data-action="profile">👤 Meu perfil</button><button data-action="user-settings">⚙ Configurações</button><button data-action="change-password">🔒 Trocar senha</button><div class="user-dropdown-sep"></div><button class="danger-link" data-action="logout">↪ Sair do ForgePets</button>`;
 document.body.appendChild(menu);
 const r=top.getBoundingClientRect();menu.style.top=`${r.bottom+8}px`;menu.style.right=`${Math.max(16,window.innerWidth-r.right)}px`;
 setTimeout(()=>document.addEventListener('click',outsideUserMenu,{once:true}),0);
}
function outsideUserMenu(e){if(!e.target.closest('.user-dropdown')&&!e.target.closest('.top-user'))closeUserMenu();}
function openProfileModal(){
 closeUserMenu();const c=db.data.config||{},u=currentForgeUser||{},root=$('#modalRoot');
 const initials=(u.name||c.nomeUsuario||'Usuário').trim().charAt(0).toUpperCase()||'A';
 root.innerHTML=`<div class="modal-overlay"><div class="modal profile-modal"><div class="modal-header"><strong>Perfil do usuário</strong><button class="icon-btn" data-close>&times;</button></div><div class="modal-body"><div class="profile-avatar-row"><div class="profile-avatar" id="profileAvatar">${c.fotoUsuario?`<img src="${c.fotoUsuario}" alt="Foto do usuário">`:initials}</div><div><label class="btn ghost profile-upload">Alterar foto<input id="profilePhoto" type="file" accept="image/png,image/jpeg,image/webp" hidden></label><button type="button" class="link-btn profile-remove" id="removeProfilePhoto" ${c.fotoUsuario?'':'disabled'}>Remover foto</button><small>JPG, PNG ou WEBP. Máximo recomendado: 2 MB.</small></div></div><div class="form-grid"><div class="field"><label>Nome *</label><input id="profileName" value="${escapeAttr(u.name||c.nomeUsuario||'Usuário')}"></div><div class="field"><label>E-mail *</label><input id="profileEmail" type="email" value="${escapeAttr(u.email||c.emailUsuario||'')}"></div><div class="field"><label>Telefone</label><input id="profilePhone" data-mask="phone" inputmode="tel" maxlength="15" placeholder="(51) 99999-9999" value="${escapeAttr(c.telefoneUsuario||'')}"></div><div class="field"><label>Perfil</label><input value="${escapeAttr(userRoleLabel(u.role)||c.perfilUsuario||'Administrador')}" readonly></div><div class="field full"><label>Pet shop</label><input value="${escapeAttr(c.empresa||'Meu Pet Shop')}" readonly></div><div class="field"><label>Nova senha</label><input id="profilePassword" type="password" placeholder="Deixe em branco para manter"></div><div class="field"><label>Confirmar senha</label><input id="profilePasswordConfirm" type="password" placeholder="Repita a nova senha"></div></div></div><div class="modal-footer"><button class="btn ghost" data-close>Cancelar</button><button class="btn primary" id="profileSave">Salvar alterações</button></div></div></div>`;
 let pendingPhoto=c.fotoUsuario||'';
 root.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>root.innerHTML='');
 const phone=$('#profilePhone');phone.addEventListener('input',()=>phone.value=formatPhone(phone.value));
 $('#profilePhoto').onchange=e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>3*1024*1024){toast('A imagem deve ter no máximo 3 MB.');e.target.value='';return;}const reader=new FileReader();reader.onload=()=>{pendingPhoto=String(reader.result||'');$('#profileAvatar').innerHTML=`<img src="${pendingPhoto}" alt="Foto do usuário">`;$('#removeProfilePhoto').disabled=false;};reader.readAsDataURL(file);};
 $('#removeProfilePhoto').onclick=()=>{pendingPhoto='';$('#profileAvatar').textContent=($('#profileName').value.trim().charAt(0)||'A').toUpperCase();$('#removeProfilePhoto').disabled=true;};
 $('#profileSave').onclick=async()=>{const name=$('#profileName').value.trim(),email=$('#profileEmail').value.trim().toLowerCase(),pass=$('#profilePassword').value,confirm=$('#profilePasswordConfirm').value;if(!name)return setModalError('Informe o nome do usuário.');if(!isValidEmail(email))return setModalError('Informe um e-mail válido.');if(pass&&pass.length<6)return setModalError('A nova senha deve ter pelo menos 6 caracteres.');if(pass!==confirm)return setModalError('As senhas não coincidem.');try{const data=await cloud.request('/api/forge/me',{method:'PATCH',body:JSON.stringify({name,email,password:pass||undefined})});currentForgeUser=data.user;Object.assign(c,{nomeUsuario:data.user.name,emailUsuario:data.user.email,perfilUsuario:userRoleLabel(data.user.role),telefoneUsuario:phone.value,fotoUsuario:pendingPhoto});localStorage.setItem('vetcoreShopPro',JSON.stringify(db.data));applyBranding();root.innerHTML='';toast('Perfil atualizado com sucesso.');}catch(error){setModalError(error.message||'Não foi possível atualizar o perfil.');}};
}
function openPasswordModal(){closeUserMenu();modal('Trocar senha',`<div class="form-grid"><div class="field full"><label>Nova senha</label><input id="newUserPassword" type="password" placeholder="Mínimo de 6 caracteres"></div><div class="field full"><label>Confirmar nova senha</label><input id="confirmUserPassword" type="password" placeholder="Repita a nova senha"></div></div>`,close=>{const pass=$('#newUserPassword').value,confirm=$('#confirmUserPassword').value;if(pass.length<6)return toast('A senha deve ter pelo menos 6 caracteres.');if(pass!==confirm)return toast('As senhas não coincidem.');db.data.config.senhaUsuario=pass;db.save();close();toast('Senha alterada com sucesso.');},'Salvar nova senha');}
function formatPhone(value){const d=String(value||'').replace(/\D/g,'').slice(0,11);if(d.length<=2)return d;if(d.length<=6)return `(${d.slice(0,2)}) ${d.slice(2)}`;if(d.length<=10)return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;}
function isValidEmail(value){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);}
function applyBranding(){const c=db.data.config||{};document.documentElement.style.setProperty('--purple',c.corPrincipal||'#5b21d6');document.documentElement.style.setProperty('--orange',c.corDestaque||'#ff8a1f');const name=c.nomeUsuario||'Amanda',profile=c.perfilUsuario||'Administrador';const top=$('.top-user');if(top){const av=top.querySelector('.avatar');if(c.fotoUsuario){av.innerHTML=`<img src="${c.fotoUsuario}" alt="Foto de ${escapeAttr(name)}">`;av.classList.add('has-photo');}else{av.textContent=name.trim().charAt(0).toUpperCase()||'A';av.classList.remove('has-photo');}top.querySelector('strong').textContent=`Olá, ${name}`;top.querySelector('small').textContent=profile;}document.title=`${c.empresa||'ForgePets'} — ForgePets`;}
function bindSettingsUI(){document.querySelectorAll('[data-settings-tab]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('[data-settings-tab]').forEach(x=>x.classList.toggle('active',x===btn));document.querySelectorAll('[data-settings-panel]').forEach(x=>x.classList.toggle('active',x.dataset.settingsPanel===btn.dataset.settingsTab));});const input=$('#cfgLogoInput');if(input)input.onchange=e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>2*1024*1024){toast('A logo deve ter no máximo 2 MB.');return;}const reader=new FileReader();reader.onload=()=>{db.data.config.logo=reader.result;const preview=$('#companyLogoPreview');if(preview)preview.innerHTML=`<img src="${reader.result}">`;};reader.readAsDataURL(file);};const bi=$('#settingsBackupInput');if(bi)bi.onchange=importBackup;}

function balance(){return sumType('entrada')-sumType('saida')}function sumType(t){return db.data.caixa.filter(x=>x.tipo===t).reduce((s,x)=>s+Number(x.valor),0)}
function exportBackup(){const blob=new Blob([JSON.stringify(db.data,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`forgepets-backup-${today()}.json`;a.click();URL.revokeObjectURL(a.href);toast('Backup exportado.');}
function importBackup(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{db.data=JSON.parse(r.result);db.save();toast('Backup importado.');}catch{toast('Arquivo de backup inválido.')}};r.readAsText(f);e.target.value='';}
init();

/* Forge Connect - cliente */
(function(){
 const KEY='forgepets_connect_v1';
 const initial={messages:[{id:1,from:'support',text:'Olá! Bem-vindo ao Forge Connect. Como podemos ajudar?',date:new Date().toLocaleString('pt-BR')}],tickets:[],news:[{id:1,title:'ForgePets agora possui Forge Connect',text:'Converse com o suporte, acompanhe chamados e receba novidades sem sair do sistema.',date:new Date().toLocaleDateString('pt-BR')}],help:[{title:'Como cadastrar um cliente?',text:'Acesse Clientes e clique em Novo cliente. Depois, salve os dados do tutor.'},{title:'Como cadastrar um pet?',text:'Acesse Pets, clique em Novo pet e selecione o tutor responsável.'},{title:'Como imprimir um cupom?',text:'Em Nova venda, finalize a venda usando o botão Finalizar e imprimir.'},{title:'Como fazer backup?',text:'Use Exportar backup no rodapé do menu ou em Configurações.'}]};
 const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))||initial}catch{return initial}};
 const save=d=>localStorage.setItem(KEY,JSON.stringify(d));
 let tab='chat';
 const panel=document.getElementById('forgeConnectPanel'),overlay=document.getElementById('forgeConnectOverlay'),content=document.getElementById('forgeConnectContent');
 if(!panel)return;
 function open(){panel.classList.add('open');overlay.classList.add('open');panel.setAttribute('aria-hidden','false');document.getElementById('forgeConnectBadge').style.display='none';renderFC()}
 function close(){panel.classList.remove('open');overlay.classList.remove('open');panel.setAttribute('aria-hidden','true')}
 close();
 document.getElementById('forgeConnectButton').onclick=open;
 document.getElementById('forgeConnectClose').onclick=close;
 overlay.onclick=close;
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.classList.contains('open'))close();});
 document.querySelectorAll('[data-fc-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.fcTab;document.querySelectorAll('[data-fc-tab]').forEach(x=>x.classList.toggle('active',x===b));renderFC()});
 function renderFC(){const d=load();
  if(tab==='chat') content.innerHTML=`<div>${d.messages.map(m=>`<div class="fc-message ${m.from==='client'?'mine':''}">${escapeHtml(m.text)}<small>${m.date}</small></div>`).join('')}</div><form id="fcChatForm" class="fc-compose"><input id="fcChatInput" placeholder="Digite sua mensagem..." autocomplete="off"><button>Enviar</button></form>`;
  if(tab==='ticket') content.innerHTML=`<div class="fc-card"><h4>Seus chamados</h4>${d.tickets.length?d.tickets.map(t=>`<div style="padding:10px 0;border-bottom:1px solid #eee"><b>${escapeHtml(t.subject)}</b><p>${escapeHtml(t.category)} · ${escapeHtml(t.priority)}</p><span class="fc-status">${escapeHtml(t.status)}</span></div>`).join(''):'<p>Nenhum chamado aberto.</p>'}</div><form id="fcTicketForm" class="fc-form"><label>Categoria<select id="fcCategory"><option>Dúvida</option><option>Erro</option><option>Financeiro</option><option>Sugestão</option><option>Comercial</option></select></label><label>Prioridade<select id="fcPriority"><option>Baixa</option><option selected>Média</option><option>Alta</option><option>Urgente</option></select></label><label>Assunto<input id="fcSubject" required></label><label>Descrição<textarea id="fcDescription" required></textarea></label><button class="fc-primary">Abrir chamado</button></form>`;
  if(tab==='news') content.innerHTML=d.news.map(n=>`<div class="fc-card"><small>${n.date}</small><h4>${escapeHtml(n.title)}</h4><p>${escapeHtml(n.text)}</p></div>`).join('')||'<div class="fc-empty">Nenhuma novidade.</div>';
  if(tab==='help') content.innerHTML=`<div class="fc-help-search"><input id="fcHelpSearch" placeholder="Buscar uma dúvida..."><button>⌕</button></div><div id="fcHelpList">${d.help.map(h=>`<div class="fc-card"><h4>${escapeHtml(h.title)}</h4><p>${escapeHtml(h.text)}</p></div>`).join('')}</div><div class="fc-card"><h4>Precisa de atendimento humano?</h4><p>Abra um chamado ou envie uma mensagem pela aba Conversas.</p></div>`;
  bindFC(d)
 }
 function bindFC(d){
  const chat=document.getElementById('fcChatForm');if(chat)chat.onsubmit=e=>{e.preventDefault();const i=document.getElementById('fcChatInput');if(!i.value.trim())return;d.messages.push({id:Date.now(),from:'client',text:i.value.trim(),date:new Date().toLocaleString('pt-BR')});save(d);renderFC()};
  const ticket=document.getElementById('fcTicketForm');if(ticket)ticket.onsubmit=e=>{e.preventDefault();d.tickets.unshift({id:Date.now(),category:document.getElementById('fcCategory').value,priority:document.getElementById('fcPriority').value,subject:document.getElementById('fcSubject').value,description:document.getElementById('fcDescription').value,status:'Aberto',date:new Date().toLocaleString('pt-BR')});save(d);tab='ticket';renderFC();toast('Chamado aberto com sucesso.')};
  const hs=document.getElementById('fcHelpSearch');if(hs)hs.oninput=e=>{const q=e.target.value.toLowerCase();document.getElementById('fcHelpList').innerHTML=d.help.filter(h=>(h.title+' '+h.text).toLowerCase().includes(q)).map(h=>`<div class="fc-card"><h4>${escapeHtml(h.title)}</h4><p>${escapeHtml(h.text)}</p></div>`).join('')||'<div class="fc-empty">Nenhum conteúdo encontrado.</div>'};
 }
 window.openForgeConnect=open;window.closeForgeConnect=close;
})();
