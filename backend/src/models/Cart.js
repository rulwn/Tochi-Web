import { Schema, model } from "mongoose";


const cartProductSchema = new Schema({
    productId: {
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
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User", 
        required: true
    },
    products: [cartProductSchema], 
    total: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ["Pendiente", "Confirmado", "Cancelado"], 
        default: "Pendiente"
    }
}, {
    timestamps:true,
    strict:false
}); 

const Cart = model("Cart", cartSchema, "Cart");

export default Cart;