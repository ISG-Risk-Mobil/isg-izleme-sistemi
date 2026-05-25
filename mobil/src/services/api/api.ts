import { BASE_URL } from '../../config/api';

type ApiOptions = {
  endpoint: string;
  method?: string;
  data?: any;
  token?: string;
};

export const apiCall = async ({
  endpoint,
  method = 'GET',
  data,
  token,
}: ApiOptions) => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.Authorization =
        `Bearer ${token}`;
    }

    const url =
      `${BASE_URL}${endpoint}`;

    console.log(
      `[API] ${method} ${url}`,
    );

    const controller =
      new AbortController();

    const timeout =
      setTimeout(
        () => controller.abort(),
        10000,
      );

    const response =
      await fetch(url, {
        method,
        headers,
        body: data
          ? JSON.stringify(data)
          : undefined,
        signal: controller.signal,
      });

    clearTimeout(timeout);

    let result;

    try {
      result =
        await response.json();
    } catch {
      result = {
        success: false,
        message:
          'Geçersiz sunucu cevabı',
      };
    }

    if (!response.ok) {
      throw new Error(
        result?.message ||
          'İstek başarısız',
      );
    }

    return result;

  } catch (error: any) {
    console.log(
      'API ERROR:',
      error.message,
    );

    return {
      success: false,
      message:
        error.message ||
        'Sunucu bağlantı hatası',
    };
  }
};