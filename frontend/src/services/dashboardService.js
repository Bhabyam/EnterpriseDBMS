import API from "./api";

export const getAdminDashboard = async () => {
  const res = await API.get("/api/dashboard/admin");
  return res.data.data;
};