import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import router from "./routes/routes.js";
import DBconnection from './database/db.js';
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', router);
app.use('/uploads', express.static('backend/public/uploads'));

app.get('/', (req, res) => {
    res.send('Welcome to the VK Publications');
});

DBconnection();

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`server is listening on port ${PORT}`);
});