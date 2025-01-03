import addressModel from "../../models/addressSchema.js"

//add address
export const addAddress = async (req, res, next) => {
  const { userId } = req.params;
  const { name, phoneNumber, pincode, locality, state, type, district, altPhoneNumber } = req.body;

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
    altPhoneNumber,
  });

  const savedAddress = await newAddress.save();
  if (!savedAddress) {
    return next({ statusCode: 500, message: 'Error while adding address' });
  }

  res.status(200).json({ message: 'Address added successfully', address: savedAddress });
};

//get address
export const getAddress = async (req, res, next) => {
  const { userId } = req.params; 

  const addresses = await addressModel.find({ user: userId });
  if (!addresses.length) {
      return next({ statusCode: 404, message: 'No addresses found. Please add' });
  }

  res.status(200).json({ message: 'Addresses retrieved successfully', addresses });
};

//delete address
export const deleteAddress = async (req, res, next) => {
  const { Id } = req.params;

  const deletedAddress = await addressModel.findByIdAndDelete(Id);
  if (!deletedAddress) {
      return next({ statusCode: 404, message: 'Address not found' });
  }

  res.status(200).json({ message: 'Address deleted successfully' });
};

//update address
export const updateAddress = async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  console.log('Request body and params in updateAddress: ', [req.params, req.body]);

  if (!id) {
      return next({ statusCode: 400, message: 'Address ID is required' });
  }

  const existingAddress = await addressModel.findById(id);
  if(!existingAddress) {
    return next({ statusCode: 404, message: 'Address not found' });
  }
  console.log('existing add: ',existingAddress)

  const hasChanges = Object.keys(updateData).some(
    (key) => updateData[key] !== existingAddress[key]?.toString() // Convert to string for safe comparison
  );

  if(!hasChanges) {
    console.log('skipping no changes detected ')
    return next({ statusCode:200, message:'No changes detected' })
  }

  const updatedAddress = await addressModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
  );

  console.log('update address: ', updateAddress)

  if (!updatedAddress) {
      return next({ statusCode: 404, message: 'Address not found' });
  }

  res.status(200).json({
      message: 'Address updated successfully',
      address: updatedAddress,
  });
};
