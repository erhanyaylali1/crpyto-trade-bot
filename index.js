const express = require('express');
const cors = require('cors');
const routes = require('./routes.js');
const dotenv = require('dotenv');

dotenv.config();
class Index {

    constructor() {
        this.server = express();
        this.middlewares();
        this.routes();
        //this.listen();
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
