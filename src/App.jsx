import { useState } from 'react';
import Login from './components/Login';
import ComicGenerator from './components/ComicGenerator';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <div className="min-h-screen font-comic">
      <header className="bg-gray-800 border-b border-gray-700 py-4 px-6 flex justify-between items-center shadow-lg">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">AI Comic Gen</h1>
        {token && (
          <button 
            onClick={handleLogout}
            className="text-gray-300 hover:text-white transition"
          >
            Logout
          </button>
        )}
      </header>

      <main className="p-6 max-w-5xl mx-auto h-full">
        {!token ? (
          <Login onLogin={handleLogin} />
        ) : (
          <ComicGenerator />
        )}
      </main>
    </div>
  );
}

export default App;
