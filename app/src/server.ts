import express, { Express, Request, Response } from 'express';
import helmet from "helmet";
import cors from "cors";

const app: Express = express();
const port = process.env.PORT || 3010;

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World! in Typescript Now'); 
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}!`);
});

// activate json in Express
app.use(express.json());
// Helmet for headers
app.use(helmet());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
      },
    },
    // hide values inside url
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    xPermittedCrossDomainPolicies: { permittedPolicies: "none" },
  })
);

// hackers can't see what langage the app is built with
app.disable("x-powered-by");
// activate CORS
app.use(
  cors({
    origin: function (origin:any, callback:any) {
      if (origin === "chrome-extension://"+ process.env.ID_EXTENSION) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

