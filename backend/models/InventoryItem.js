const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    farm: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemName: { type: String, required: [true, 'Item name is required'], trim: true },
    category: {
      type: String,
      enum: ['Seeds', 'Fertilizer', 'Pesticide', 'Equipment', 'Fuel', 'Other'],
      default: 'Other',
    },
    quantity: { type: Number, required: true, default: 0 },
    unit: { type: String, default: 'units', trim: true },
    lowStockThreshold: { type: Number, default: null },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
