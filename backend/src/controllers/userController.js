import User from "../models/User.js";

const usersController = {};

// Get all users
usersController.getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving users", error: error.message });
    }
};

// Get user by ID
usersController.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving user", error: error.message });
    }
};

// Create a new user
usersController.createUser = async (req, res) => {
    try {
        const { name, email, password, phone, role, address, imgUrl } = req.body;
        const newUser = new User({ name, email, password, phone, role, address, imgUrl });
        await newUser.save();
        res.json({ message: "User created", user: newUser });
    } catch (error) {
        res.status(500).json({ message: "Error creating user", error: error.message });
    }
};

// Update user by ID
usersController.updateUser = async (req, res) => {
    try {
        const { name, email, phone, role, address, imgUrl } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, phone, role, address, imgUrl },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User updated", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Error updating user", error: error.message });
    }
};

// Delete user by ID
usersController.deleteUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ message: "User deleted", user: deletedUser });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user", error: error.message });
    }
};

export default usersController;