import { Schema, model } from 'mongoose';

const userSchema = new Schema({
    name: { type: String, required: true, maxLength: 100 },
    email: { 
        type: String, 
        required: true, 
        maxLength: 100, 
        unique: true, 
        match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/ // Validación de email
    },
    password: { type: String, required: true, minLength: 6 }, // Se recomienda mínimo 6 caracteres
    phone: { type: String, required: true, maxLength: 20 }, // Mejor limitar a 20 caracteres
    role: { 
        type: String, 
        required: true, 
        enum: ["admin", "user", "vendor"], // Si hay roles específicos
        default: "user" 
    },
    address: { type: String, required: true, maxLength: 200 }, // Aumentar a 200 caracteres si es necesario
    imgUrl: { type: String, required: false }, // No siempre es obligatorio

}, {
    timestamps: true,
    strict: true, // Mejor mantenerlo en true por seguridad
});

module.exports = mongoose.model("Users", userSchema, "Users");
