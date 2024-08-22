import mongoose from 'mongoose';

const trainerSchema = new mongoose.Schema({
  Fname: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePic: String,
  location: String,
  title: String,
  programPlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProgramPlan'
  }],
  dietPlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DietPlan'
  }],
  clients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  }]
});

const Trainer = mongoose.model('Trainer', trainerSchema);
export default Trainer;
