
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  generateSermonText, 
  generateSermonAudio, 
  decodePCMToAudioBuffer,
  pcmToWav
} from './services/geminiService';
import { PredefinedTopics, SermonState } from './types';
import { LotusIcon } from './components/LotusIcon';

const App: React.FC = () => {
  const [state, setState] = useState<SermonState & { downloadUrl: string | null }>({
    topic: '',
    content: '',
    isGenerating: false,
    isPlaying: false,
    error: null,
    downloadUrl: null
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    return () => {
      if (state.downloadUrl) {
        URL.revokeObjectURL(state.downloadUrl);
      }
    };
  }, [state.downloadUrl]);

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const handleGenerate = async (selectedTopic?: string) => {
    const topicToUse = selectedTopic || state.topic;
    if (!topicToUse.trim()) return;

    stopAudio();
    if (state.downloadUrl) {
      URL.revokeObjectURL(state.downloadUrl);
    }

    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      error: null, 
      content: '', 
      topic: topicToUse,
      downloadUrl: null
    }));

    try {
      const text = await generateSermonText(topicToUse);
      setState(prev => ({ ...prev, content: text }));

      const audioData = await generateSermonAudio(text);
      const wavBlob = pcmToWav(audioData);
      const downloadUrl = URL.createObjectURL(wavBlob);
      setState(prev => ({ ...prev, downloadUrl }));

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const buffer = await decodePCMToAudioBuffer(audioData, audioContextRef.current);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setState(prev => ({ ...prev, isPlaying: false }));
      };

      audioSourceRef.current = source;
      source.start(0);
      setState(prev => ({ ...prev, isGenerating: false, isPlaying: true }));

    } catch (err: any) {
      console.error("Sermon Generation Error:", err);
      setState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: "දේශනය සැකසීමේදී සුළු බාධාවක් ඇති විය. සිත සන්සුන්ව තබාගෙන නැවත උත්සාහ කරන්න." 
      }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 md:p-12 selection:bg-amber-100">
      {/* Header */}
      <header className="w-full max-w-2xl text-center mb-16 opacity-90 transition-opacity hover:opacity-100">
        <div className="flex justify-center mb-6">
          <div className="float-animation">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400 blur-2xl opacity-10 rounded-full animate-pulse"></div>
              <LotusIcon className="w-20 h-20 relative z-10" />
            </div>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-light text-stone-700 mb-3 serif-text tracking-wider">
          ධර්ම දේශක
        </h1>
        <p className="text-amber-600/70 italic text-base md:text-lg font-light tracking-wide">
          අධ්‍යාත්මික සැනසීම සොයා යන මාවත
        </p>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-2xl glass rounded-[2.5rem] shadow-sm p-8 md:p-12 transition-all">
        
        {/* Topic Selection */}
        <div className="mb-10 text-center">
          <span className="text-[10px] text-amber-600 font-bold uppercase tracking-[0.3em] mb-4 block opacity-60">
            භාවනාමය මාතෘකාවක් තෝරන්න
          </span>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {Object.values(PredefinedTopics).map((topic) => (
              <button
                key={topic}
                onClick={() => handleGenerate(topic)}
                disabled={state.isGenerating}
                className={`px-5 py-2.5 rounded-full text-xs md:text-sm transition-all duration-500 border ${
                  state.topic === topic 
                    ? 'bg-stone-800 border-stone-800 text-stone-50 shadow-lg scale-105' 
                    : 'bg-white/50 border-stone-100 text-stone-500 hover:border-amber-200 hover:text-amber-800'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="වෙනත් ඕනෑම මාතෘකාවක්..."
              className="flex-1 px-6 py-4 rounded-2xl border border-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-200 bg-white/40 placeholder:text-stone-300 transition-all text-stone-700"
              value={state.topic}
              onChange={(e) => setState(prev => ({ ...prev, topic: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <button
              onClick={() => handleGenerate()}
              disabled={state.isGenerating || !state.topic.trim()}
              className="px-8 py-4 bg-stone-800 text-stone-50 rounded-2xl font-light tracking-widest hover:bg-stone-900 disabled:bg-stone-200 disabled:text-stone-400 transition-all duration-700 uppercase text-xs"
            >
              {state.isGenerating ? 'නිහඬව සිටින්න...' : 'ශ්‍රවණය කරන්න'}
            </button>
          </div>
        </div>

        {/* Sermon Area */}
        <div className={`relative min-h-[450px] rounded-[2rem] p-10 transition-all duration-1000 flex flex-col ${
          state.content ? 'bg-white/30' : 'bg-stone-50/20 items-center justify-center border border-stone-100/50'
        }`}>
          {/* Subtle breathing background for the sermon text */}
          {state.content && (
            <div className="absolute inset-0 pulse-animation pointer-events-none rounded-[2rem] bg-amber-50/20"></div>
          )}

          {state.error && (
            <div className="text-amber-800 bg-amber-50/50 p-6 rounded-2xl text-center w-full italic font-light animate-in fade-in zoom-in duration-500">
              {state.error}
            </div>
          )}

          {!state.content && !state.isGenerating && !state.error && (
            <div className="text-stone-300 text-center flex flex-col items-center gap-4 animate-in fade-in duration-1000">
              <LotusIcon className="w-12 h-12 opacity-10" />
              <p className="text-sm font-light tracking-widest">සිත එකඟ කරගන්න</p>
            </div>
          )}

          {state.isGenerating && !state.content && (
            <div className="flex flex-col items-center gap-8 text-stone-400">
              <div className="relative">
                <div className="w-16 h-16 border-[1px] border-stone-100 rounded-full animate-ping absolute"></div>
                <div className="w-16 h-16 border-[1px] border-amber-200 rounded-full animate-pulse flex items-center justify-center">
                  <LotusIcon className="w-8 h-8 opacity-20" />
                </div>
              </div>
              <p className="font-light tracking-[0.2em] text-xs animate-pulse">ධර්ම කරුණු ගලපමින්...</p>
            </div>
          )}

          {state.content && (
            <div className="animate-in fade-in duration-[2000ms] w-full relative z-10">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-12 opacity-50 hover:opacity-100 transition-opacity duration-500">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${state.isPlaying ? 'bg-green-400 animate-pulse' : 'bg-stone-200'}`}></div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Meditation Mode</span>
                </div>
                
                <div className="flex items-center gap-4">
                  {state.isPlaying ? (
                    <button 
                      onClick={stopAudio}
                      className="text-[10px] font-bold text-stone-400 hover:text-amber-800 transition-colors uppercase tracking-widest"
                    >
                      Stop
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleGenerate()}
                      className="text-[10px] font-bold text-stone-400 hover:text-amber-800 transition-colors uppercase tracking-widest"
                    >
                      Listen Again
                    </button>
                  )}
                  
                  {state.downloadUrl && (
                    <a 
                      href={state.downloadUrl} 
                      download={`${state.topic.replace(/\s+/g, '_')}_peace.wav`}
                      className="p-2 hover:bg-white/50 rounded-full transition-all text-stone-400 hover:text-amber-800"
                      title="බාගත කරන්න"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>

              {/* Sermon Text Content */}
              <div className="text-xl md:text-2xl leading-[2.2] text-stone-600 serif-text italic text-center max-w-[480px] mx-auto font-light">
                {state.content.split('...').map((segment, idx) => {
                  const trimmed = segment.trim();
                  if (!trimmed) return null;
                  return (
                    <div key={idx} className="mb-10 last:mb-0 animate-in fade-in slide-in-from-bottom-2 duration-1000" style={{ animationDelay: `${idx * 200}ms` }}>
                      <p className="inline relative leading-relaxed">
                        {trimmed}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-12 text-stone-300 text-[10px] uppercase tracking-[0.5em] text-center font-light">
        නිහඬබව තුළින් නිවන සොයන්න
      </footer>
    </div>
  );
};

export default App;
