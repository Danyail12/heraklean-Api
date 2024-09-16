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
    commingMeeting: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting'
    }],
    notification: [{
      type: String
    }],
    weightGraph: [{
      date: { type: Date, default: Date.now },
      weight: Number,
    }],
    weight:[{
      type:Object,
    }]

    ,
    diet:[{
      type:Object,
    }],

    workout:[{
      type:Object,
    }],
    meetingRequest:[{
      type:Object,
    }],
    customdiet: [
      {
        day: { type: String },
        meals: [
          {
            title: { type: String },
            description: { type: String },
            category: { type: String },
            date: { type: Date },
          },
        ],
      },
    ],
    number:{
      type:Number
    },


  });

  const Client = mongoose.model('Client', clientSchema);
  export default Client;
