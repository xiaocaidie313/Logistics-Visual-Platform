import axios from "axios";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

const request = axios.create({
  //   baseURL: API_BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data.code !== 200) {
      return Promise.reject(data.message);
    }
    return response;
  },
  (error) => {
    const { status, data } = error.response;
    console.log(error);
    if (status === 401) {
      // 401 token失效专属信号
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(data?.message || "请求失败");
  }
);

export default request;
