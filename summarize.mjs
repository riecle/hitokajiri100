// ひとかじり — 日次バッチ：Wikipedia ランダム取得 → Gemini が v3 で要約 → cards.json
// 実行は GitHub Actions（毎朝）。GEMINI_API_KEY は Actions Secret から渡る。
import { writeFile } from 'node:fs/promises';

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error('✗ GEMINI_API_KEY が未設定（Actions Secret に入れる）'); process.exit(1); }

// 無料枠で使える Flash。質を上げたければ 'gemini-3-flash' / 'gemini-3.5-flash' に変更可
// （AI Studio で現行の正確なモデル名を確認。エラーが出たらここを直す）
const MODEL = 'gemini-2.5-flash';
const TARGET = 100;     // 1日に作る枚数
const BATCH  = 10;      // Gemini 1コールあたりの記事数
const MIN_CHARS = 80;   // これ未満の薄いstubは捨てる（ソース選別）

const V3 = `あなたは「ひとかじり」の要約担当。目的は覚えさせることではなく「聞いたことある／この概念知ってる」という"記憶に残る"状態を作ること（単純接触）。
渡された複数のWikipedia記事それぞれを、下の【要約契約v3】に厳密に従って1枚のカードにする。

【要約契約v3】
1. 説明するな、翻訳しろ。読み手が既に知っているもの・身近なものに置き換え「何の仲間か」「日常の何に似てるか」を必ず入れる。
2. 各カードに必ず1つフック：驚き / 感情 / 好奇心(なんで?) / 小さなエピソード のどれか。当たり前すぎもNG（記憶に残らない）。
3. 推定しやすい専門語はそのまま使ってよいが、カッコで一言そえる（例：ポイントガード(司令塔)）。推定しにくい語は身近な言葉に言い換える。
4. 固有名詞・難読語には必ず読み仮名を振り、reading に入れる。
5. 中学生が知らない語を、別の専門語で説明しない。
6. 事実をでっち上げない。記事の事実と一般常識だけ。情報が薄く面白くできなければ無理に盛らず簡潔に。

各記事につき {"term":見出し語, "reading":ふりがな(不要なら""), "line":"＝以降の本文。1〜2文"} を作り、JSON配列だけで返す。`;

async function fetchRandom(n) {
  const out = [], seen = new Set();
  let guard = 0;
  while (out.length < n && guard < 40) {
    guard++;
    const url = 'https://ja.wikipedia.org/w/api.php?action=query&format=json'
      + '&generator=random&grnnamespace=0&grnlimit=10'
      + '&prop=extracts&exintro&explaintext&exlimit=max&redirects=1';
    let data;
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'hitokajiri/0.1 (daily vocab booster)' } });
      data = await r.json();
    } catch (e) { continue; }
    const pages = data && data.query && data.query.pages ? Object.values(data.query.pages) : [];
    for (const p of pages) {
      const title = p.title || '';
      const extract = (p.extract || '').trim();
      if (!title || seen.has(title)) continue;
      if (extract.length < MIN_CHARS) continue;
      if (/(曖昧さ回避|一覧|もしかして)/.test(title)) continue;
      seen.add(title);
      out.push({ title, extract: extract.slice(0, 1200) });
      if (out.length >= n) break;
    }
  }
  return out;
}

async function summarizeBatch(articles) {
  const body = {
    systemInstruction: { parts: [{ text: V3 }] },
    contents: [{ parts: [{ text: articles.map((a, i) => (i + 1) + '. ' + a.title + '\n' + a.extract).join('\n\n') }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.9 }
  };
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent?key=' + KEY;
  let r;
  try {
    r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch (e) { console.error('  fetch失敗', e.message); return []; }
  if (!r.ok) { console.error('  Gemini', r.status, (await r.text()).slice(0, 200)); return []; }
  const data = await r.json();
  const text = (data.candidates && data.candidates[0] && data.candidates[0].content
    && data.candidates[0].content.parts.map(p => p.text).join('')) || '[]';
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : (parsed.cards || []);
  } catch (e) { console.error('  JSON parse失敗'); return []; }
}

(async () => {
  console.log('記事を取得中…');
  const articles = await fetchRandom(TARGET);
  console.log('記事 ' + articles.length + ' 本');
  const cards = [];
  for (let i = 0; i < articles.length; i += BATCH) {
    const got = await summarizeBatch(articles.slice(i, i + BATCH));
    for (const c of got) if (c && c.term && c.line) cards.push({ term: c.term, reading: c.reading || '', line: c.line });
    console.log('要約 ' + cards.length + '/' + articles.length);
  }
  const today = new Date().toISOString().slice(0, 10);
  await writeFile('cards.json', JSON.stringify({ date: today, count: cards.length, cards }, null, 2));
  console.log('✓ cards.json 書き出し：' + cards.length + '枚 (' + today + ')');
})();
