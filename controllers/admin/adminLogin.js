import userModel from "../../models/userModel.js";
import bcrypt from 'bcrypt';

export const adminLogin = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email }).catch((error) => {
    console.error('Error finding user:', error);
    return next({ statusCode: 400, message: 'User not found' });
  });

  if (!user) {
    return next({ statusCode: 400, message: 'User not found' });
  }

  if (!user.isAdmin) {
    return next({ statusCode: 403, message: 'Access denied. Admins only.' });
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password).catch((error) => {
    console.error('Error comparing passwords:', error);
    return next({ statusCode: 400, message: 'Invalid credentials' });
  });

  if (!isPasswordCorrect) {
    return next({ statusCode: 400, message: 'Invalid credentials' });
  }

  return res.status(200).json({ message: 'Admin login successful' });
};
