import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";


const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


const FALLBACK_QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "In the end, it's not the years in your life that count. It's the life in your years.", author: "Abraham Lincoln" },
  { text: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
  { text: "Get busy living or get busy dying.", author: "Stephen King" },
  { text: "You only live once, but if you do it right, once is enough.", author: "Mae West" },
  { text: "Many of life's failures are people who did not realize how close they were to success when they gave up.", author: "Thomas A. Edison" },
  { text: "If you want to live a happy life, tie it to a goal, not to people or things.", author: "Albert Einstein" }
];

const CATEGORIES = [
  'General',
  'Happiness',
  'Success',
  'Wisdom',
  'Love',
  'Courage',
  'Technology',
  'Future',
  'Nature',
  'Philosophy'
];

interface Quote {
  id: string;
  text: string;
  author: string;
  timestamp: number;
}

const App: React.FC = () => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [category, setCategory] = useState<string>('General');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<Quote[]>(() => {
    const saved = localStorage.getItem('zenquotes_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Toggle Theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Sync bookmarks to localStorage
  useEffect(() => {
    localStorage.setItem('zenquotes_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const fetchQuote = useCallback(async (selectedCategory: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a truly inspiring and meaningful quote for the category: ${selectedCategory}. 
                   If the category is 'General', choose a random profound topic. 
                   The quote should be high quality, either from a famous person or a highly philosophical original thought.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.STRING,
                description: "The quote text itself.",
              },
              author: {
                type: Type.STRING,
                description: "The name of the author of the quote.",
              },
            },
            required: ["text", "author"],
          },
        },
      });

      const result = JSON.parse(response.text || '{}');
      if (result.text && result.author) {
        setQuote({
          id: Math.random().toString(36).substr(2, 9),
          text: result.text,
          author: result.author,
          timestamp: Date.now()
        });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Failed to fetch quote using API, switching to fallback:", err);
      // Fallback to local quotes
      const randomQuote = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
      setQuote({
        id: Math.random().toString(36).substr(2, 9),
        text: randomQuote.text,
        author: randomQuote.author,
        timestamp: Date.now()
      });
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuote('General');
  }, [fetchQuote]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCat = e.target.value;
    setCategory(newCat);
    fetchQuote(newCat);
  };

  const handleNewQuote = () => {
    fetchQuote(category);
  };

  const toggleBookmark = () => {
    if (!quote) return;
    const isAlreadyBookmarked = bookmarks.some(b => b.text === quote.text);
    if (isAlreadyBookmarked) {
      setBookmarks(prev => prev.filter(b => b.text !== quote.text));
    } else {
      setBookmarks(prev => [quote, ...prev]);
    }
  };

  const removeBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const copyToClipboard = (q: Quote | null) => {
    if (q) {
      const text = `"${q.text}" — ${q.author}`;
      navigator.clipboard.writeText(text);
      alert('Quote copied to clipboard!');
    }
  };

  const shareOnTwitter = (q: Quote | null) => {
    if (q) {
      const text = encodeURIComponent(`"${q.text}" — ${q.author}`);
      window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    }
  };

  const isCurrentBookmarked = useMemo(() => {
    return quote ? bookmarks.some(b => b.text === quote.text) : false;
  }, [quote, bookmarks]);

  return (
    <div className={`relative min-h-screen transition-colors duration-500`}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="glass-card rounded-3xl p-8 md:p-12 relative overflow-hidden transition-all duration-500 w-full max-w-2xl dark:bg-black/20 dark:backdrop-blur-xl">
          {/* Background Decorative Element */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-theme-accent rounded-full opacity-50 blur-3xl dark:opacity-20"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-theme-secondary rounded-full opacity-50 blur-3xl dark:opacity-20"></div>

          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 relative z-10">
            <div className="flex items-center justify-between w-full md:w-auto">
              <h1 className="text-3xl font-bold text-theme-primary dark:text-theme-surface tracking-tight">
                Zen<span className="text-theme-secondary dark:text-theme-accent">Quotes</span>
              </h1>
              <div className="flex items-center gap-2 md:hidden">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full bg-theme-surface text-theme-primary hover:bg-theme-accent transition-colors dark:bg-theme-secondary dark:text-theme-surface"
                >
                  {theme === 'light' ? '🌙' : '☀️'}
                </button>
                <button
                  onClick={() => setShowBookmarks(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-theme-surface text-theme-primary text-sm font-semibold hover:bg-theme-accent transition-colors dark:bg-theme-primary dark:text-theme-surface dark:border dark:border-theme-accent"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path></svg>
                  {bookmarks.length}
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <label htmlFor="category" className="text-sm font-medium text-theme-primary dark:text-theme-surface whitespace-nowrap">Category:</label>
                <select
                  id="category"
                  value={category}
                  onChange={handleCategoryChange}
                  className="w-full md:w-auto bg-white border border-theme-accent text-theme-primary text-sm rounded-lg focus:ring-theme-secondary focus:border-theme-secondary block p-2.5 outline-none transition-shadow hover:shadow-sm dark:bg-theme-primary dark:text-theme-surface dark:border-theme-secondary"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={toggleTheme}
                className="hidden md:flex p-2 rounded-full bg-theme-surface text-theme-primary hover:bg-theme-accent transition-colors dark:bg-theme-primary dark:text-theme-surface dark:border dark:border-theme-accent"
                title="Toggle Theme"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <button
                onClick={() => setShowBookmarks(true)}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-theme-surface text-theme-primary font-semibold hover:bg-theme-accent transition-colors dark:bg-theme-primary dark:text-theme-surface dark:border dark:border-theme-accent"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path></svg>
                Bookmarks ({bookmarks.length})
              </button>
            </div>
          </header>

          <main className="min-h-[220px] flex flex-col justify-center relative z-10">
            {loading ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-theme-secondary loader rounded-full"></div>
                <p className="text-theme-secondary dark:text-theme-accent font-medium animate-pulse">Curating inspiration...</p>
              </div>
            ) : error ? (
              <div className="text-center p-6 bg-red-50 rounded-xl animate-quote-entrance">
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={handleNewQuote}
                  className="mt-4 text-sm text-red-500 underline hover:text-red-700"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div key={quote?.id} className="animate-quote-entrance text-center md:text-left">
                <div className="flex items-start justify-between">
                  <svg className="w-10 h-10 text-theme-accent mb-4 mx-auto md:mx-0" fill="currentColor" viewBox="0 0 32 32">
                    <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H6c0-2.2 1.8-4 4-4V8zm18 0c-3.3 0-6 2.7-6 6v10h10V14h-8c0-2.2 1.8-4 4-4V8z" />
                  </svg>
                  <button
                    onClick={toggleBookmark}
                    title={isCurrentBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
                    className={`p-3 rounded-full transition-all duration-300 ${isCurrentBookmarked ? 'text-theme-primary bg-theme-accent dark:text-theme-surface dark:bg-theme-secondary' : 'text-theme-secondary bg-theme-surface hover:text-theme-primary dark:bg-theme-primary dark:text-theme-surface dark:border dark:border-theme-accent'}`}
                  >
                    <svg className="w-6 h-6" fill={isCurrentBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>
                <blockquote className="text-2xl md:text-3xl font-serif font-bold text-theme-primary dark:text-theme-surface leading-snug mb-6 italic">
                  {quote?.text}
                </blockquote>
                <p className="text-lg text-theme-secondary dark:text-theme-accent font-semibold tracking-wide">
                  — {quote?.author}
                </p>
              </div>
            )}
          </main>

          <footer className="mt-12 flex flex-wrap items-center justify-center md:justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => copyToClipboard(quote)}
                title="Copy to clipboard"
                className="p-3 rounded-full bg-theme-surface text-theme-primary hover:bg-theme-accent transition-colors dark:bg-theme-primary dark:text-theme-surface dark:border dark:border-theme-accent"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
              </button>
              <button
                onClick={() => shareOnTwitter(quote)}
                title="Share on Twitter"
                className="p-3 rounded-full bg-theme-surface text-theme-primary hover:bg-theme-accent transition-colors dark:bg-theme-primary dark:text-theme-surface dark:border dark:border-theme-accent"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </button>
            </div>

            <button
              onClick={handleNewQuote}
              disabled={loading}
              className={`px-8 py-3 rounded-full bg-theme-primary text-white font-bold tracking-wide shadow-lg hover:bg-theme-secondary hover:shadow-theme-accent transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-theme-accent dark:text-theme-primary`}
            >
              {loading ? 'Fetching...' : 'New Quote'}
            </button>
          </footer>
        </div>

        {/* Bookmarks Modal */}
        {showBookmarks && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in" onClick={() => setShowBookmarks(false)}>
            <div
              className="glass-card w-full max-w-xl max-h-[80vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-modal-in dark:bg-theme-primary dark:border dark:border-theme-accent"
              onClick={e => e.stopPropagation()}
            >
              <header className="p-6 border-b border-theme-accent flex items-center justify-between dark:border-theme-secondary">
                <h2 className="text-xl font-bold text-theme-primary dark:text-theme-surface flex items-center gap-2">
                  <svg className="w-6 h-6 text-theme-secondary dark:text-theme-accent" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path></svg>
                  Saved Quotes
                </h2>
                <button
                  onClick={() => setShowBookmarks(false)}
                  className="p-2 rounded-full hover:bg-theme-surface text-theme-secondary dark:text-theme-accent transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {bookmarks.length === 0 ? (
                  <div className="py-12 text-center text-theme-secondary dark:text-theme-accent">
                    <p>No saved quotes yet.</p>
                    <p className="text-sm mt-1">Bookmark quotes you love to see them here.</p>
                  </div>
                ) : (
                  bookmarks.map(b => (
                    <div key={b.id} className="p-5 rounded-2xl bg-theme-surface border border-theme-accent group hover:border-theme-secondary transition-all dark:bg-theme-primary dark:border-theme-secondary">
                      <p className="text-theme-primary dark:text-theme-surface font-serif leading-relaxed mb-3">"{b.text}"</p>
                      <div className="flex items-center justify-between">
                        <span className="text-theme-secondary dark:text-theme-accent text-sm font-semibold tracking-wide">— {b.author}</span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => copyToClipboard(b)}
                            className="p-1.5 rounded-lg text-theme-secondary hover:text-theme-primary hover:bg-white transition-all dark:text-theme-accent dark:hover:text-theme-surface dark:hover:bg-theme-secondary"
                            title="Copy"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                          </button>
                          <button
                            onClick={() => removeBookmark(b.id)}
                            className="p-1.5 rounded-lg text-red-300 hover:text-red-500 hover:bg-white transition-all"
                            title="Remove"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);