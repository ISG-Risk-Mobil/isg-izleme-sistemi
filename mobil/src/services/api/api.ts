import { BASE_URL } from "../../config/api";

export const apiCall = async (endpoint: string, method: string, data?: any, token?: string) => {
  try {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // BASE_URL (http://10.0.2.2:5000/api) + endpoint (/auth/login)
    const url = `${BASE_URL}${endpoint}`;
    
    console.log(`İstek atılıyor: ${method} ${url}`);

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("API Çağrı Hatası:", error);
    return { success: false, message: 'Sunucuya ulaşılamadı!' };
  }
};