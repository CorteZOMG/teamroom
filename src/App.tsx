import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfileCreation from "./pages/ProfileCreation";
import Messenger from "./pages/Messenger";
import Courser from "./pages/Courser";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile/create" element={<ProfileCreation />} />
          <Route path="/messenger" element={<Messenger />} />
          <Route path="/courser" element={<Courser />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
