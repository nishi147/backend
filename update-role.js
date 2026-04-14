const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    try {
      const db = mongoose.connection.db;
      await db.collection('users').updateOne(
        { email: 'admin@ruzann.com' },
        { 
          $set: { 
            role: 'admin',
            name: 'Ruzann'
          },
          $unset: {
            profilePicture: ""
          }
        }
      );
      console.log('Fixed admin account');
    } catch (error) {
      console.error(error);
    } finally {
      mongoose.disconnect();
    }
  });
