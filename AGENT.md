# AGENT.md

## 参照ドキュメント

### 要件定義
- `docs/design/shipping-service-requirements.md`
- `docs/design/shipping-usecase.drawio`
- `docs/design/shipping-usecase-sequence.drawio`

### 設計書
- `docs/design/ui-dashboard-design.md`
- `docs/design/ui-api-interface-mapping.md`
- `docs/design/画面遷移図.drawio`
- `docs/design/SCR-001-dashboard.md`
- `docs/design/SCR-002-shipping-list.md`
- `docs/design/SCR-003-shipping-detail.md`
- `docs/design/SCR-010-login.md`
- `docs/design/SCR-020-profile.md`
- `docs/design/SCR-030-user-management.md`

### ADR (Architecture Decision Records)
- `docs/adr/` - 技術選定の意思決定記録
  - ADR-001: UIフレームワーク選定
  - ADR-002: バックエンドフレームワーク (Gin/GORM)
  - ADR-003: UIアーキテクチャ
  - ADR-004: 非同期処理・結果整合性
  - ADR-005: 楽観ロック
  - ADR-006: 複数UIベース並行評価

### 実装プラン
- `docs/plan/plan.md` - 実装フェーズとステップの定義
- `docs/plan/ai-implement.md` - AI実装ガイド

### 実装状況
- `docs/implementation/` - 実装済み機能のサマリ
- `docs/issues/` - Issue管理（個別のIssueファイル）

### 実装ガイド

1. **基本方針**: (例: "常に型安全を優先する", "DRY原則の徹底")
2. **ディレクトリ構成の遵守**: (例: "xxx.rs + xxx/ 構成を守り、mod.rsは使わない")
3. **命名規則**: (例: "変数名はドメイン駆動設計(DDD)の用語に準拠する")
4. **エラーハンドリング**: (例: "unwrap()は禁止。必ず適切にエラーを伝搬させる")
5. **テスト方針**: (例: "新しい関数には必ずユニットテストを付随させる")
6. **禁止事項**: (例: "循環参照の禁止", "外部ライブラリの無秩序な追加の禁止")

## プロジェクト固有のルール
一回のissue対応で複数のUIは変更しない（一つのUI frontソースのみに変更を加える）
対応UI指定していない場合は確認する

### アプリケーション基盤の保護
### tempフォルダ配下のドキュメントは無視してよい（一次保存後で削除予定） 


### Issue採番ルール
- **admin-ui**: 0xx（学習テスト用、成果物ではない）
- **next-shadcn**: 1xx
- **horizon-ui**: 2xx
- **square-ui**: 3xx
- **mui**: 4xx
- **ant-design**: 5xx

### Issueファイル一覧
- [admin-ui (学習テスト用)](./issues-admin-ui.md) - Issue 0xx
- [Next Shadcn Dashboard](./issues-next-shadcn.md) - Issue 1xx
- [Horizon UI](./issues-horizon-ui.md) - Issue 2xx
- [Square UI](./issues-square-ui.md) - Issue 3xx
- [Material UI](./issues-mui.md) - Issue 4xx
- [Ant Design](./issues-ant-design.md) - Issue 5xx

### ソースフォルダ構成
**重要**: 各UIベースのソースフォルダ構成は、各UIベース独自の構成に従います。  
統一されたpath規約は定めません。各UIベースのベストプラクティスを尊重します。



## 設計変更

設計変更時、設計書の修正履歴も更新する

### レビュー指摘
レビュー時は `{file}_qa.md` に以下の形式で追記
```
## 時間 指摘者： {あなたの名前}
- Q1
xxxxx
- Q2
```

### レビュー回答
レビュー指摘の対応及び回答時
対象設計書を更新する。
`{file}_qa.md` に以下の形式で追記
```
## 時間 作成担当 {あなたの名前}
- Q1の回答
xxxxx
```


## Issue対応フロー

### 1. ブランチ作成

- 新しいissueに対応するとき、ブランチを現在のbranchから対応用branch新規作成する
```bash
git fetch origin
```
作業ブランチ: feature/issue-<番号>-<概要>



### 2. 実装
- Issue ファイル (`docs/issues/issue-XXX-*.md`) を確認
- **1 Issue = 1 ブランチ**で対応
- コミットメッセージに Issue 番号を含める
- GitHub Issue も作成する

### GitHub Issue 作成ルール

#### タイトルフォーマット
```
[<app-name>] Issue <番号>: <画面/機能名>（<画面ID>）
```
**例:**
- `[admin-next-shadcn] Issue 107: ログイン画面（SCR-010）`
- `[admin-next-shadcn] Issue 109: ユーザー管理画面（SCR-030）`

`<app-name>` は `apps/` 配下のディレクトリ名:
- `admin-next-shadcn`, `admin-horizon-ui`, `admin-square-ui`, `admin-mui`, `admin-antd-pro`

#### ラベルルール

| ラベル | 用途 |
|---|---|
| `auth` | 認証・認可機能 |
| `ui` | フロントエンド UI 実装 |
| `backend` | バックエンド実装 |
| `api` | API 実装 |
| `P0` | 最優先（前提条件 / ブロッカー） |
| `P1` | 高優先（MVP スコープ） |
| `enhancement` | 新機能追加全般 |

**付与方針:**
- 機能ラベル（`auth`, `ui`, `backend` など）: 該当するものをすべて付与
- 優先度ラベル（`P0` / `P1`）: 必ず1つ付与
- `enhancement` は新機能 Issue に常時付与

#### gh CLI での作成例
```bash
gh issue create \
  --title "[admin-next-shadcn] Issue 107: ログイン画面（SCR-010）" \
  --label "auth,ui,P0,enhancement" \
  --body "..."
```

### 3. テスト・ビルド確認
- ビルドエラーがないことを確認
- テストケースが全て通ることを確認
- コードの動作を検証

### 4. 動作確認（ユーザー目視）
- **テスト・ビルド完了後、一旦停止する**
- ユーザーが目視で動作確認を行う
- **直接コミットは行わない** - ユーザーの確認・承認を待つ

### 5. コミット・プッシュ
```bash
git add <files>
git commit -m "feat(scope): description (issue-XXX)"
git push -u origin feature/issue-XXX-description
```

**コミットメッセージの形式:**
- `feat(scope): 機能追加の説明 (issue-XXX)`
- `fix(scope): バグ修正の説明 (issue-XXX)`
- `refactor(scope): リファクタリングの説明 (issue-XXX)`
- **Author**: jason.w

### 6. PR作成（Claude CLI で実行）
```bash
gh pr create --title "[Phase X Backend/Frontend] 機能名" \
  --body "## 概要\nIssue #X の実装\n\n## 実装内容\n- ...\n\nCloses #X" \
  --base develop
```

**重要事項:**
- **PRは必ずdevelopブランチへ提出する**
- PR本文に `Closes #X`（または `Fixes #X` / `Resolves #X`）を**必ず**記載してIssueと紐付ける
- PR提出前に、該当Issue番号が正しいことを確認する
- PRがマージされると自動的にIssueがcloseされる

### 7. PR承認・マージ（GitHub Web UI で実施）
- **Claude CLI では PR 作成まで**
- 承認・マージは GitHub Web UI で手動実施
- developブランチへマージ後、定期的にmainブランチへリリース

### 8. Issue対応完了の記録
- **PR マージ後**、`plan_issue.md` を更新
- 該当 Issue のステータスを「対応完了」に変更
- 完了日時とPR番号を記録

```markdown
## Issue一覧
docs/issues/issue-*.md を参照
個別のIssueファイルで管理

例:
- docs/issues/issue-001-backend-project-setup_complete.md
- docs/issues/issue-002-frontend-project-setup_complete.md
- docs/issues/issue-003-shipping-list-api_complete.md

各Issueのステータスはファイル名の接尾辞で管理:
- _complete.md: 完了
- _in_progress.md: 対応中
- .md: 未着手
```
