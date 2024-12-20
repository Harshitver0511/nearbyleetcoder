const axios = require('axios');

const fetchLeetCodeProfile = async (username) => {
  try {
    const query = `
      query userProfile($username: String!) {
        matchedUser(username: $username) {
          submitStats {
            acSubmissionNum {
              difficulty
              count
              submissions
            }
          }
          profile {
            ranking
          }
        }
      }
    `;

    const response = await axios.post('https://leetcode.com/graphql', {
      query,
      variables: { username }
    });

    const userData = response.data.data.matchedUser;
    return {
      problemsSolved: userData.submitStats.acSubmissionNum[0].count,
      rating: userData.profile.ranking || 1500
    };
  } catch (error) {
    console.error('Error fetching LeetCode profile:', error);
    return { problemsSolved: 0, rating: 1500 };
  }
};

module.exports = { fetchLeetCodeProfile };