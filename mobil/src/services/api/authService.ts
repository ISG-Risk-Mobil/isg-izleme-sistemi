const API_URL = 'http://192.168.1.109:5000/api';

export const loginUser = async (
  email: string,
  password: string,
) => {

  const response = await fetch(
    `${API_URL}/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    }
  );

  const data = await response.json();

  return data;
};