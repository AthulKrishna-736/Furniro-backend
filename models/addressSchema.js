import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true, 
    },
    name: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    pincode: {
      type: String,
    },
    locality: {
      type: String,
    },
    district: {
      type: String,
    },
    state: {
      type: String,
    },
    type: {
      type: String,
    },
  },
  { timestamps: true }
); 

const addressModel = mongoose.model('Address', addressSchema);

export default addressModel;
