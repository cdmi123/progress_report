const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  contact: String, 
  status:{
    type:String,default:'Active'
  },
  role:{
    type:Number , default:2
  }
});

module.exports = mongoose.model('Admin', adminSchema);
