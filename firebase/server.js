const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 3010;

//create Express server and activate CORS
const app = express();
app.use(cors({ origin: true }));

//SDK Admin Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
// get items by collection name
app.get("/read/:collection_name", async (req, res) => {
  try {
    let query = db.collection(req.params.collection_name);
    let response = [];
    await query.get().then((querySnapShot) => {
      let docs = querySnapShot.docs;
      for (let doc of docs) {
        const selectedItem = {
          id: doc.id,
          item: doc.data(),
        };
        response.push(selectedItem);
      }
    });
    return res.status(200).send(response);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
});
// get default items (applications)
app.get("/", async (req, res) => {
  try {
    let query = db.collection("applications");
    let response = [];
    await query.get().then((querySnapShot) => {
      let docs = querySnapShot.docs;
      for (let doc of docs) {
        const selectedItem = {
          id: doc.id,
          item: doc.data(),
        };
        response.push(selectedItem);
      }
    });
    return res.status(200).send(response);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
});

app.listen(port, () => {
  console.log("listening on port" + port);
});
