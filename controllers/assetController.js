const mongoose = require('mongoose')
const Asset = require('../models/assetModel')

// homepage
const getHomepage = async (req, res) => {
    const assets = await Asset.find({})

    // display date
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const date = mm + '/' + dd + '/' + yyyy;

    // update price for each asset
    for await (let asset of assets) {
        if (asset.assetType == 'Stock' || asset.assetType == 'Fund') {
            try {
                const priceURL = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${asset.symbol}&apikey=${process.env.ALPHA_KEY}`;

                const priceRes = await fetch(priceURL);
                const priceData = await priceRes.json();
                const price = Number( priceData['Global Quote']['05. price']);
                const value = Number((price * asset.amount));

                asset.price = price;
                asset.value = value;
                asset.save();
            }
            catch (error) {
                res.status(400).json({error: error.message});
            }
        }
        else if (asset.assetType == 'Cryptocurrency') {
            try {
                const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${asset.symbol}&to_currency=USD&apikey=${process.env.ALPHA_KEY}`;

                const res = await fetch(url);
                const data = await res.json();
                const name = await data["Realtime Currency Exchange Rate"]["2. From_Currency Name"]
                const price = Number(await data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]);
                const value = price * asset.amount

                asset.name = name;
                asset.price = price;
                asset.value = value;
                asset.save();
            }
            catch (error) {
                res.status(400).json({error: error.message});
            }
        }
    }

    res.render('index', {
        assets: await assets,
        date: date,
        xValues: await assets.map(asset => asset.symbol),
        yValues: await assets.map(asset => asset.value),
    } );

    res.status(200)
}

// post asset
const addAsset = async (req, res) => {

    const {assetType, keywords, amount} = req.body;

    const extension = `?type=${encodeURIComponent(assetType)}&keywords=${encodeURIComponent(keywords)}&amount=${encodeURIComponent(amount)}`

    if (assetType === 'Stock' || assetType === 'Fund') {
        res.redirect(`/stock${extension}`);
    }
    else if (assetType === 'Cryptocurrency') {
        res.redirect(`/cryptocurrency${extension}`);
    }
    else if (assetType === 'Other') {
        res.redirect(`/other${extension}&price=${encodeURIComponent(req.body.price)}`);
    }
}

const addStock = async (req, res) => {

    const assetType = req.query.type;
    const keywords = req.query.keywords;
    const amount = Number(req.query.amount);

    try {
        // find best match
        const searchURL = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${process.env.ALPHA_KEY}`;

        const searchRes = await fetch(searchURL);
        const searchData = await searchRes.json();
        const symbol = await searchData['bestMatches'][0]['1. symbol'];
        const name = await searchData['bestMatches'][0]['2. name'];

        const doc = await Asset.findOne({ name: name })

        if (doc instanceof Asset) {
            doc.amount += amount;
            doc.value = doc.amount * doc.price;
            await doc.save()
        }
        else {
            // add to db
            const asset = await Asset.create({ name, symbol, assetType, amount });
        }
    }
    catch (error) {
        res.status(400).json({error: error.message});
    }

    res.redirect('/');
}

const addCrypto = async (req, res) => {
    const assetType = 'Cryptocurrency';
    const symbol = (req.query.keywords).toUpperCase();
    const amount = Number(req.query.amount);

    try {
        // find best match
        const doc = await Asset.findOne({ symbol: symbol })

        if (doc instanceof Asset) {
            doc.amount += amount;
            doc.value = doc.amount * doc.price;
            await doc.save()
        }
        else {
            try {
                // add to db
                const asset = await Asset.create({ symbol, assetType, amount  });
            }
            catch (error) {
                res.status(400).json({error: error.message});
            }
        }
    }
    catch (error) {
        res.status(400).json({error: error.message});
    }

    res.redirect('/');
}

const addOther = async (req, res) => {

    const name = req.query.keywords;
    const symbol = req.query.keywords;
    const assetType = req.query.type;
    const amount = Number(req.query.amount);
    const price = Number(req.query.price);
    const value = amount * price

    try {
        const doc = await Asset.findOne({ symbol: symbol })

        if (doc instanceof Asset) {
            doc.amount += amount;
            doc.value += amount * price
            doc.price = doc.value / doc.amount;
            await doc.save()
        }
        else {
            try {
                const asset = Asset.create({name, symbol, assetType, amount, price, value });
            }
            catch (error) {
                res.status(400).json({error: error.message});
            }
        }
    }
    catch (error) {
        res.status(400).json({error: error.message});
    }

    res.redirect('/');
}

const deleteAsset = async (req, res) => {
    const symbol = req.params.symbol;

    try {
        await Asset.findOneAndDelete({ symbol: symbol });
        res.redirect('/')
    }
    catch (error) {
        res.status(500).send({ error: error.message });
    }
}

// export controls
module.exports = {
    getHomepage,
    addAsset,
    addStock,
    addCrypto,
    addOther,
    deleteAsset
}