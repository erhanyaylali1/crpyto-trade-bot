const express = require('express');
const Service = require('./service.js');    
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

module.exports = new Routes().router;