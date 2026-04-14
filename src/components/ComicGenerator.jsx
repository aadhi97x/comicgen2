import { useState } from 'react';
import axios from 'axios';
import ComicDisplay from './ComicDisplay';
import { Loader2 } from 'lucide-react';

export default function ComicGenerator() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Cartoon');
  const [panelCount, setPanelCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [comicData, setComicData] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError('');
    setComicData(null);

    try {
      const response = await axios.post('/api/generate-comic', {
        prompt,
        style,
        panel_count: panelCount
      });
      setComicData(response.data.panels);
    } catch (err) {
      console.error(err);
      setError('Failed to generate comic. Please check the backend or your API keys.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">Comic Story Idea</label>
            <textarea
              required
              rows={3}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none text-white resize-none"
              placeholder="A cyberpunk detective searching for his lost robot cat..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Art Style</label>
              <select 
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none text-white"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
              >
                <option value="Cartoon">Cartoon</option>
                <option value="Manga">Manga</option>
                <option value="Marvel">Marvel</option>
                <option value="Manhwa">Manhwa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Panels</label>
              <select 
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none text-white"
                value={panelCount}
                onChange={(e) => setPanelCount(Number(e.target.value))}
              >
                <option value={2}>2 Panels</option>
                <option value={4}>4 Panels</option>
                <option value={6}>6 Panels</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-center md:col-span-1 pt-4 md:pt-0">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 hover:opacity-90 font-bold rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all flex justify-center items-center py-4"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" /> Generating...
                </span>
              ) : (
                <span className="text-xl">POW! Generate</span>
              )}
            </button>
          </div>
        </form>
        {error && <p className="text-red-400 mt-4">{error}</p>}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-purple-500" />
          <p>Consulting the AI Gods to draw your scenes...</p>
        </div>
      )}

      {comicData && !loading && (
        <ComicDisplay panels={comicData} />
      )}
    </div>
  );
}
