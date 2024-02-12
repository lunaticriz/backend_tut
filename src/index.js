import dotenv from "dotenv";
import connect from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || 8000;

connect()
  .then(() => {
    app.on("error", (err) => {
      console.error(err);
      throw err;
    });

    app.listen(PORT, () => {
      console.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Mongodb connection failed err" + err);
  });
