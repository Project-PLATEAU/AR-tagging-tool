# FY2022 Project PLATEAU UC22-035「XR技術を用いた体感型アーバンプランニングツール」の成果物（ARタグ付けアプリ）
![スクリーンショット 2023-03-23 170944](https://user-images.githubusercontent.com/79615787/227141611-d2cf11f2-42ea-45b7-8754-88c9a93e789b.png)


## 1. 概要
PLATEAUの3D都市モデルとウェブAR技術を組み合わせたスマートフォン向けウェブアプリです。
スマートフォン等のデバイスのカメラ画像越しに見る像にPLATEAUの3D都市モデルを重ねて表示し、地物に対するコメントなどをARタグとして投稿できます。

## 2．「XR技術を用いた体感型アーバンプランニングツール」について

### ユースケースの概要

アーバンプランニングのプロセスでは、開発側のデベロッパーや行政は市民参画の促進を試みてきたが、実際には現状やプランの認知の難しさやコミュニケーションツールの不足といった課題があった。
本アプリは、3D都市モデルおよびXRを用いた直感的かつ体感的なアーバンプランニングにおけるコミュニケーションツールを提供し、まちづくりへの市民参加を促進することを目的としています。

### 開発システムの概要

本リポジトリでは、「AR タグ付けアプリ」のソースコードを提供しています。
ARタグ付けアプリはスマートフォンのブラウザ上で動作するウェブアプリであり、システム構成として、バックエンドにfirebase、フロントエンドのフレームワークにnext.js、3Dの描画にAR.js及びThree.jsを採用した。
ユーザーはまちに関するポジティブな印象（Good）、ネガティブな印象（Bad）、改善や活用のアイデア（Idea）を写真とコメント付きで投稿できる。このアプリにPLATEAUの地物データを連携させることで、建築物やペデストリアンデッキなど、地物の任意の位置を特定して感じた印象やアイデアをタグ付けすることを可能にした。

## 3．利用手順

**※Firebaseのプロジェクトの設定方法やローカルでの環境構築方法の詳細はFirebaseのドキュメントを[参照](https://firebase.google.com/docs?hl=ja)してください。**

### 動作環境

- スマートフォン、タブレット
- iOS 13以降, Android OS 12以降
- ネットワーク接続必須

---

### システム構成

#### フロントサイドアプリ
- Web フレームワーク：Next.js (ver 12.1.6)
- 3D 対応ライブラリ：AR.js (ver 3.4.0) + Three.js (AR.jsに組み込み)

#### バックエンドアプリ（SPA）
- Firebase Project
  - Authentication
  - Firestore Database
  - Cloud Storage
  - Cloud Function

---

### 主な機能

#### ユーザー管理
- 認証方法
  - メールアドレスとパスワードによる認証
- 登録情報
  - 表示名(Display Name)
  - プロフィール写真
  - グループ名

#### タグ登録管理

- タグ情報登録・更新・削除
- タグ「いいね！」

#### タグ表示

- 位置情報を基準に周辺のタグ情報を取得してデバイス画面上に表示
- 位置の変化に応じて自動で範囲を変更して表示を更新
- カテゴリやグループでタグを絞り込み
- カテゴリーごとにピンのデザインを指定
- ビュー切り換え
  - 2次元地図(Google Map)ビュー
  - リスト表示(一覧表示)ビュー
  - AR地図ビュー

#### モード切り替え

- 街歩きモード
  - 2次元地図とAR地図を用いて対象地物にタグ付け
  - GPSを中心としたタグ、地物に対してタグ付け、タグ編集が可能

- ブラウズモード
  - 2次元地図上で選んだ定点から一定距離のタグを表示
  - タグの編集が可能
  - リスト表示ビュー

- ユーザー設定
  - ユーザー情報の設定、編集
<br />
<br />

---
<br />
<br />

### プロジェクトのセットアップ

#### 1.  パッケージのインストール
ソースコードをCloneしたプロジェクトのルートにて次のコマンドを実行。
```
yarn install
```
※ Nodejs, Firebase CLIのグローバルインストールに関しては割愛。  
※ Nodejsのバージョンは16、Firebase CLIのバージョンは9.17、yarnのバージョンは1.22.10で実行。
<br />
<br />


#### 2.  Firebase Projectの設定
プロジェクトのダッシュボードにてFirestore Database, Storageのルール設定([Datamodel.md](./DataModel.md)参照)が必要。
<br />
<br />

#### 3.  .envの設定
プロジェクトのダッシュボードにてプロジェクトの概要→ウェブアプリを設定するとfirebaseConfigの各値を取得できるので、各々の値を.envに設定。
| 変数名             | firebaseConfig         | 
| ---------------- | ------------- | 
|NEXT_PUBLIC_API_KEY|apiKey|
|NEXT_PUBLIC_AUTH_DOMAIN|authDomain|
|NEXT_PUBLIC_PROJECT_ID|projectId|
|NEXT_PUBLIC_STORAGE_BUCKET|storageBucket|
|NEXT_PUBLIC_MESSAGING_SENDER_ID|messagingSenderId|
|NEXT_PUBLIC_APP_ID|appId|
|NEXT_PUBLIC_MEASUREMENT_ID|measurementId|

更に、以下の２変数の値を設定。
- NEXT_PUBLIC_GOOGLE_MAP_KEY  
Firebaseプロジェクトダッシュボードではなく**Google Cloud Console**にてFirebaseプロジェクトとリンクしているプロジェクトを選択し、別途APIキーを作成。その値を設定。
- XDG_CONFIG_HOME  
```.config```と設定。
<br />
<br />

#### 4. ソース内のプロジェクト名差し替え  

以下のファイルのproject-nameをプロジェクト名に差し替え。

- **.firebasec**  
line 3
  ```
  {
    "projects": {
      "default": "*** project-name ***"
  }
  ```
- **functions/tags.ts**  
  line 12
  ```
  const bucketName = '*** project-name ***.appspot.com'
  ```
  line 336, 339, 343  
  ```
  if (tag.category === 'GOOD') {
    feature.properties.markerUrl =
      'https://*** project-name ***.web.app/images/GOOD_300.png'
  } else if (tag.category === 'BAD') {
    feature.properties.markerUrl =
      'https://*** project-name ***.web.app/images/BAD_300.png'
  } else if (tag.category === 'IDEA') {
    feature.properties.markerUrl =
      'https://*** project-name ***.web.app/images/POSSIBLE_300.png'
  }
  ```  
<br />
<br />

#### 5. PLATEAUモデルのFirestoreへの追加  
 
CityGMLの.gmlファイルから必要なデータを抽出し、Firestoreにインサートする必要がある。インサートするデータ形式はDataModel.mdを参照。
<br />
<br />

#### 6. Firebase functionのデプロイ
ローカル環境でテストする場合もfunctionsを呼び出すため、functionをデプロイ。

```
firebase deploy --only functions
```
functionsフォルダ内のtsファイルがjsに変換され、そのjsファイルがアップロードされる。  
**firebase.json**のpredeployの設定に準拠しており、next.jsの仕様上、hosting側のbuildも行われる。
<br />
<br />


デプロイ後、以下のコマンドを実行
```
yarn dev
```

ウェブブラウザにて[http://localhost:3000](http://localhost:3000) を開き、アプリの起動を確認。
<br />
<br />

※ あくまでPC環境下での動作確認であり、スマートフォンからlocalhostへのアクセスなどは[ngrok](https://ngrok.com/)などを利用してください。尚、ngrokを利用する際は、ngrokで生成された一時URLを**Google Cloud Console**（**Firebase Consoleではない**）の**認証情報**のAPIキーにおいて、リクエスト許可に**手動**で追加する必要があります（そうしないとAuthentication, Google Mapが利用できません）。
<br />
<br />

※ PCの環境ではGPSが動作していない、あるいは中々更新がかからない、PCにカメラがついていない、各種機能許可のアラートが出ないなどで、建物情報、タグ情報が正確に取れない、ARモードが正常に作動しない、などの不具合が生じる可能性があります。
<br />
<br />

#### ※deployに関して
nextjsでfirebase deployをすると、packagingが100Mを超えると400 Unknown errorが出るようになります。この対策として、.nextフォルダにあるcacheフォルダを定期的に削除してください（Hostingのdeploy履歴みたいなもの）。[参照リンク](https://stackoverflow.com/questions/66266314/firebase-functions-upload-error-http-error-400-unknown-error)
<br />
<br />

---

### DB, API仕様に関して
- Firestoreデータモデル: [DataModel.md](./DataModel.md)参照。
- API仕様: [API.md](API.md)参照。

---

## ライセンス

- ソースコードおよび関連ドキュメントの著作権は国土交通省に帰属します。
- 本ドキュメントは[Project PLATEAU のサイトポリシー](https://www.mlit.go.jp/plateau/site-policy/)（CCBY4.0 および政府標準利用規約 2.0）に従い提供されています。
  ​
## 注意事項

* 本レポジトリは参考資料として提供しているものです。動作保証は行っておりません。
* 予告なく変更・削除する可能性があります。
* 本レポジトリの利用により生じた損失及び損害等について、国土交通省はいかなる責任も負わないものとします。

## 参考資料

* XR技術を用いた体感型アーバンプランニングツール技術検証レポート（近日公開予定）: [https://www.mlit.go.jp/plateau/libraries/technical-reports/](https://www.mlit.go.jp/plateau/libraries/technical-reports/)
* PLATEAU Web サイト Use caseページ「XR技術を用いた体感型アーバンプランニングツール」: [https://www.mlit.go.jp/plateau/use-case/](https://www.mlit.go.jp/plateau/use-case/)
* [AR.js](https://ar-js-org.github.io/AR.js-Docs/)
* [Three.js](https://threejs.org)
