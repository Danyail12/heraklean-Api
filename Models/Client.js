import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  profilePic: String,
  startingWeight: Number,
  attachDiet: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DietPlan'
  }],
  attachProgram: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProgramPlan'
  }],
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  subscription: {
    type: String,
  },
  subamount: Number,
  fullname: {
    type: String,
  },
  ActivePlan: [{
    type:Object,
  }],
  ActiveNutrition: [{
    type:Object,
  }],
  measurements: {
    chestBack: { type: String, default: "0" },
    rightArm: { type: String, default: "0" },
    leftArm: { type: String, default: "0" },
    rightLeg: { type: String, default: "0" },
    leftLeg: { type: String, default: "0" },
    waist: { type: String, default: "0" },
  },
  weightGraph: [{
    date: { type: Date, default: Date.now },
    weight: Number,
  }],
  membershipExpiresOn: {
    type: Date,
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer'
  },
  password:{
    type:String
  },
  commingMeeting:[{
    type:Object
  }],

  weightGraph:{
        type:String
  },
  weight:[{
    type:Object,
  }]

  ,
  notification:{
    type:String
  },
  diet:[{
    type:Object,
  }],

  workout:[{
    type:Object,
  }]

});

const Client = mongoose.model('Client', clientSchema);
export default Client;
