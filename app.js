const glyphs = {
  S:['11111','10000','10000','11111','00001','00001','11111'],
  C:['01111','10000','10000','10000','10000','10000','01111'],
  E:['11111','10000','10000','11110','10000','10000','11111'],
  N:['10001','11001','11001','10101','10011','10011','10001'],
  A:['01110','10001','10001','11111','10001','10001','10001'],
  R:['11110','10001','10001','11110','10100','10010','10001'],
  I:['11111','00100','00100','00100','00100','00100','11111'],
  O:['01110','10001','10001','10001','10001','10001','01110']
};
const svgNS = 'http://www.w3.org/2000/svg';
const svg = document.createElementNS(svgNS,'svg');
svg.setAttribute('viewBox','0 0 470 70');
for (const [letterIndex,letter] of [...'SCENARIO'].entries()) {
  glyphs[letter].forEach((row,y) => [...row].forEach((pixel,x) => {
    if(pixel !== '1') return;
    const rect = document.createElementNS(svgNS,'rect');
    Object.entries({x:letterIndex*60+x*10,y:y*10,width:9.65,height:9.65,fill:['#ffa17f','#ff9a76','#ff946f','#f58b66','#ee805b','#e97753','#dd704e'][y]}).forEach(([key,value])=>rect.setAttribute(key,String(value)));
    svg.append(rect);
  }));
}
document.getElementById('pixel-title').append(svg);
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
