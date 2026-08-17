import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Dashboard } from './screens/Dashboard';
import { Login } from './screens/Login';
import { Register } from './screens/Register';
import { ServerSetup } from './screens/ServerSetup';

function App(): React.JSX.Element {

  const hasServer = !!localStorage.getItem("API_URL");
  const hasToken = !!localStorage.getItem("JWT_TOKEN");

  return (
   <HashRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            hasToken ? <Navigate to="/dashboard" /> :
            hasServer ? <Navigate to="/login" /> :
            <Navigate to="/server-setup" />
          } 
        />
        
        <Route path="/server-setup" element={<ServerSetup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </HashRouter>
  )
}

export default App
