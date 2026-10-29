(() => {
  const $ = id => document.getElementById(id);
  const statuses = {received:'접수',confirmed:'확인 완료',cancelled:'취소'};
  const methods = {card:'신용·체크카드',bank:'계좌이체',kakaopay:'카카오페이',naverpay:'네이버페이'};
  let token = null, expiresAt = 0, page = 0, rows = [], selected = null, loading = false;
  const formatDate = value => new Date(value).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
  function clearSession() {token=null;expiresAt=0;rows=[];selected=null;$('application-rows').replaceChildren();$('detail-info').replaceChildren();$('detail-form').reset();$('detail-dialog').close();$('dashboard').hidden=true;$('login-panel').hidden=false;}
  async function api(path, options={}) {
    if (!token || Date.now() >= expiresAt) {clearSession();throw new Error('로그인 시간이 만료되었습니다. 다시 로그인해 주세요.');}
    try {return await topzoneApi(path,{...options,token});} catch(err) {if(err.status===401){clearSession();$('login-error').textContent='로그인 시간이 만료되었습니다.';}throw err;}
  }
  $('admin-login-form').addEventListener('submit', async event => {
    event.preventDefault();const form=event.currentTarget, button=form.querySelector('button');button.disabled=true;$('login-error').textContent='';$('login-notice').textContent='';
    try {
      await topzoneApi('/auth/v1/otp?redirect_to='+encodeURIComponent('https://jangdaam.github.io/topzone-academicus/admin.html'),{method:'POST',body:{email:form.elements.email.value.trim(),create_user:true}});
      $('login-notice').textContent='로그인 링크를 요청했습니다. 메일함에서 링크를 열어 주세요. 등록된 관리자 이메일만 신청 내역에 접근할 수 있습니다.';
    } catch(err){$('login-error').textContent=err.status===429?'요청이 많습니다. 잠시 후 다시 시도해 주세요.':err.message;} finally{button.disabled=false;}
  });
  async function finishLogin() {
    const hash=new URLSearchParams(location.hash.slice(1));
    if(!hash.has('access_token')&&!hash.has('error_description'))return;
    history.replaceState(null,'',location.pathname+location.search);
    if(hash.has('error_description')){$('login-error').textContent='로그인 링크가 만료되었거나 유효하지 않습니다. 새 링크를 요청해 주세요.';return;}
    token=hash.get('access_token');expiresAt=Date.now()+Math.min(Number(hash.get('expires_in'))||3600,3600)*1000;
    try{const allowed=await api('/rest/v1/rpc/is_topzone_admin',{method:'POST',body:{}});
      if(allowed!==true){await topzoneApi('/auth/v1/logout',{method:'POST',token}).catch(()=>{});clearSession();throw new Error('관리 권한이 등록되지 않은 계정입니다.');}
      $('login-panel').hidden=true;$('dashboard').hidden=false;page=0;await load();
    }catch(err){clearSession();$('login-error').textContent=err.message;}
  }
  $('admin-logout').addEventListener('click',async()=>{const oldToken=token;clearSession();if(oldToken)await topzoneApi('/auth/v1/logout',{method:'POST',token:oldToken}).catch(()=>{});});
  function cell(text, small) {const td=document.createElement('td');td.textContent=text;if(small){const sub=document.createElement('small');sub.textContent=small;td.append(sub);}return td;}
  function render() {
    const body=$('application-rows');body.replaceChildren();
    for(const row of rows){const tr=document.createElement('tr');tr.append(cell(formatDate(row.created_at)),cell(row.name,row.email),cell(row.phone,row.cohort),cell(methods[row.payment_method],'모의 결제 · 청구 0원'),cell(statuses[row.status]));const td=document.createElement('td'),button=document.createElement('button');button.textContent='상세 관리';button.addEventListener('click',()=>openDetail(row));td.append(button);tr.append(td);body.append(tr);}
    if(!rows.length){const tr=document.createElement('tr'),td=cell('신청 내역이 없습니다.');td.colSpan=6;td.className='admin-empty';tr.append(td);body.append(tr);}
    $('previous-page').disabled=page===0;$('next-page').disabled=rows.length<50;$('page-number').textContent=`${page+1} 페이지`;
  }
  async function load() {
    if(loading)return;loading=true;$('list-message').textContent='신청 내역을 불러오는 중입니다…';$('export-csv').disabled=true;
    try {const params=new URLSearchParams({select:'*',order:'created_at.desc,id.desc',limit:'50',offset:String(page*50)});const status=$('status-filter').value;if(status)params.set('status','eq.'+status);
      const query=$('search-query').value.trim().replace(/[^\p{L}\p{N}@._+ -]/gu,'').slice(0,80).replace(/_/g,'\\_');if(query)params.set('or',`(name.ilike.*${query}*,email.ilike.*${query}*)`);
      rows=await api('/rest/v1/topzone_applications?'+params);render();$('list-message').textContent=`현재 페이지 ${rows.length}건 · 한국시간 기준`; 
    }catch(err){rows=[];render();$('list-message').textContent=err.message;}finally{loading=false;$('export-csv').disabled=false;}
  }
  function openDetail(row){selected=row;$('detail-info').replaceChildren();for(const [label,value]of[['접수번호',row.id],['신청자',row.name],['이메일',row.email],['연락처',row.phone],['대상',row.cohort],['신청일시',formatDate(row.created_at)],['동의일시',formatDate(row.consent_at)],['동의문 버전',row.privacy_version],['결제수단',methods[row.payment_method]],['결제 상태','모의 결제 · 실제 청구 0원']]){const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;div.append(dt,dd);$('detail-info').append(div);}$('detail-form').elements.status.value=row.status;$('detail-form').elements.note.value=row.admin_note;$('detail-error').textContent='';$('detail-dialog').showModal();}
  $('close-detail').addEventListener('click',()=>$('detail-dialog').close());
  $('detail-form').addEventListener('submit',async event=>{event.preventDefault();if(!selected)return;const button=event.currentTarget.querySelector('button');button.disabled=true;$('detail-error').textContent='';try{await api('/rest/v1/rpc/update_topzone_application',{method:'POST',body:{p_id:selected.id,p_status:event.currentTarget.elements.status.value,p_note:event.currentTarget.elements.note.value,p_updated_at:selected.updated_at}});$('detail-dialog').close();await load();}catch(err){$('detail-error').textContent=err.code==='40001'?'다른 곳에서 변경된 내역입니다. 닫은 후 새로고침하고 다시 확인해 주세요.':err.message;}finally{button.disabled=false;}});
  $('delete-application').addEventListener('click',async()=>{if(!selected||!confirm('이 신청과 개인정보를 영구 삭제합니다. 되돌릴 수 없습니다. 삭제하시겠습니까?'))return;const button=$('delete-application');button.disabled=true;try{await api('/rest/v1/rpc/delete_topzone_application',{method:'POST',body:{p_id:selected.id}});$('detail-dialog').close();await load();}catch(err){$('detail-error').textContent=err.message;}finally{button.disabled=false;}});
  $('admin-search').addEventListener('submit',event=>{event.preventDefault();page=0;load();});$('refresh-list').addEventListener('click',load);$('previous-page').addEventListener('click',()=>{if(!loading&&page>0){page--;load();}});$('next-page').addEventListener('click',()=>{if(!loading&&rows.length===50){page++;load();}});
  $('export-csv').addEventListener('click',()=>{if(!rows.length)return;const safe=value=>'"'+String(/^[=+@\-\t\r\n]/.test(String(value))?"'"+value:value).replace(/"/g,'""')+'"';const table=[['접수번호','신청일시','이름','이메일','연락처','상태','결제수단','결제 상태','관리자 메모'],...rows.map(r=>[r.id,formatDate(r.created_at),r.name,r.email,r.phone,statuses[r.status],methods[r.payment_method],'모의 결제 / 청구 0원',r.admin_note])];const url=URL.createObjectURL(new Blob(['\ufeff'+table.map(r=>r.map(safe).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=`topzone-applications-page-${page+1}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(url),3000);});
  setInterval(()=>{if(token&&Date.now()>=expiresAt){clearSession();$('login-error').textContent='로그인 시간이 만료되었습니다.';}},15000);
  finishLogin();
})();
