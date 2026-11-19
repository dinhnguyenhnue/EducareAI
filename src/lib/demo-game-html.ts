import type { DemoQuestion } from "./grade6-demo";

export function createDemoGame(title: string, questions: DemoQuestion[]): string {
  const data = JSON.stringify({ title, questions }).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Trò chơi ôn tập EDUCARE AI</title>
<style>
  :root{--ocean-50:#f0f9ff;--ocean-100:#e0f2fe;--ocean-600:#0284c7;--ocean-700:#0369a1;--ink:#0f172a;--muted:#475569;--surface:#ffffff;--border:#cbd5e1}
  *{box-sizing:border-box}
  body{font:16px/1.6 system-ui,-apple-system,sans-serif;background:var(--ocean-50);color:var(--ink);margin:0;padding:16px}
  main{max-width:760px;margin:0 auto;background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:20px 24px;box-shadow:0 10px 25px -5px rgba(15,23,42,.06)}
  .badge{display:inline-block;font-size:12px;font-weight:700;background:var(--ocean-100);color:var(--ocean-700);padding:4px 12px;border-radius:999px;margin-bottom:8px}
  h1{font-size:clamp(20px,3vw,26px);margin:4px 0 8px;color:var(--ink)}
  h2{font-size:clamp(17px,2.4vw,21px);margin:14px 0;color:var(--ink);line-height:1.45}
  .meta{font-size:14px;color:var(--muted);margin:0 0 12px}
  progress{width:100%;height:10px;border-radius:999px;margin:8px 0}
  button{font:inherit;min-height:48px;padding:12px 16px;margin:8px 0;border:2px solid var(--border);border-radius:14px;background:var(--surface);color:var(--ink);cursor:pointer;display:block;width:100%;text-align:left;font-weight:600;transition:background-color .15s,border-color .15s}
  button:hover:not(:disabled){border-color:var(--ocean-600);background:var(--ocean-50)}
  button:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}
  button:disabled{opacity:.75;cursor:default}
  #feedback{min-height:56px;padding:12px 14px;border-radius:12px;background:#f8fafc;border:1px solid var(--border);font-size:15px;margin:12px 0}
  #next{background:var(--ocean-600);border-color:var(--ocean-600);color:#fff;text-align:center;font-weight:700}
  #next:hover:not(:disabled){background:var(--ocean-700)}
  @media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>
<main>
  <span class="badge">Tự luyện tương tác • Chuẩn Ocean Blue</span>
  <h1 id="title"></h1>
  <p class="meta">Mục tiêu: Chọn đáp án đúng cho từng câu hỏi và đọc giải thích kiến thức SGK. Điểm tự luyện không thay thế điểm kiểm tra chính thức.</p>
  <progress id="progress"></progress>
  <h2 id="question">Nhấn "Bắt đầu" bên dưới để mở câu hỏi đầu tiên.</h2>
  <div id="options"></div>
  <p id="feedback" role="status" aria-live="polite"></p>
  <button id="next">Bắt đầu</button>
</main>
<script>const data=${data};let index=-1,score=0,answered=false;
const el=id=>document.getElementById(id);el('title').textContent=data.title;el('progress').max=data.questions.length;el('progress').value=0;
function show(){answered=false;el('options').replaceChildren();el('feedback').textContent='';el('progress').value=index;
if(index>=data.questions.length){el('question').textContent='Hoàn thành: '+score+'/'+data.questions.length+' điểm';el('next').textContent='Chơi lại';el('next').disabled=false;try{if(typeof window!=='undefined'&&window.parent){window.parent.postMessage({type:'TIN_HOC_GAME_PRACTICE_COMPLETE',score:score,maxScore:data.questions.length,wrongTopics:[]},'*');}}catch(e){}return;}
const q=data.questions[index];el('question').textContent='Câu '+(index+1)+'/'+data.questions.length+': '+q.question;el('next').textContent='Câu tiếp theo';el('next').disabled=true;
q.options.forEach((option,i)=>{const b=document.createElement('button');b.textContent=String.fromCharCode(65+i)+'. '+option;b.onclick=()=>{if(answered)return;answered=true;if(i===q.answer)score++;el('feedback').textContent=(i===q.answer?'Đúng! ':'Chưa đúng. Đáp án: '+q.options[q.answer]+'. ')+q.explanation;Array.from(el('options').children).forEach(x=>x.disabled=true);el('next').disabled=false;};el('options').append(b);});}
el('next').onclick=()=>{if(index>=data.questions.length){index=0;score=0;}else index++;show();};</script></html>`;
}
