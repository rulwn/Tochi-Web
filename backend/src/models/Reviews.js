/*
    Campos:
        usersId
        productId   
        qualification
        comments
*/

import { Schema, model } from "mongoose"

const reviewSchema = new Schema({
    usersId: {
        type: Schema.Types.ObjectId,
        ref: "Users",
        require: true
    },
    productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        require: true
    },
    qualification: {
        type: Number,
        require: true,
        min: 0,
        max: 5
    },
    comments: {
        type: String,
        require: true,
        maxLength: 300
    }
}, {strict: false,
    timestamps: true
})

export default model('Reviews', reviewSchema, 'Reviews')

