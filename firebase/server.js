const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 3010;

//create Express server and activate CORS
const app = express();
// activate CORS
app.use(cors({ origin: true }));
// read json in request
app.use(express.json());

//SDK Admin Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
// get items by collection name
app.get("/read/:collection_name/:userid", async (req, res) => {
  try {
    let query = db.collection(req.params.collection_name);
    let response = [];
    await query
      .where("iduser", "==", req.params.userid)
      .get()
      .then((querySnapShot) => {
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
// Get default items (applications)
app.get("/:userid", async (req, res) => {
  try {
    let query = db.collection("applications");
    let response = [];
    await query
      .where("iduser", "==", req.params.userid)
      .get()
      .then((querySnapShot) => {
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

// Add an application to collection Applications
app.post("/add", async (req, res) => {
  try {
    const application = req.body;
    console.log("req body", application);

    const docRef = await db.collection("applications").add({
      id: application.id,
      name: application.name,
      messagesTotal: application.messagesTotal,
      iduser: application.iduser.uid,
    });
    res.status(200).json({
      success: true,
      message: "Candidature ajoutée",
      id: docRef.id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log("listening on port" + port);
});
