import { Router } from 'express';
import { AuthenticatedRequest, authentificationToken } from '../auth.middleware';
import DbConnect from '../Services/dbConnect';

const router = Router();
// get connected to firebstore
const dbConnect = new DbConnect();
const db = dbConnect.getDb();

// get items by collection name
router.get(
  "/read/:collection_name/me",
  authentificationToken,
  async (req, res) => {
    try {
      let query = db.collection(req.params.collection_name);
      let response: Array<{ id: string; item: any }> = [];
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
  }
);
// Get default items (applications)
router.get("/me", authentificationToken, async (req, res) => {
  try {
    let query = db.collection("applications");
    let response: Array<{ id: string; item: any }> = [];
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
router.post("/add", authentificationToken, async (req, res) => {
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

export default router;