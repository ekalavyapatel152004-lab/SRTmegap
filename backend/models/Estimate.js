const mongoose = require('mongoose');

const EstimateSchema = new mongoose.Schema({
    customerName: { type: String },
    phoneNumber: { type: String },
    invoiceDate: { type: String },
    rows: [{
        id: Number,
        qty: Number,
        length: Number,
        width: Number,
        thickness: Number,
        teakType: String,
        rate: Number
    }],
    gstPercent: Number,
    makingCost: Number,
    grandTotal: Number // Saved for quick display on dashboard
}, { timestamps: true });

module.exports = mongoose.model('Estimate', EstimateSchema);