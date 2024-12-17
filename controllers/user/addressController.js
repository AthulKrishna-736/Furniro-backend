import addressModel from "../../models/addressSchema.js"

//add address
export const addAddress = async (req, res, next) => {
  const { userId } = req.params;
  const { name, phoneNumber, pincode, locality, state, type, district } = req.body;

  console.log('reqbody and param in addAddress: ', [req.params, req.body]);

  // Sample validation check for missing values in the request body
  if (!name || !phoneNumber || !pincode || !locality || !state || !type || !district) {
    return next({ statusCode: 400, message: 'All fields are required: name, phoneNumber, pincode, locality, state, type, district' });
  }

  const newAddress = new addressModel({
    user: userId,
    name,
    phoneNumber,
    pincode,
    locality,
    state,
    type,
    district,
  });

  const savedAddress = await newAddress.save();

  if (!savedAddress) {
    return next({ statusCode: 500, message: 'Error while adding address' });
  }

  console.log('address added successfully');
  res.status(200).json({ message: 'Address added successfully', address: savedAddress });
};

//get address
export const getAddress = async (req, res, next) => {
  const { userId } = req.params; 
  console.log('params in getAddress: ', [req.params, userId]);

  const addresses = await addressModel.find({ user: userId });

  if (!addresses.length) {
      console.log('No addresses found.');
      return next({ statusCode: 404, message: 'No addresses found for the user.' });
  }

  console.log('Addresses found and responded');
  res.status(200).json({ message: 'Addresses retrieved successfully', addresses });
};

//delete address
export const deleteAddress = async (req, res, next) => {
  const { Id } = req.params;
  console.log('req params in deleteAddress: ', [req.params, Id]);

  const deletedAddress = await addressModel.findByIdAndDelete(Id);

  if (!deletedAddress) {
      console.log('Address not found');
      return next({ statusCode: 404, message: 'Address not found' });
  }

  console.log('Address deleted successfully');
  res.status(200).json({ message: 'Address deleted successfully' });
};

//update address
export const updateAddress = async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  console.log('Request body and params in updateAddress: ', { params: req.params, body: req.body });

  if (!id) {
      console.log('Address ID is missing in parameters');
      return next({ statusCode: 400, message: 'Address ID is required' });
  }

  console.log('Attempting to update address...');
  const updatedAddress = await addressModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
  );

  if (!updatedAddress) {
      console.log('Address not found for update');
      return next({ statusCode: 404, message: 'Address not found' });
  }

  console.log('Address updated successfully');
  res.status(200).json({
      message: 'Address updated successfully',
      address: updatedAddress,
  });
};
