(() => {
  class ApiError extends Error { constructor(message, status, code) { super(message); this.status = status; this.code = code; } }
  window.topzoneApi = async (path, {method = 'GET', body, token, headers = {}} = {}) => {
    const config = window.TOPZONE_CONFIG || {};
    if (!config.supabaseUrl || !config.publishableKey) throw new ApiError('신청 시스템 연결을 준비 중입니다. 잠시 후 다시 이용해 주세요.', 503);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 18000);
    try {
      const response = await fetch(config.supabaseUrl.replace(/\/$/, '') + path, {
        method, signal: controller.signal,
        headers: {apikey: config.publishableKey, 'Content-Type': 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {}), ...headers},
        ...(body !== undefined ? {body: JSON.stringify(body)} : {})
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new ApiError(data?.message || data?.msg || '요청을 처리하지 못했습니다.', response.status, data?.code);
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('연결이 원활하지 않습니다. 입력 내용은 유지되니 다시 시도해 주세요.', 0);
    } finally { clearTimeout(timer); }
  };
})();
