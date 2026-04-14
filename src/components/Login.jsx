import { useState } from 'react';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Typically, call the backend login here
      const response = await axios.post('/api/login', {
        email,
        password
      });
      if (response.data.token) {
        onLogin(response.data.token);
      }
    } catch (err) {
      setError('Failed to login. Try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Sign In</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
          <input 
            type="email" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            placeholder="hero@comic.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
          <input 
            type="password" 
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
            placeholder="••••••••"
          />
        </div>
        
        {error && <p className="text-red-400 text-sm">{error}</p>}
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold py-2 px-4 rounded-lg shadow-lg flex justify-center transition-all disabled:opacity-75"
        >
          {loading ? 'Entering...' : 'Enter the Multiverse'}
        </button>
      </form>
    </div>
  )
}
