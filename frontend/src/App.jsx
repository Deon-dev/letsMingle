import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { setAuthTokenGetter } from './api/axios';
import useStore from './store/useStore';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/protectedRoute';
import Home from './pages/Home';

function App() {
  const getAccessToken = useStore(state => state.getAccessToken);

  useEffect(() => {
    setAuthTokenGetter(getAccessToken);
  }, [getAccessToken]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;