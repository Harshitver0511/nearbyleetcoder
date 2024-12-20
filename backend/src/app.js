const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const User = require('./models/User');
const { fetchLeetCodeProfile } = require('./utils/leetcodeAPI');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes

// Register/Update user location
app.post('/api/users/location', async (req, res) => {
  try {
    const { leetcodeUsername, latitude, longitude } = req.body;
    
    // Fetch LeetCode profile
    const leetcodeProfile = await fetchLeetCodeProfile(leetcodeUsername);

    // Update or create user
    const user = await User.findOneAndUpdate(
      { leetcodeUsername },
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        lastActive: new Date(),
        problemsSolved: leetcodeProfile.problemsSolved,
        rating: leetcodeProfile.rating
      },
      { upsert: true, new: true }
    );

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get nearby users
// app.get('/api/users/nearby', async (req, res) => {
//   try {
//     const { latitude, longitude, maxDistance = 5000, username } = req.query; // maxDistance in meters

//     const nearbyUsers = await User.find({
//       location: {
//         $near: {
//           $geometry: {
//             type: 'Point',
//             coordinates: [parseFloat(longitude), parseFloat(latitude)]
//           },
//           $maxDistance: parseInt(maxDistance)
//         }
//       },
//       leetcodeUsername: { $ne: username } // Exclude current user
//     });

//     // Calculate distance for each user
//     const usersWithDistance = nearbyUsers.map(user => {
//       const distance = calculateDistance(
//         latitude,
//         longitude,
//         user.location.coordinates[1],
//         user.location.coordinates[0]
//       );
      
//       return {
//         leetcodeUsername: user.leetcodeUsername,
//         problemsSolved: user.problemsSolved,
//         rating: user.rating,
//         distance: `${distance.toFixed(1)}km`
//       };
//     });

//     res.json(usersWithDistance);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });
app.get('/api/users/nearby', async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 5000, username } = req.query;

    const nearbyUsers = await User.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      },
      leetcodeUsername: { $ne: username }
    });

    // Calculate distance and include coordinates
    const usersWithDistance = nearbyUsers.map(user => {
      const distance = calculateDistance(
        latitude,
        longitude,
        user.location.coordinates[1],
        user.location.coordinates[0]
      );
      
      return {
        leetcodeUsername: user.leetcodeUsername,
        problemsSolved: user.problemsSolved,
        rating: user.rating,
        distance: `${distance.toFixed(1)}km`,
        location: user.location // Include the full location object
      };
    });

    res.json(usersWithDistance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});