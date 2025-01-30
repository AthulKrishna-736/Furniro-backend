import userModel from "../../../models/userModel.js";

// Get users
export const getUsers = async (req, res, next) => {
  const users = await userModel.find().catch((err) => {
    console.error(err);
    return next({ statusCode: 500, message: 'Server Error. Please try again later' });
  });

  return res.status(200).json({ message: 'All users have been sent', users });
};

// Block users
export const blockUser = async (req, res, next) => {
  const { id } = req.params;

  const user = await userModel.findById(id).catch((error) => {
    console.error('Error finding user:', error);
    return next({ statusCode: 404, message: 'User not found' });
  });

  user.isBlocked = !user.isBlocked;
  await user.save().catch((error) => {
    console.error('Error toggling user block status', error);
    return next({ statusCode: 500, message: 'Internal server error' });
  });

  return res.status(200).json({ message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully` });
};
