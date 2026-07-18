export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/score' && request.method === 'POST') {
      try {
        const body = await request.json();
        const paragraph = body.paragraph;

        if (!paragraph || typeof paragraph !== 'string' || paragraph.trim().length < 10) {
          return Response.json({ error: 'Please enter a paragraph (at least 10 characters).' }, { status: 400 });
        }

        const promptText = 'You are an expert evaluator. Score the following paragraph out of 100 for each of these four criteria: Clarity, Truthfulness, Forward Thinking, and Practicality.\n\nReturn ONLY a valid JSON object with no markdown, no code blocks, no extra text. Use this exact format:\n{"clarity": <number 0-100>, "truthfulness": <number 0-100>, "forward_thinking": <number 0-100>, "practicality": <number 0-100>, "overall": <number 0-100>, "feedback": "<one sentence>"}\n\nParagraph to evaluate:\n' + paragraph;

        let scores = null;
        let lastDebug = '';

        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const aiResponse = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
              prompt: promptText,
              max_tokens: 512,
              temperature: 0.3
            });

            let rawText = '';
            if (typeof aiResponse === 'string') {
              rawText = aiResponse;
            } else if (aiResponse && typeof aiResponse.response === 'string') {
              rawText = aiResponse.response;
            } else if (aiResponse) {
              rawText = JSON.stringify(aiResponse);
            }

            lastDebug = rawText.substring(0, 500);

            if (!rawText || rawText.trim() === '') {
              lastDebug = 'Empty response from AI';
              continue;
            }

            let cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

            try {
              scores = JSON.parse(cleaned);
              break;
            } catch (e1) {
              const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  scores = JSON.parse(jsonMatch[0]);
                  break;
                } catch (e2) {
                  lastDebug = 'JSON match failed: ' + jsonMatch[0].substring(0, 200);
                }
              } else {
                lastDebug = 'No JSON found in: ' + cleaned.substring(0, 200);
              }
            }
          } catch (aiErr) {
            lastDebug = 'AI.run error: ' + String(aiErr.message || aiErr);
          }
        }

        if (!scores) {
          return Response.json({ error: 'Could not parse AI response. Please try again.', debug: lastDebug }, { status: 502 });
        }

        const clamp = (v) => Math.max(0, Math.min(100, Number(v) || 0));
        scores.clarity = clamp(scores.clarity);
        scores.truthfulness = clamp(scores.truthfulness);
        scores.forward_thinking = clamp(scores.forward_thinking);
        scores.practicality = clamp(scores.practicality);
        scores.overall = clamp(scores.overall);
        if (typeof scores.feedback !== 'string') scores.feedback = String(scores.feedback || '');

        return Response.json({ scores });
      } catch (err) {
        return Response.json({ error: 'Internal error: ' + String(err.message || err) }, { status: 500 });
      }
    }

    return new Response(HTML, { headers: { 'Content-Type': 'text/html' } });
  }
};

const HTML = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Paragraph Scorer</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#0f0f1a;color:#e0e0e0;min-height:100vh;display:flex;justify-content:center;align-items:center;padding:20px}.container{max-width:700px;width:100%}h1{text-align:center;margin-bottom:8px;font-size:1.8rem;background:linear-gradient(135deg,#f6821f,#faad3f);-webkit-background-clip:text;-webkit-text-fill-color:transparent}.subtitle{text-align:center;color:#888;margin-bottom:24px;font-size:.9rem}textarea{width:100%;height:150px;background:#1a1a2e;border:1px solid #333;border-radius:12px;padding:16px;color:#e0e0e0;font-size:1rem;resize:vertical;outline:none;transition:border-color .2s}textarea:focus{border-color:#f6821f}button{width:100%;margin-top:16px;padding:14px;background:linear-gradient(135deg,#f6821f,#faad3f);border:none;border-radius:12px;color:#fff;font-size:1rem;font-weight:600;cursor:pointer;transition:opacity .2s}button:hover{opacity:.9}button:disabled{opacity:.5;cursor:not-allowed}.results{margin-top:24px;display:none}.score-row{display:flex;align-items:center;margin-bottom:14px}.score-label{width:160px;font-size:.9rem;font-weight:500}.score-bar-container{flex:1;height:24px;background:#1a1a2e;border-radius:12px;overflow:hidden;position:relative}.score-bar{height:100%;border-radius:12px;transition:width .8s ease;display:flex;align-items:center;justify-content:flex-end;padding-right:8px;font-size:.8rem;font-weight:700;color:#fff}.overall{text-align:center;margin-top:20px;font-size:2.5rem;font-weight:700}.feedback{text-align:center;margin-top:8px;color:#aaa;font-size:.9rem;font-style:italic}.error{margin-top:16px;padding:12px 16px;background:#2a1517;border:1px solid #5c2a2e;border-radius:8px;color:#ff6b6b;font-size:.9rem;display:none}.loading{text-align:center;margin-top:20px;color:#888;display:none}.spinner{display:inline-block;width:20px;height:20px;border:2px solid #333;border-top-color:#f6821f;border-radius:50%;animation:spin .8s linear infinite;margin-right:8px;vertical-align:middle}@keyframes spin{to{transform:rotate(360deg)}}</style></head><body><div class="container"><h1>📊 Paragraph Scorer</h1><p class="subtitle">AI-powered scores for Clarity, Truthfulness, Forward Thinking &amp; Practicality</p><textarea id="paragraph" placeholder="Type or paste a paragraph here..."></textarea><button id="submit" onclick="scoreParagraph()">Score My Paragraph</button><div class="loading" id="loading"><span class="spinner"></span> Analyzing your paragraph...</div><div class="error" id="error"></div><div class="results" id="results"><div id="scores"></div><div class="overall" id="overall"></div><div class="feedback" id="feedback"></div></div></div><script>function colorForScore(s){if(s>=80)return"#22c55e";if(s>=60)return"#eab308";if(s>=40)return"#f97316";return"#ef4444"}async function scoreParagraph(){const p=document.getElementById("paragraph").value;const loading=document.getElementById("loading");const err=document.getElementById("error");const res=document.getElementById("results");const btn=document.getElementById("submit");err.style.display="none";res.style.display="none";if(!p||p.trim().length<10){err.textContent="⚠️ Please enter a paragraph (at least 10 characters).";err.style.display="block";return}btn.disabled=true;loading.style.display="block";try{const r=await fetch("/score",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({paragraph:p})});const d=await r.json();if(d.error){err.textContent="⚠️ "+d.error;err.style.display="block";return}const s=d.scores;const c=[{k:"clarity",l:"Clarity"},{k:"truthfulness",l:"Truthfulness"},{k:"forward_thinking",l:"Forward Thinking"},{k:"practicality",l:"Practicality"}];let h="";for(const i of c){const v=Number(s[i.k])||0;h+=\'<div class="score-row"><div class="score-label">\'+i.l+\'</div><div class="score-bar-container"><div class="score-bar" style="width:\'+v+\'%;background:\'+colorForScore(v)+\'">\'+v+\'/100</div></div></div>\'}document.getElementById("scores").innerHTML=h;const o=Number(s.overall)||0;document.getElementById("overall").textContent=o+"/100";document.getElementById("overall").style.color=colorForScore(o);document.getElementById("feedback").textContent=\'"\'+(s.feedback||"")+\'"\';res.style.display="block"}catch(e){err.textContent="⚠️ "+String(e.message||e);err.style.display="block"}finally{btn.disabled=false;loading.style.display="none"}}</script></body></html>';

}
