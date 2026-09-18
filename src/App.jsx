// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Subjects from "./pages/Subjects";
import Materials from "./pages/Materials";
import AdminRoute from "./admin/AdminRoute";
import AdminDashboard from "./admin/AdminDashboard";
import VideoMaterials from "./pages/VideoMaterials";
import NotesMaterials from "./pages/NotesMaterials";
import McqMaterials from "./pages/McqMaterials";
import McqAttempt from "./pages/McqAttempt";
import QaMaterials from "./pages/QaMaterials";
import AssignmentMaterials from "./pages/AssignmentMaterials";
import PdfViewer from "./pages/PdfViewer";
import ProfilePage from "./pages/Profile";
import PricingPage from "./pages/PricingPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pricing"
            element={
              <ProtectedRoute>
                <PricingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/semester/:semId"
            element={
              <ProtectedRoute>
                <Subjects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/semester/:semId/subject/:subjectId"
            element={
              <ProtectedRoute>
                <Materials />
              </ProtectedRoute>
            }
          />
          <Route
          path="/semester/:semId/subject/:subjectId/materials/videos"
          element={
            <ProtectedRoute>
              <VideoMaterials />
            </ProtectedRoute>
          }
        />
        <Route
          path="/semester/:semId/subject/:subjectId/materials/notes"
          element={
            <ProtectedRoute>
              <NotesMaterials />
            </ProtectedRoute>
          }
        />
        <Route
          path="/semester/:semId/subject/:subjectId/materials/mcq"
          element={
            <ProtectedRoute>
              <McqMaterials />
            </ProtectedRoute>
          }
        />
        <Route
          path="/semester/:semId/subject/:subjectId/materials/mcq/:mcqId"
          element={
            <ProtectedRoute>
              <McqAttempt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/semester/:semId/subject/:subjectId/materials/qa"
          element={
            <ProtectedRoute>
              <QaMaterials />
            </ProtectedRoute>
          }
        />
        <Route
          path="/semester/:semId/subject/:subjectId/materials/assignments"
          element={
            <ProtectedRoute>
              <AssignmentMaterials />
            </ProtectedRoute>
          }
        />

        <Route
          path="/semester/:semId/subject/:subjectId/materials/notes/view/:noteId"
          element={<PdfViewer />}
        />

        <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
