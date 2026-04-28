import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Admin from './pages/Admin.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </AuthProvider>
  );
}
