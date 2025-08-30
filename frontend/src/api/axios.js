// import axios from 'axios';

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE,
//   withCredentials: true // for refresh cookie
// });

// // --- Attach access token from Zustand ---
// export const setAuthTokenGetter = (getter) => {
//   api.interceptors.request.use((config) => {
//     const token = getter();
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   });
// };

// // --- Refresh queue logic ---
// let isRefreshing = false;
// let refreshQueue = [];

// function processQueue(error, token = null) {
//   refreshQueue.forEach(p => {
//     if (error) p.reject(error);
//     else p.resolve(token);
//   });
//   refreshQueue = [];
// }

// api.interceptors.response.use(
//   res => res,
//   async error => {
//     const originalRequest = error.config;

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       if (isRefreshing) {
//         return new Promise((resolve, reject) => {
//           refreshQueue.push({
//             resolve: (token) => {
//               originalRequest.headers.Authorization = `Bearer ${token}`;
//               resolve(api(originalRequest));
//             },
//             reject
//           });
//         });
//       }

//       originalRequest._retry = true;
//       isRefreshing = true;

//       try {
//         // ✅ Ensure consistent API route
//         const { data } = await axios.post(
//           `${import.meta.env.VITE_API_BASE}/api/auth/refresh`,
//           {},
//           { withCredentials: true }
//         );

//         const newToken = data.accessToken;
//         localStorage.setItem("accessToken", newToken);

//         processQueue(null, newToken);

//         return api({
//           ...originalRequest,
//           headers: { ...originalRequest.headers, Authorization: `Bearer ${newToken}` }
//         });
//       } catch (err) {
//         processQueue(err, null);
//         return Promise.reject(err);
//       } finally {
//         isRefreshing = false;
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;



import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  withCredentials: true // for refresh cookie
});

// --- Attach access token from Zustand ---
export const setAuthTokenGetter = (getter) => {
  api.interceptors.request.use((config) => {
    const token = getter();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
};

// --- Refresh queue logic ---
let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach(p => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newToken = data.accessToken;
        
        // Update both localStorage and trigger store update
        localStorage.setItem("accessToken", newToken);
        
        // You'll need to get the store updater here or trigger a custom event
        // For now, localStorage will work with your current setup
        
        processQueue(null, newToken);

        return api({
          ...originalRequest,
          headers: { ...originalRequest.headers, Authorization: `Bearer ${newToken}` }
        });
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem("accessToken");
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;