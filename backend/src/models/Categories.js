import { Schema, model } from "mongoose";

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        maxLength: 20
    }
}, { 
    strict: false, 
    timestamps: true 
});

export default model("Categories", categorySchema, "Categories");