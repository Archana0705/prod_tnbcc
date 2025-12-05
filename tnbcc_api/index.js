const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const actsRoutes = require('./routes/actsRoutes')
const acttnRoutes = require('./routes/acttnRoutes')
const govordersRoutes = require('./routes/govordersRoutes')
const budgetRoutes = require('./routes/budgetRoutes')
const bugettnRoutes = require('./routes/bugettnRoutes')
const centralobcRoutes = require('./routes/centralobcRoutes')
const citizencharterRoutes = require('./routes/citizencharterRoutes')
const communityenRoutes = require('./routes/communityenRoutes')
const communitytnRoutes = require('./routes/communitytnRoutes')
const communitylistgoRoutes = require('./routes/communitylistgoRoutes')
const comsionconsenRoutes = require('./routes/comsionconsenRoutes')
const comsionconstnRoutes = require('./routes/comsionconstnRoutes')
const contactusRoutes = require('./routes/contactusRoutes')
const rticontactRoutes = require('./routes/rticontactRoutes')
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Routes
app.use('/auth', authRoutes);

app.use('/acts',actsRoutes);
app.use('/actstn',acttnRoutes);
app.use('/go',govordersRoutes);
app.use('/budget',budgetRoutes);
app.use('/budgettn',bugettnRoutes);
app.use('/citizencharter',citizencharterRoutes);
app.use('/centralobclist',centralobcRoutes);
app.use('/communityen',communityenRoutes);
app.use('/communitytn',communitytnRoutes);
app.use('/communitylistgo',communitylistgoRoutes);
app.use('/commissionconen',comsionconsenRoutes);
app.use('/commissioncontn',comsionconstnRoutes);
app.use('/contactus',contactusRoutes);
app.use('/rticontactus',rticontactRoutes);

// Start server
const PORT = process.env.PORT || 2210;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
