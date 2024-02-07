import dotenv from 'dotenv';
import connect from './db/index.js';

dotenv.config({
    path: './env'
});

connect();