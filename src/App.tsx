import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfileCreation from "./pages/ProfileCreation";
import MessengerPage from "./features/chat/pages/MessengerPage";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./features/chat/context/ChatContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile/create" element={<ProfileCreation />} />
          <Route path="/messenger" element={<ChatProvider><MessengerPage /></ChatProvider>} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:courseId" element={<CourseDetail />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;