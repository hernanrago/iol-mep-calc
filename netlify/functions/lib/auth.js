import fetch from "node-fetch";

const username = process.env.IOL_USERNAME;
const password = process.env.IOL_PASSWORD;

let tokenCache = {
  access_token: null,
  refresh_token: null,
  expires_at: null
};

async function refreshToken(refreshToken) {
  console.log('Refreshing authentication token...');
  const formData = new URLSearchParams();
  formData.append("refresh_token", refreshToken);
  formData.append("grant_type", "refresh_token");

  const response = await fetch("https://api.invertironline.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData
  });

  if (!response.ok) {
    console.error('Token refresh failed:', response.status, response.statusText);
    throw new Error("Failed to refresh token: " + response.statusText);
  }

  const data = await response.json();
  console.log('Token refreshed successfully');
  
  tokenCache.access_token = data.access_token;
  tokenCache.refresh_token = data.refresh_token;
  tokenCache.expires_at = Date.now() + (data.expires_in * 1000);
  
  return data.access_token;
}

export async function getToken() {
  if (tokenCache.access_token && tokenCache.expires_at && Date.now() < tokenCache.expires_at) {
    console.log('Using cached token');
    return tokenCache.access_token;
  }

  if (tokenCache.refresh_token) {
    try {
      console.log('Token expired, attempting refresh...');
      return await refreshToken(tokenCache.refresh_token);
    } catch (error) {
      console.log('Token refresh failed, requesting new token...');
      tokenCache.access_token = null;
      tokenCache.refresh_token = null;
      tokenCache.expires_at = null;
    }
  }

  console.log('Requesting new authentication token...');
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);
  formData.append("grant_type", "password");

  const response = await fetch("https://api.invertironline.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData
  });

  if (!response.ok) {
    console.error('Authentication failed:', response.status, response.statusText);
    throw new Error("Failed to authenticate: " + response.statusText);
  }

  const data = await response.json();
  console.log('Authentication successful');
  
  tokenCache.access_token = data.access_token;
  tokenCache.refresh_token = data.refresh_token;
  tokenCache.expires_at = Date.now() + (data.expires_in * 1000);
  
  return data.access_token;
}