# ひとかじり 🍃
> 世界を、ひとかじり。覚えなくていい。

毎朝、Wikipedia からランダムに約100の概念を引き、Gemini が「v3契約」で"翻訳"して1枚ずつのカードにする日替わりサイト。
記録するのは累計の「かじった数」だけ。

## 仕組み（アーキテクチャ B：日替わり作り置き）
- **毎朝1回だけ** GitHub Actions が `summarize.mjs` を実行 → `cards.json` を生成してコミット
- サイト本体は **静的**。訪問者のブラウザでは何も計算しない（前夜の作り置きを表示するだけ）
- だから **訪問者が何人来てもコストは1人分**。Gemini 無料枠(1日1,500リクエスト)に余裕で収まる＝実質 $0

## デプロイ手順
1. このフォルダを GitHub リポジトリにpush
2. **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `GEMINI_API_KEY`　Value: あなたのキー
   - ※キーはここだけ。コードには書かない
3. **Settings → Pages → Build and deployment → Source: Deploy from a branch → `main` / `(root)`**
4. **Actions タブ → daily-cards → Run workflow**（初回はこれで `cards.json` を本生成）
5. Pages の URL をスマホで開く 📱

以降は毎朝6時(JST)に自動更新。

## カスタマイズ
- `summarize.mjs` の `MODEL` … `gemini-3-flash` 等に変更で質UP（AI Studio で現行モデル名を確認）
- `TARGET` … 1日の枚数（既定100）
- `MIN_CHARS` … 薄いstubを捨てる閾値（ソース選別）
- `V3` … 要約契約。フックや言い換えの方針を直すならここ（＝cycle-3 の実験場）

## 承認ゲートにしたい場合（任意）
`daily.yml` の最後を push ではなく「PRを作る」に変えると、毎朝あなたがマージで公開＝「外部公開=承認」ゲートになる。

---
出典：Wikipedia（CC BY-SA）／ 要約：Google Gemini
