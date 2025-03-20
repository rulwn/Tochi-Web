/*
    Campos:
        cartId
        state
        address
        payingMetod
*/

import { Schema, model } from "mongoose";

const OrderSchema = new Schema({
    cartId: { 
        type: Schema.Types.ObjectId, 
        ref: "Cart",
        required: true
    }, 
    state: { 
        type: String,
        enum: ["Pendiente", "Entregado"],
        required: true,
    },
    address: { 
        type: String, 
        maxlength: 200,
        required: true
    },
    payingMetod: { 
        type: String,
        enum: ["Efectivo", "Tarjeta"],
        required: true 
    }
})

const Order = model("Order", OrderSchema, "Order")
export default Order;