const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const port = 3000;

//create Express server and activate CORS
const app = express();
app.use(cors({ origin: true }));

//SDK Admin Firebase
const serviceAccount = require("./permissions.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

app.listen(port, () => {
  console.log("listening on port" + port);
});
