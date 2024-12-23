// const {config} = require('dotenv')
// config();
import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT , ()=>{
    console.log(`App is Running on http:localhost${PORT}`);
    
})