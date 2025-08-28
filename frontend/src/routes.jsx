import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import useStore from './store/useStore';

export default function AppRoutes() {
  const { user } = useStore();
  return (
    <Routes>
      <Route path="/" element={user ? <Home/> : <Navigate to="/login" />} />
      <Route path="/login" element={<Login/>} />
      <Route path="/register" element={<Register/>} />
    </Routes>
  );
}
