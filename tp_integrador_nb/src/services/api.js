const BASE_URL = 'http://localhost:3000/api';

export const registerUser = async (userData) => {
  const response = await fetch(\`\${BASE_URL}/user/register\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return response.json();
};

export const loginUser = async (credentials) => {
  const response = await fetch(\`\${BASE_URL}/user/login\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return response.json();
};

export const fetchEvents = async (token, params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(\`\${BASE_URL}/event/?\${query}\`, {
    headers: { Authorization: \`Bearer \${token}\` },
  });
  return response.json();
};

export const fetchEventById = async (token, id) => {
  const response = await fetch(\`\${BASE_URL}/event/\${id}\`, {
    headers: { Authorization: \`Bearer \${token}\` },
  });
  return response.json();
};

export const createEvent = async (token, eventData) => {
  const response = await fetch(\`\${BASE_URL}/event/\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
    body: JSON.stringify(eventData),
  });
  return response.json();
};

export const updateEvent = async (token, eventData) => {
  const response = await fetch(\`\${BASE_URL}/event/\`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
    body: JSON.stringify(eventData),
  });
  return response.json();
};

export const deleteEvent = async (token, id) => {
  const response = await fetch(\`\${BASE_URL}/event/\${id}\`, {
    method: 'DELETE',
    headers: { Authorization: \`Bearer \${token}\` },
  });
  return response.json();
};

export const enrollEvent = async (token, id) => {
  const response = await fetch(\`\${BASE_URL}/event/\${id}/enrollment\`, {
    method: 'POST',
    headers: { Authorization: \`Bearer \${token}\` },
  });
  return response.json();
};

export const unenrollEvent = async (token, id) => {
  const response = await fetch(\`\${BASE_URL}/event/\${id}/enrollment\`, {
    method: 'DELETE',
    headers: { Authorization: \`Bearer \${token}\` },
  });
  return response.json();
};

export const fetchEventLocations = async (token, params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(\`\${BASE_URL}/event-location/?\${query}\`, {
    headers: { Authorization: \`Bearer \${token}\` },
  });
  return response.json();
};

export const createEventLocation = async (token, locationData) => {
  const response = await fetch(\`\${BASE_URL}/event-location/\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
    body: JSON.stringify(locationData),
  });
  return response.json();
};

export const updateEventLocation = async (token, locationData) => {
  const response = await fetch(\`\${BASE_URL}/event-location/\`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${token}\` },
    body: JSON.stringify(locationData),
  });
  return response.json();
};

export const deleteEventLocation = async (token, id) => {
  const response = await fetch(\`\${BASE_URL}/event-location/\${id}\`, {
    method: 'DELETE',
    headers: { Authorization: \`Bearer \${token}\` },
  });
  return response.json();
};
