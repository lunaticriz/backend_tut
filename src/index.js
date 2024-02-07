import dotenv from 'dotenv';
import connect from './db/index.js';
import { app } from './app.js';

dotenv.config({
    path: './env'
});

connect()
.then(() => {
    app.on('error', (err) => {
        console.error(err);
        throw err;
    })

    app.listen(process.env.PORT, () => {
        console.info(`Server is running on port ${process.env.PORT}`);
    });
})
.catch((err) => { 
    console.error("Mongodb connection failed err" + err);
});