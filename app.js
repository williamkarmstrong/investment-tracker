require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const {
    getHomepage,
    addAsset,
    addStock,
    addCrypto,
    addOther,
    deleteAsset
} = require("./controllers/assetController");

// setup express app
const app = express();

// view engine
app.set('view engine', 'ejs');

// middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(req.path, req.method)
    next()
})

// connect to db and listen for requests to port no.
mongoose.connect(process.env.DB_URI)
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log("Connected to database and listening on port: " + process.env.PORT)
        })
    })
    .catch((err) => console.log(err))

// render page
app.get('/', getHomepage);

// add asset
app.post('/add', addAsset);

// add stock
app.get('/stock', addStock);

// add crypto
app.get('/cryptocurrency', addCrypto);

// add other
app.get('/other', addOther);

// delete asset
app.post('/delete/:symbol', deleteAsset);
