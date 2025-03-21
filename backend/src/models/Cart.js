import { Schema, model } from "mongoose";
const cartProductSchema = new Schema({
    idProduct: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1  
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    }
});

const cartSchema = new Schema({
    idClient: { 
        type: Schema.Types.ObjectId,
        ref: "User", 
        required: true
    },
    Products: [cartProductSchema], 
    total: {
        type: Number,
        required: true,
        min: 0
    },
    state: {  
        type: String,
        enum: ["Pendiente", "Confirmado", "Cancelado"], 
        default: "Pendiente"
    }
}, {
    timestamps: true
});

const Cart = model("Cart", cartSchema, "Cart");
export default Cart;