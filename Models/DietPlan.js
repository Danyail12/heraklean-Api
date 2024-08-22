import mongoose from 'mongoose';

const dietPlanSchema = new mongoose.Schema({
  dietTitle: {
    type: String,
    required: true
  },
  meal1: {
    title: String,
    description: String,
    protein: Number,
    calories: Number,
    carb: Number
  },  
  meal2: {
    title: String,
    description: String,
    protein: Number,
    calories: Number,
    carb: Number
  },
  meal3: {
    title: String,
    description: String,
    protein: Number,
    calories: Number,
    carb: Number
  }
});

const DietPlan = mongoose.model('DietPlan', dietPlanSchema);

export default DietPlan;
