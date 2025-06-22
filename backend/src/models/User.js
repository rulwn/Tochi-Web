import { Schema, model } from 'mongoose';

// Schema para las direcciones de envío
const addressSchema = new Schema({
    title: { 
        type: String, 
        required: true, 
        maxLength: 50 
    },
    address: { 
        type: String, 
        required: true, 
        maxLength: 300 
    },
    contactNumber: { 
        type: String, 
        required: false, 
        maxLength: 20 
    },
    isDefault: { 
        type: Boolean, 
        default: false 
    }
}, {
    timestamps: true
});

const userSchema = new Schema({
    name: { type: String, required: true, maxLength: 100 },
    email: { 
        type: String, 
        required: true, 
        maxLength: 100, 
        unique: true, 
        match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/ 
    },
    password: { type: String, required: true }, 
    phone: { type: String, required: true, maxLength: 20 }, 
    role: { 
        type: String, 
        required: true, 
        enum: ["Administrador", "Cliente", "Empleado"]
    },
    address: { type: String, required: true, maxLength: 200 }, // Dirección principal (retrocompatibilidad)
    addresses: [addressSchema], // Array de direcciones de envío
    imgUrl: { type: String, required: false }, 
}, {
    timestamps: true,
    strict: true, 
});

// Sin middlewares - la lógica se manejará en el controlador

userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.__v;
    return user;
};

export default model("Users", userSchema, "Users");