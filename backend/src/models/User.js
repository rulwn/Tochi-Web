import { Schema, model } from 'mongoose';

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
        enum: ["Administrador", "Cliente"]
    },
    address: { type: String, required: true, maxLength: 200 },
    imgUrl: { type: String, required: false }, 
}, {
    timestamps: true,
    strict: true, 
});

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

export default model("Users", userSchema, "Users");