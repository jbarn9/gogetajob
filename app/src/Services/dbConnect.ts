import * as admin from 'firebase-admin';

export default class DbConnect {
    private db: admin.firestore.Firestore;

    constructor() {
        const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS as string);
        //SDK Admin Firebase
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        
        this.db = admin.firestore();
    }

    // getter db connection
    getDb() {
        return this.db;
    }
}