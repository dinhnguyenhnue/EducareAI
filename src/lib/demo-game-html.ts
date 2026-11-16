import type { DemoQuestion } from "./grade6-demo";
export function createDemoGame(title: string, questions: DemoQuestion[]): string {
  const data = JSON.stringify({ title, questions }).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Trò chơi ôn tập</title>
<style>body{font:18px system-ui;background:#eff6ff;color:#172554;margin:0;padding:24px}main{max-width:700px;margin:auto}button{font:inherit;padding:14px;margin:6px 0;border:2px solid #2563eb;border-radius:12px;background:white;color:#172554;cursor:pointer;display:block;width:100%;text-align:left}button:focus-visible{outline:4px solid #f59e0b}button:disabled{opacity:.6;cursor:default}#feedback{min-height:60px;line-height:1.6}#next{background:#2563eb;color:white}h1{font-size:28px}progress{width:100%}</style>
<main><h1 id="title"></h1><p>Chọn một đáp án mỗi câu. Mỗi câu đúng được 1 điểm. Đọc giải thích rồi sang câu tiếp theo.</p><p>Demo luyện tập — không ghi vào điểm chính thức.</p><progress id="progress"></progress><h2 id="question"></h2><div id="options"></div><p id="feedback" role="status" aria-live="polite"></p><button id="next">Bắt đầu</button></main>
<script>const data=${data};let index=-1,score=0,answered=false;
const el=id=>document.getElementById(id);el('title').textContent=data.title;el('progress').max=data.questions.length;el('progress').value=0;
function show(){answered=false;el('options').replaceChildren();el('feedback').textContent='';el('progress').value=index;
if(index>=data.questions.length){el('question').textContent='Hoàn thành: '+score+'/'+data.questions.length+' điểm';el('next').textContent='Chơi lại';el('next').disabled=false;return;}
const q=data.questions[index];el('question').textContent=(index+1)+'. '+q.question;el('next').textContent='Câu tiếp theo';el('next').disabled=true;
q.options.forEach((option,i)=>{const b=document.createElement('button');b.textContent=String.fromCharCode(65+i)+'. '+option;b.onclick=()=>{if(answered)return;answered=true;if(i===q.answer)score++;el('feedback').textContent=(i===q.answer?'Đúng! ':'Chưa đúng. Đáp án: '+q.options[q.answer]+'. ')+q.explanation;Array.from(el('options').children).forEach(x=>x.disabled=true);el('next').disabled=false;};el('options').append(b);});}
el('next').onclick=()=>{if(index>=data.questions.length){index=0;score=0;}else index++;show();};</script></html>`;
}
