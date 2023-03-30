# AR アプリのデータモデル


## Firestore Database のコレクション定義

---

### **buildings**
建物。一般建築物。

| 項目             | field     | type                | 必須 |
| ---------------- | --------- | ------------------- | ---- |
| id               | id        | ハッシュ値（gmlID） | ✓    |
| 建物 ID          | bldgID    | string              | ✓    |
| 緯度経度         | geopoint  | geopoint            | ✓    |
| 高度             | altitude  | number              | ✓    |
| geohash※1        | geohash   | geohash             | ✓    |
| lod0footprint※2 | footprint | array               | ✓    |
| 建物高さ         | height    | number              | ✓    |
| 登録日           | created   | timestamp           | ✓    |
| 更新日           | modified  | timestamp           | ✓    |

※1: firebase のジオクエリ用の拡張機能で使用。

※2: {latitude: number, longitude: number, altitude: number}の arrayとして定義。
<br />
<br />


### **frns**
設備。信号機、標識等。

| 項目             | field     | type                | 必須 |
| ---------------- | --------- | ------------------- | ---- |
| id               | id        | ハッシュ値（gmlID） | ✓    |
| 設備 ID          | frnID    | string              | ✓    |
| 緯度経度         | geopoint  | geopoint            | ✓    |
| 高度             | altitude  | number              | ✓    |
| geohash        | geohash   | geohash             | ✓    |
| lod0footprint | footprint | array               | ✓    |
| 設備物高さ         | height    | number              | ✓    |
| 属性 | attributes | object※1            | -    |
| 登録日           | created   | timestamp           | ✓    |
| 更新日           | modified  | timestamp           | ✓    |


※1: 例`{ entity: "交通信号機" }`。
<br />
<br />


### **vegs**
街路樹、植木等。

| 項目             | field     | type                | 必須 |
| ---------------- | --------- | ------------------- | ---- |
| id               | id        | ハッシュ値（gmlID） | ✓    |
| 植生設備ID          | vegID    | string              | ✓    |
| 緯度経度         | geopoint  | geopoint            | ✓    |
| 高度             | altitude  | number              | ✓    |
| geohash        | geohash   | geohash             | ✓    |
| lod0footprint | footprint | array               | ✓    |
| 樹高等         | height    | number              | ✓    |
| 属性 | attributes | object              | -    |
| 登録日           | created   | timestamp           | ✓    |
| 更新日           | modified  | timestamp           | ✓    |
<br />
<br />


### **tags**

| 項目             | field         | type                      | 必須 |
| ---------------- | ------------- | ------------------------- | ---- |
| id               | id            | ハッシュ値（DB 自動付番） | ✓    |
| ラベル           | label         | string                    | ✓    |
| グループ※1       | group         | string                    | ✓    |
| カテゴリー※2     | category      | string                    | ✓    |
| ハッシュタグ     | hashtag       | array                     | -    |
| 説明             | description   | string                    | -    |
| 登録ユーザー※3   | createdby     | string                    | ✓    |
| 編集可能ユーザー | allowedtoedit | array                     | ✓    |
| タグ付け対象物※4   | subject       | string                    | -    |
| タグ付け対象物※5   | gmlID      | string                    | ✓    |
| 写真※6         | photo         | array                     | -    |
| 緯度経度         | geopoint      | geopoint                  | ✓    |
| 高度             | altitude      | number                    | ✓    |
| geohash       | geohash       | geohash                   | ✓    |
| like             | like          | array                     | ✓    |
| 表示非表示       | hide          | boolean                   | ✓    |
| 最新コメント投稿日 | commented     | timestamp                 | ✓    |
| コメント投稿数    | counts        | number                    | ✓    |
| タグ位置微調整値※7| offset        | object | ✓    |
| 登録日           | created       | timestamp                 | ✓    |
| 更新日           | modified      | timestamp                 | ✓    |

※1: 事業やクライアントなど別に区別するのに使用。

※2: あらかじめ用意したリストに定めたコード値が入る。

※3: ユーザードキュメントへの参照。

※4, ※5: ※5はgmlID, frnID, vegIDなどユニークなもの(各コレクションのIDに相当）。※4は建物IDなどであり、本DBではユニークとは限らない。

※6: 画像ファイル名(string)のarray。firebase storageに保存されている。

※7: 緯度経度、高度は対象物の中心情報なので、そこからどれくらいずれているかの相対距離(position[m])とタグの回転（rotation[rad])を表す。
~~~
{
  position: {
    x: number,
    y: number,
    z: number
  },
  rotation: {
    x: number,
    y: number,
    z: number
  }
}
~~~
<br />
<br />


### **users**

| 項目             | field       | type      | 必須 |
| ---------------- | ----------- | --------- | ---- |
| id        | id         | ハッシュ値※1 | ✓    |
| 表示名           | displayName       | string    | ✓    |
| プロフィール写真 | profile    | string※2 | -    |
| グループ名       | group   | map       | ✓    |
| 登録日           | created     | timestamp | ✓    |
| 変更日           | modified     | timestamp | ✓    |

※1: firebase authで登録されたハッシュ値。  

※2: 画像ファイル名。
<br />
<br />

---

## セキュリティ設定

- 本プロジェクトではFirebaseのダッシュボード上で設定。  
Firestore Database, Storegeのページからルール→ルールの編集を選択し、以下のコードを貼り付ける。
<br />
<br />

### **Firestore Databaseのルール**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tags/{tag} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;      
    }
    match /buildings/{building} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;      
    }
    match /frns/{frn} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;      
    }
    match /vegs/{veg} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;      
    }
    match /users/{userId}/{user=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;     
    }
  }
}
```
<br />
<br />

### **Storageのルール**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /tags/{tag=**} {
      allow read;
      allow write: if request.auth != null;
    }
    match /users/{userId}/{imgs=**} {
      allow read;
      allow write: if request.auth.uid == userId;
    }
  }
}
```
<br />
<br />

---

## PLATEAU モデルの組み込み手順


### **①gml ファイルより必要なデータを抽出**

例:建物の場合
`bldg:Building`要素内より、次の属性を抽出。

```
- gml:id ※1
- uro:buildingID ※2
- bldg:measuredHeight(建物高さ)
- bldg:lod0FootPrint内の最後のgml:posList ※3
```
※1: ユニークであるもの。

※2: bldgID等。"bldg:consistsOfBuildingPart"を含む場合は１つのbldgIDに対し、複数のgmlIDが生まれるため、この値はユニークではない。また```<gen:stringAttribute name="建物ID">```の値である可能性もある。


※3: "bldg:lod0FootPrint"ではなく"bldg:lod0RoofEdge"の場合もある。場合によっては"bldg:lod1Solid"より底面を抽出し、それをfootprintとみなす。都市設備(frn)、植生(veg)においてもfootprintに準ずるものを抽出する。
<br />
<br />


### **②JSON 形式に整形**

posList は以下のように配列に変換。

```
{ latitude: Number, longitude: Number, altitude: Number}
```

またジオクエリに対応するためオブジェクトの中心座標を計算（平均値）。

```
# 建物オブジェクト
{
      gmlID: string,
      bldgID: string,
      height: number,
      footprint: [{
      	latitude: number,
      	longitude: number,
      	altitude: number
      }..],
      center: {
      	latitude: number,
      	longitude: number,
      	altitude: number
      }
}
```
<br />
<br />


### **③Firestoreに登録**

center は GeoPoint に変換。GeoHash ロジックを使用するのでその情報も付与。
<br />
<br />


### **④アプリ内で使用**

スマホの位置情報から近隣の建物を抽出。AR.js 内では footprint と高さから多角柱を描画する。
