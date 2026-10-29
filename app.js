const dialog = document.getElementById('apply-dialog');
document.querySelectorAll('[data-apply]').forEach(button => button.addEventListener('click',()=>dialog.showModal()));
document.querySelectorAll('.dialog-close,.dialog-confirm').forEach(button => button.addEventListener('click',()=>dialog.close()));
dialog.addEventListener('click',event=>{const bounds=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom))dialog.close();});
document.getElementById('calendar').addEventListener('click',()=>{
  const content = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//TOPZONE//Special Class//KO','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:topzone-20261029-jangyun@topzone.local','DTSTAMP:20261029T000000Z','DTSTART:20261029T110000Z','SUMMARY:아카데미쿠스 수상을 위한 시나리오 분석 및 컨설팅 실습','DESCRIPTION:강사: 탑존 38기 장윤\\n대상: 탑존 41기\\n강의료: 100만원\\n시작: 2026년 10월 29일 20:00 (한국시간)\\n종료 시간 및 장소는 추후 안내. 일정 저장은 수강 신청이 아닙니다.','END:VEVENT','END:VCALENDAR',''].join('\r\n');
  const url=URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='탑존_아카데미쿠스_특강_20261029.ics';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
  document.getElementById('status').textContent='캘린더 일정 파일을 내려받았습니다. 일정 저장은 수강 신청이 아닙니다.';
});
