(() => {
  const dialog = document.getElementById('apply-dialog');
  const details = document.getElementById('applicant-form');
  const checkout = document.getElementById('checkout-form');
  const receipt = document.getElementById('application-receipt');
  const error = document.getElementById('enrollment-error');
  let busy = false, complete = false, requestId = crypto.randomUUID();
  function step(number) {
    details.hidden = number !== 1; checkout.hidden = number !== 2; receipt.hidden = number !== 3;
    document.querySelectorAll('.enroll-steps li').forEach((item, i) => i === number - 1 ? item.setAttribute('aria-current','step') : item.removeAttribute('aria-current'));
    document.getElementById('dialog-title').textContent = ['특강 신청하기','결제수단 선택','신청이 접수되었습니다'][number - 1];
    error.textContent = ''; dialog.scrollTop = 0;
    (number === 1 ? details.elements.name : number === 2 ? checkout.elements.payment_method[0] : document.getElementById('receipt-close')).focus();
  }
  document.querySelectorAll('[data-apply]').forEach(button => button.addEventListener('click', () => {
    if (complete) { details.reset(); checkout.reset(); complete = false; requestId = crypto.randomUUID(); }
    dialog.showModal(); step(1);
  }));
  document.querySelectorAll('.dialog-close,#receipt-close').forEach(button => button.addEventListener('click', () => { if (!busy) dialog.close(); }));
  dialog.addEventListener('cancel', event => { if (busy) event.preventDefault(); });
  document.getElementById('checkout-back').addEventListener('click', () => { if (!busy) step(1); });
  details.addEventListener('submit', event => {
    event.preventDefault();
    const phone = details.elements.phone.value.replace(/[^0-9+]/g,'');
    if (!/^\+?[0-9]{9,15}$/.test(phone)) { error.textContent = '연락처를 정확하게 입력해 주세요.'; details.elements.phone.focus(); return; }
    document.getElementById('checkout-applicant').textContent = `${details.elements.name.value.trim()} · ${details.elements.email.value.trim()}`;
    step(2);
  });
  checkout.addEventListener('submit', async event => {
    event.preventDefault(); if (busy) return;
    const data = new FormData(details), payment = new FormData(checkout);
    if (!details.checkValidity() || !checkout.checkValidity()) return;
    busy = true; error.textContent = '';
    const submit = document.getElementById('submit-application');
    dialog.querySelectorAll('button').forEach(button => button.disabled = true);
    submit.textContent = '신청 내역 저장 중…';
    try {
      const id = await topzoneApi('/rest/v1/rpc/submit_topzone_application', {method:'POST',body:{
        p_request_id:requestId,p_name:data.get('name').trim(),p_email:data.get('email').trim().toLowerCase(),
        p_phone:data.get('phone').replace(/[^0-9+]/g,''),p_payment_method:payment.get('payment_method'),
        p_privacy_consent:payment.get('privacy') === 'on',p_simulation_consent:payment.get('simulation') === 'on'
      }});
      if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error('접수 결과를 확인하지 못했습니다. 다시 시도해 주세요.');
      complete = true; document.getElementById('receipt-id').textContent = id;
      document.getElementById('receipt-name').textContent = `${data.get('name').trim()}님의 신청을 저장했습니다.`;
      step(3);
    } catch (err) {
      error.textContent = err.code === '23505' ? '이 이메일로 이미 접수된 신청이 있습니다. 변경이나 취소는 운영자에게 문의해 주세요.' : err.status === 400 ? '입력 정보와 필수 동의를 확인해 주세요.' : err.message;
    } finally {
      busy = false; dialog.querySelectorAll('button').forEach(button => button.disabled = false);
      submit.textContent = '동의하고 신청 완료 · 실제 청구 없음';
      if (complete) document.getElementById('receipt-close').focus();
    }
  });
})();
