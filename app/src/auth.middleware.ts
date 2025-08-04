import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

if(!client){
    throw new Error('Credentials environment variable was not found!');
}

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

export const authentificationToken = async(req:AuthenticatedRequest, res: Response, next: NextFunction) =>{
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // check if the user is connected to google with the good token
    try{
        // check if the token sent by front app is a true token from google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        })

        // payload is an js object that contains authenticate user informations
        const payload = ticket.getPayload();
        // if there is no user authenticated
        if(!payload) throw new Error('Invalid token payload');

        // http request object sent by the client
        req.user ={
            uid: payload.sub,
            email: payload.email
        }

        next();
    }catch(err){
        console.error('Token verification failed', err);
        return res.status(401).json({error: 'Invalid token'});
    }
}