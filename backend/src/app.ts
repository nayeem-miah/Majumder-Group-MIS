import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import morgan from "morgan";
import path from "path";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import router from "./app/routes";
import { getWelcomeHtml } from "./app/utils/getWelcomeHtml";

const app: Application = express();

// app.use(cors({
//     origin: ["http://localhost:3000", "http://localhost:5173"],
//     credentials: true,
// }));

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.static("public"));

app.get("/favicon.ico", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "image/png");
    res.sendFile(path.join(process.cwd(), "public", "favicon.png"));
});

app.get("/", (req: Request, res: Response) => {
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
        res.setHeader("Content-Type", "text/html");
        res.status(200).send(getWelcomeHtml());
        return;
    }

    res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Welcome to Initialize Backend API",
    });
});

app.set("trust proxy", 1);

// Mount both /api and /api/v1 for seamless API routing
app.use("/api/v1", router);
app.use("/api", router);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
