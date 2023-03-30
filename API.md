# API 基本仕様

- AR アプリ内は Cloud Function を使用し SDK 経由で https.oncall とする。外部からは呼び出し不可のFunction。
- VR アプリ、PLATEAU VIEWアプリからは auth 情報を context に含めて https.Get を呼ぶ。専用のAPIKEYを用意。

## 基本呼び出しURL
```
curl -X GET \
-H 'Authorization: Bearer *** API KEY ***' 'https://*** defined by project ***/rest/'
```
<br />
<br />


---

## **/tags**

| メソッド | 認証   | 
| -------- | ------ |
| GET      | 必要 |

| クエリ項目 | field(default) | type   | 必須 |
| -------- | ------ | ------ | ---- |
| 緯度      | lat | number |   ✓   |
| 経度      | lon | number |   ✓   |
| 半径      | radius(200)※1 | number |      |
| カテゴリ | category(none) | string |      |
| グループ | group(none) | string |      |
| ハッシュタグ | hash(none) | array |      |
| GeoJsonフラグ※2 | export(false) | boolean |      |

- タグ一覧取得。

※1: 200 <= radius <= 500 [m]。

※2: 本プロジェクトではPLATEAU VIEWでタグ情報を表示するために使用。export=trueでGeoJson形式で出力。
<br />
<br />


## **/tags/(:tagId)**

| メソッド | 認証   |
| -------- | ------ |
| GET      | 必要 |

- タグ１つの情報取得。

## **/tags/count**

| メソッド | 認証   |
| -------- | ------ |
| GET      | 必要 |

- タグの全件数取得。

## **/buildings/(:bldgID)/tags**

| メソッド | 認証   |
| -------- | ------ |
| GET      | 必要 |

- 一建物につけられたタグ一覧取得。
- bldgIDはtag.subjectに相当。

## **/target/(:gmlID)/tags**

| メソッド | 認証   |
| -------- | ------ |
| GET      | 必要 |

- １つのオブジェクトにつけられたタグ一覧取得。
- gmlIDはtag.gmlIDに相当。


---
