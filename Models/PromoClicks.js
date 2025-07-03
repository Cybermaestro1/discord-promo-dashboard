const mongoose = require('mongoose');

const PromoClickSchema = new mongoose.Schema({
    userId: String,
    promoTitle: String,
    timestamp: Date
});

module.exports = mongoose.model('PromoClick', PromoClickSchema);
