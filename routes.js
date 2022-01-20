import express from 'express';
import Service from './service.js';

class Routes {

    constructor() {
        this.service = new Service();
        this.router = express.Router();
        this.routes();
    }

    routes() {
        this.router.get('/', (req, res) => {
            res.send('Hello World!')
        })
    }
}

export default new Routes().router;