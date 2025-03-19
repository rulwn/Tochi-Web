import { Schema, model } from 'mongoose';

const productSchema = new Schema({

    name: { type: String, required: true, maxLength: 100 },
    description: { type: String, required: true, maxLength: 1000 },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    idCategory: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    imageUrl: { type: String, required: true },
}, {
    timestamps: true,
    strict: false,
});

export default model('Product', productSchema, 'Product');	