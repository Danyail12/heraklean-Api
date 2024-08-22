import app from "./App.js";
import { connectDB } from "./Config/database.js";

connectDB();
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port : ${ process.env.PORT }`);
})
