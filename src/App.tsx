import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { HomePage } from './pages/HomePage';
import { UserPage } from './pages/UserPage';
import { FriendsPage } from './pages/FriendsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/:username" element={<UserPage />} />
          <Route path="/friends/:username" element={<FriendsPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
