// src/admin/AdminRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const ADMIN_EMAIL = "amankalyanwat@gmail.com";

export default function AdminRoute({ children }) {
  const { user } = useAuth();

  if (!user || user.email !== ADMIN_EMAIL) {
    return <Navigate to="/" replace />;
  }

  return children;
}
