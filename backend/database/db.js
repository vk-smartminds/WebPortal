import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const DBconnection = async () => {
    const MONGODB_URL = process.env.MONGODB_URL;
    try {
        await mongoose.connect(MONGODB_URL);
        console.log("DB connection established!");
    } catch (error) {
        console.log("Error connecting to mongoDB : " + error);
    }
}

export default DBconnection;