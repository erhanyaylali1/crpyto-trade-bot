import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import dotenv from 'dotenv';

dotenv.config();

class Index {

    constructor() {
        this.server = express();
        this.middlewares();
        this.routes();
        this.listen();
    }

    middlewares() {
        this.server.use(express.json());
        this.server.use(cors());
    }

    routes() {
        this.server.use(routes);
    }

    listen() {
        const port = process.env.PORT || 8080;
        this.server.listen(port, () => {
            console.log(`Listening at http://localhost:${port}`);
        });
    }
}

module.exports = { app: new Index().server };
