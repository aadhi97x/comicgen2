import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Download, Loader2 } from 'lucide-react';

const ComicImage = ({ src, alt, index }) => {
  const [currentSrc, setCurrentSrc] = useState('');
  const [retries, setRetries] = useState(0);
  const [loading, setLoading] = useState(true);

  // Stagger the fetch slightly so we don't pound the server at the exact same millisecond
  useEffect(() => {
    setLoading(true);
    setCurrentSrc(''); // Clear out old comic
    const timer = setTimeout(() => {
      setCurrentSrc(src);
    }, index * 500); // Only 0.5s stagger between panels
    
    return () => clearTimeout(timer);
  }, [src, index]);

  const handleError = () => {
    if (retries < 6) {
      setTimeout(() => {
        setRetries(r => r + 1);
        setCurrentSrc(`${src}&retry=${Date.now()}`);
      }, 2000); // Wait 2s before retry
    }
  };

  const handleLoad = () => {
    setLoading(false);
  };

  return (
    <div className="w-full h-full relative bg-gray-800 flex items-center justify-center">
      {(!currentSrc || loading) && <Loader2 className="animate-spin text-purple-500 absolute" size={32} />}
      {currentSrc && (
        <img 
          src={currentSrc} 
          alt={alt} 
          className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
          crossOrigin="anonymous" 
          onError={handleError}
          onLoad={handleLoad}
        />
      )}
    </div>
  );
};

export default function ComicDisplay({ panels }) {
  const comicRef = useRef(null);

  const downloadComic = async () => {
    if (!comicRef.current) return;
    try {
      const canvas = await html2canvas(comicRef.current, {
        useCORS: true, // Need this to load pollinations external images
        backgroundColor: '#111827' // match gray-900
      });
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'ai-comic.png';
      link.href = url;
      link.click();
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to generate comic image for download.');
    }
  };

  // Dynamic grid setup based on panel count
  const getGridClass = () => {
    if (panels.length === 2) return "grid-cols-1 sm:grid-cols-2";
    if (panels.length === 4) return "grid-cols-2";
    if (panels.length === 6) return "grid-cols-2 lg:grid-cols-3";
    return "grid-cols-2";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={downloadComic}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Download size={20} />
          Download full comic
        </button>
      </div>

      <div 
        ref={comicRef}
        className="bg-white p-4 rounded-xl max-w-4xl mx-auto shadow-2xl relative"
      >
        <div className={`grid gap-4 ${getGridClass()} border-4 border-black p-4`}>
          {panels.map((panel, idx) => (
            <div key={idx} className="relative group border-4 border-black overflow-hidden bg-gray-200 aspect-square">
              {/* Image from pollinations */}
                <ComicImage 
                  src={panel.image_url} 
                  alt={`Panel ${idx + 1}`} 
                  index={idx}
                />
              {/* Optional: if we want to show the generated prompt text slightly */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                <p className="text-white text-xs text-center">{panel.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
