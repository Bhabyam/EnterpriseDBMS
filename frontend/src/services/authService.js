import API from "./api";

export const loginUser = async (data) => {
  const res = await API.post("/api/auth/login", data);
  return res.data.data; // VERY IMPORTANT
};

export const logoutUser = async (session_id) => {
  await API.post("/api/auth/logout", { session_id });
};