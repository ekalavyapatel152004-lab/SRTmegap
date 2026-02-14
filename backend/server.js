require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
// Render needs process.env.PORT to assign its own port
const PORT = process.env.PORT || 5000; 

app.use(cors());
app.use(express.json());

// Connect to Cloud MongoDB (Syntax error fixed here)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Database Connected Successfuly'))
  .catch(err => console.log(err));

const estimatesRouter = require('./routes/estimates');
app.use('/api/estimates', estimatesRouter);

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});