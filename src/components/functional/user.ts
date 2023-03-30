// import { doc, setDoc, collection, getFirestore } from 'firebase/firestore'
// import next from 'next'

export const postUser = async (user: any) => {
  // // 初回ログインの場合はユーザー情報をfiresbaseに保存する
  // // ログイン時にユーザー情報を取得したい
  // // →firestoreにあるか確認
  // const db = getFirestore()
  // const colRef = collection(db, "users");
  // const docRef = doc(colRef, user.uid);
  // await setDoc(docRef, {
  //     displayName: user.displayName, email: user.email })
  // .then(docRef => {
  //     console.log("post successfully")
  // })
  // .catch(error => {
  //     console.log("post failed")
  //     console.log(error)
  // });
}
