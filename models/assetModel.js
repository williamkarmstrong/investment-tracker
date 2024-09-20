const mongoose = require('mongoose');

const schema = mongoose.Schema

const assetSchema = new schema({
    name: {
        type: String,
    },
    symbol: {
        type: String,
        required: true,
    },
    assetType: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    price: {
        type: Number
    },
    value: {
        type: Number
    }
}, { timestamps: true });

module.exports = mongoose.model('Asset', assetSchema);