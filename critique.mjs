// ひとかじり — 批評パス：cards.json を v4基準で採点する。
//  ・明らかに不適切な1枚は自動ドロップ（公開前の安全網＝出力の品質管理。可逆）
//  ・弱いカードを flag → reports/ と loops/observations.jsonl に記録
//  ・weak率が高い日は proposals/pending/ に改善案を「下書き」
//  ★ 契約(summarize.mjs)と基準の変更は人間が承認・適用する。AIは"提案"まで（改訂は一点）。
import { writeFile, appendFile, readFile, mkdir } from 'node:fs/promises';

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error('✗ GEMINI_API_KEY 未設定'); process.exit(1); }

const MODEL = 'gemini-2.5-flash';
const BATCH = 20;
const WEAK_THRESHOLD = 0.25;   // weak率がこれを超えたら改善案を下書き

const HINT = {
  no_hook:    'フックの必須化（特に人物カード）',
  facts_only: '事実の羅列を禁止しフックを必須化（特に人物）',
  thin:       '痩せソースの足切り強化、または有名物への紐づけレバー',
  private:    '私的情報フィルタの強化',
  fabrication:'捏造ガードの強化'
};

const RUBRIC = `あなたは「ひとかじり」の品質監査役。各カードを【要約契約v4】の観点で採点する。改稿はしない、判定だけ。

観点：
- フックがあるか（驚き／感情／好奇心／エピソード／有名物との関係）。ただの事実の羅列はNG。
- 人物が肩書き・経歴・数値の羅列で終わっていないか。
- 痩せて薄い／中身が無いか。
- 存命一般人の私的情報（スリーサイズ・血液型等）や不適切な内容が混じっていないか。
- でっち上げ（記事に無さそうな断定）が無いか。

入力の各カードに対し、入力と同じ順序で次のJSON配列だけを返す：
[{"verdict":"good"|"weak"|"drop","issue":"no_hook"|"facts_only"|"thin"|"private"|"fabrication"|"","note":"一言"}]
- drop = 明らかに公開すべきでない（私的情報・不適切・空・壊れ）。厳しめだが乱用しない。
- weak = 公開はするが基準未達（flag）。
- good = 基準を満たす。
カード文だけを根拠に、"読者に刺さるか"を厳しめに見る。`;

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function gemini(user) {
  const body = {
    systemInstruction: { parts: [{ text: RUBRIC }] },
    contents: [{ parts: [{ text: user }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
  };
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent?key=' + KEY;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) { console.error('  Gemini', r.status); await sleep(3000); continue; }
      const data = await r.json();
      const text = (data.candidates && data.candidates[0] && data.candidates[0].content
        && data.candidates[0].content.parts.map(p => p.text).join('')) || '[]';
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : (parsed.cards || parsed.verdicts || []);
    } catch (e) { console.error('  critic batch失敗', e.message); await sleep(3000); }
  }
  return [];   // 失敗時は空＝全部 good 扱い（fail-safe：勝手に落とさない）
}

(async () => {
  let data;
  try { data = JSON.parse(await readFile('cards.json', 'utf8')); }
  catch (e) { console.error('cards.json が読めない'); process.exit(0); }
  const cards = data.cards || [];
  if (!cards.length) { console.log('カード0、終了'); process.exit(0); }
  const today = new Date().toISOString().slice(0, 10);

  const annotated = [];
  for (let i = 0; i < cards.length; i += BATCH) {
    const batch = cards.slice(i, i + BATCH);
    const user = batch.map((c, j) => (j + 1) + '. ' + c.term + ' = ' + c.line).join('\n');
    const verdicts = await gemini(user);
    batch.forEach((c, j) => {
      const v = verdicts[j] || {};
      annotated.push({ card: c, verdict: v.verdict || 'good', issue: v.issue || '', note: v.note || '' });
    });
    await sleep(4000);   // レート制限対策
  }

  const dropped = annotated.filter(a => a.verdict === 'drop');
  const kept    = annotated.filter(a => a.verdict !== 'drop');
  const weak    = kept.filter(a => a.verdict === 'weak');
  const hist = {}; weak.forEach(a => { const k = a.issue || 'other'; hist[k] = (hist[k] || 0) + 1; });
  const topIssue = Object.keys(hist).sort((a, b) => hist[b] - hist[a])[0] || 'none';
  const weakRate = kept.length ? weak.length / kept.length : 0;
  const pct = (weakRate * 100).toFixed(0);

  // 掃除したカードを書き戻す（ドロップを除外）
  data.cards = kept.map(a => a.card);
  data.count = data.cards.length;
  data.audited = today;
  await writeFile('cards.json', JSON.stringify(data, null, 2));

  // 日次レポート
  await mkdir('reports', { recursive: true });
  const report = `# 品質レポート ${today}\n\n`
    + `- 総数 ${cards.length}（公開 ${kept.length} / 自動ドロップ ${dropped.length}）\n`
    + `- weak ${weak.length}（${pct}%）／ 最多issue: ${topIssue}\n\n`
    + `## 自動ドロップ（公開しない）\n`
    + (dropped.map(a => `- ${a.card.term}（${a.issue}）${a.note}`).join('\n') || '- なし') + '\n\n'
    + `## flag（公開・基準未達）\n`
    + (weak.map(a => `- ${a.card.term}（${a.issue}）${a.note}`).join('\n') || '- なし') + '\n';
  await writeFile('reports/latest.md', report);
  await writeFile(`reports/${today}.md`, report);

  // 観測ログ（多点）
  await mkdir('loops', { recursive: true });
  await appendFile('loops/observations.jsonl', JSON.stringify({
    ts: today, loop: 'auto-critic', phase: 'audit', signal: 'weak_rate',
    expectation: '<' + WEAK_THRESHOLD, actual: weakRate.toFixed(2),
    drop: dropped.length, top_issue: topIssue, severity: weakRate > WEAK_THRESHOLD ? 2 : 1
  }) + '\n');

  // weak率が高ければ改善案を「下書き」（適用は人間）
  if (weakRate > WEAK_THRESHOLD) {
    await mkdir('proposals/pending', { recursive: true });
    const prop = `# auto-${today}（自動下書き・要 人間承認）\n\n`
      + `- 観測: weak率 ${pct}%（しきい値 ${WEAK_THRESHOLD * 100}%超）、最多issue=${topIssue}\n`
      + `- 弱い例: ${weak.slice(0, 6).map(a => a.card.term).join(' / ') || '—'}\n`
      + `- 提案（下書き）: 要約契約v4の「${HINT[topIssue] || '該当ルール'}」を強化することを検討。\n`
      + `- 注: 適用は人間が判断。基準・契約の変更は「改訂の一点」。AIはここまで（提案）。\n`;
    await writeFile(`proposals/pending/auto-${today}.md`, prop);
    console.log('改善案を下書き: proposals/pending/auto-' + today + '.md');
  }

  console.log(`audit done: 公開 ${kept.length} / ドロップ ${dropped.length} / weak ${weak.length}（${pct}%）`);
})();
