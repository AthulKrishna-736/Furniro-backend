import userModel from "../../models/userModel.js";
import bcrypt from 'bcrypt';

export const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (!user.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admins only.' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        return res.status(200).json({ message: 'Admin login successful' });

    } catch (error) {
        console.error('Error during admin login:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}