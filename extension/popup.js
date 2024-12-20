const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
  const status = document.getElementById('status');
  const usersList = document.getElementById('users-list');
  const usernameInput = document.getElementById('leetcode-username');
  const radiusInput = document.getElementById('radius');
  const radiusValue = document.getElementById('radius-value');
  const findNearbyButton = document.getElementById('find-nearby');

  // Update radius value display
  radiusInput.addEventListener('input', function() {
    radiusValue.textContent = this.value;
  });

  // Load saved settings
  chrome.storage.local.get(['leetcodeUsername', 'searchRadius'], function(result) {
    if (result.leetcodeUsername) {
      usernameInput.value = result.leetcodeUsername;
    }
    if (result.searchRadius) {
      radiusInput.value = result.searchRadius;
      radiusValue.textContent = result.searchRadius;
    }
  });

  findNearbyButton.addEventListener('click', function() {
    const leetcodeUsername = usernameInput.value.trim();
    const radius = parseInt(radiusInput.value);
    
    if (!leetcodeUsername) {
      status.textContent = 'Please enter your LeetCode username';
      return;
    }

    // Save settings
    chrome.storage.local.set({ 
      leetcodeUsername,
      searchRadius: radius
    });

    // Get location and find nearby users
    status.textContent = 'Getting your location...';
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          status.textContent = 'Finding nearby LeetCoders...';
          
          // Update user's location
          await updateLocation(leetcodeUsername, position.coords.latitude, position.coords.longitude);
          
          // Find nearby users with custom radius
          const users = await findNearbyUsers(
            position.coords.latitude, 
            position.coords.longitude, 
            leetcodeUsername,
            radius
          );
          
          displayUsers(users, position.coords);
          status.textContent = users.length > 0 
            ? `Found ${users.length} LeetCoders within ${radius}km!` 
            : `No LeetCoders found within ${radius}km`;
        } catch (error) {
          status.textContent = 'Error: ' + error.message;
        }
      },
      (error) => {
        status.textContent = 'Error getting location: ' + error.message;
      }
    );
  });
});

function getGoogleMapsUrl(userLat, userLng, myLat, myLng) {
  // Creates a Google Maps URL with both locations marked
  return `https://www.google.com/maps/dir/?api=1&origin=${myLat},${myLng}&destination=${userLat},${userLng}`;
}

function getGoogleMapsStaticUrl(userLat, userLng, myLat, myLng) {
  // Creates a static map URL showing both points
  return `https://maps.googleapis.com/maps/api/staticmap?size=300x150&markers=color:blue|label:Y|${myLat},${myLng}&markers=color:red|label:T|${userLat},${userLng}&zoom=12`;
}

async function updateLocation(leetcodeUsername, latitude, longitude) {
  const response = await fetch(`${API_BASE_URL}/users/location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ leetcodeUsername, latitude, longitude })
  });

  if (!response.ok) {
    throw new Error('Failed to update location');
  }
}

async function findNearbyUsers(latitude, longitude, username, radius) {
  const maxDistance = radius * 1000;
  
  const response = await fetch(
    `${API_BASE_URL}/users/nearby?latitude=${latitude}&longitude=${longitude}&maxDistance=${maxDistance}&username=${username}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch nearby users');
  }

  return response.json();
}
function getGoogleMapsUrl(userLat, userLng) {
  // Creates a Google Maps URL that shows just the user's location
  return `https://www.google.com/maps?q=${userLat},${userLng}`;
}

function displayUsers(users, myCoords) {
  const usersList = document.getElementById('users-list');
  usersList.innerHTML = '';
  
  users.forEach(user => {
    // Extract coordinates from the user object
    const [userLng, userLat] = user.location.coordinates;
    
    const userCard = document.createElement('div');
    userCard.className = 'user-card';
    userCard.innerHTML = `
      <h3>${user.leetcodeUsername}</h3>
      <p>Distance: ${user.distance}</p>
      <p>Rating: ${user.rating}</p>
      <p>Problems Solved: ${user.problemsSolved}</p>
      <div class="user-links">
        <a href="https://leetcode.com/${user.leetcodeUsername}" target="_blank" class="btn leetcode-btn">LeetCode Profile</a>
        <a href="${getGoogleMapsUrl(userLat, userLng)}" 
           target="_blank" class="btn map-btn">Show Location 📍</a>
      </div>
    `;
    usersList.appendChild(userCard);
  });
}