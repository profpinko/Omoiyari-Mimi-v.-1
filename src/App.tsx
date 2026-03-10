import { useState, useEffect } from 'react';
import { Mic, Square, Loader2, RefreshCw, Ear, ChevronLeft, ChevronRight, RotateCcw, Pause, Play } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { transcribeAndFormatAudio } from './services/geminiService';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const base64Audio = base64data.split(',')[1];
      resolve(base64Audio);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export default function App() {
  const { isRecording, startRecording, stopRecording, error: recordError } = useAudioRecorder();
  const [isProcessing, setIsProcessing] = useState(false);
  const [slides, setSlides] = useState<string[] | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slides || !isPlaying || currentSlideIndex >= slides.length - 1) return;

    const timer = setTimeout(() => {
      setCurrentSlideIndex((prev) => prev + 1);
    }, 5000);

    return () => clearTimeout(timer);
  }, [slides, currentSlideIndex, isPlaying]);

  const handleToggleRecording = async () => {
    if (isRecording) {
      const audioData = await stopRecording();
      if (audioData) {
        await processAudio(audioData.blob, audioData.mimeType);
      }
    } else {
      setSlides(null);
      setCurrentSlideIndex(0);
      setIsPlaying(true);
      setError(null);
      await startRecording();
    }
  };

  const processAudio = async (blob: Blob, mimeType: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      const base64Audio = await blobToBase64(blob);
      const textArray = await transcribeAndFormatAudio(base64Audio, mimeType);
      setSlides(textArray);
      setCurrentSlideIndex(0);
      setIsPlaying(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Wystąpił błąd podczas przetwarzania nagrania.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSlides(null);
    setCurrentSlideIndex(0);
    setIsPlaying(true);
    setError(null);
  };

  const handlePrevSlide = () => {
    setCurrentSlideIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextSlide = () => {
    if (slides) {
      setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1));
    }
  };

  const displayError = error || recordError;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 py-6 px-8 shadow-sm flex items-center gap-4">
        <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-700">
          <Ear className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Omoiyari Mimi</h1>
          <p className="text-stone-500 text-sm font-medium">Asystent Komunikacji Bez Barier</p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 w-full max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {!isRecording && !isProcessing && !slides && !displayError && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center max-w-lg"
            >
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 mb-8">
                <h2 className="text-xl font-medium mb-4 text-stone-800">Gotowy do nasłuchiwania</h2>
                <p className="text-stone-500 leading-relaxed">
                  Naciśnij przycisk mikrofonu i powiedz komunikat dla pacjenta. 
                  Aplikacja automatycznie uporządkuje informacje i wyświetli je w czytelnej formie.
                </p>
              </div>
            </motion.div>
          )}

          {isRecording && (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center"
            >
              <div className="relative flex items-center justify-center w-48 h-48">
                <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-75"></div>
                <div className="absolute inset-4 bg-red-50 rounded-full animate-pulse"></div>
                <div className="relative z-10 bg-red-500 text-white p-6 rounded-full shadow-lg shadow-red-500/30">
                  <Mic className="w-12 h-12" />
                </div>
              </div>
              <p className="mt-8 text-xl font-medium text-red-600 animate-pulse">Nagrywanie...</p>
              <p className="mt-2 text-stone-500">Mów wyraźnie. Naciśnij stop, gdy skończysz.</p>
            </motion.div>
          )}

          {isProcessing && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center"
            >
              <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mb-6" />
              <h2 className="text-2xl font-medium text-stone-800">Przetwarzanie...</h2>
              <p className="mt-2 text-stone-500">Porządkowanie i upraszczanie komunikatu</p>
            </motion.div>
          )}

          {displayError && !isRecording && !isProcessing && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl max-w-lg text-center"
            >
              <p className="font-medium mb-4">{displayError}</p>
              <button 
                onClick={handleReset}
                className="px-6 py-2 bg-white text-red-700 rounded-full text-sm font-medium border border-red-200 hover:bg-red-50 transition-colors"
              >
                Spróbuj ponownie
              </button>
            </motion.div>
          )}

          {slides && !isRecording && !isProcessing && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex flex-col items-center"
            >
              <div className="bg-white p-8 md:p-16 rounded-[3rem] shadow-sm border border-stone-200 w-full min-h-[50vh] flex flex-col items-center justify-center relative overflow-hidden">
                {isPlaying && currentSlideIndex < slides.length - 1 && (
                  <motion.div
                    key={`progress-${currentSlideIndex}`}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className="absolute top-0 left-0 h-2 bg-emerald-500"
                  />
                )}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlideIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="text-center w-full"
                  >
                    <div className="text-5xl md:text-7xl lg:text-8xl font-medium leading-[1.3] text-stone-800 whitespace-pre-wrap [&_strong]:text-emerald-700 [&_strong]:font-bold">
                      <ReactMarkdown>{slides[currentSlideIndex]}</ReactMarkdown>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Progress indicators */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3">
                  {slides.map((_, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "h-3 rounded-full transition-all duration-300",
                        idx === currentSlideIndex ? "w-12 bg-emerald-500" : "w-3 bg-stone-200"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between w-full mt-8 gap-3 md:gap-4">
                <button
                  onClick={handlePrevSlide}
                  disabled={currentSlideIndex === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-6 md:py-8 bg-white border border-stone-200 rounded-3xl text-stone-700 font-medium text-xl md:text-2xl hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
                >
                  <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
                  <span className="hidden sm:inline">Wstecz</span>
                </button>
                
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="flex-none flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-white border border-stone-200 rounded-3xl text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
                  aria-label={isPlaying ? "Pauza" : "Odtwórz"}
                >
                  {isPlaying ? <Pause className="w-8 h-8 md:w-10 md:h-10" /> : <Play className="w-8 h-8 md:w-10 md:h-10 ml-1" />}
                </button>

                {currentSlideIndex === slides.length - 1 ? (
                  <button
                    onClick={() => {
                      setCurrentSlideIndex(0);
                      setIsPlaying(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-6 md:py-8 bg-emerald-600 text-white rounded-3xl font-medium text-xl md:text-2xl hover:bg-emerald-700 transition-colors active:scale-[0.98]"
                  >
                    <RotateCcw className="w-8 h-8 md:w-10 md:h-10" />
                    <span>Od nowa</span>
                  </button>
                ) : (
                  <button
                    onClick={handleNextSlide}
                    className="flex-1 flex items-center justify-center gap-2 py-6 md:py-8 bg-emerald-600 text-white rounded-3xl font-medium text-xl md:text-2xl hover:bg-emerald-700 transition-colors active:scale-[0.98]"
                  >
                    <span className="hidden sm:inline">Dalej</span>
                    <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Controls Footer */}
      <footer className="bg-white border-t border-stone-200 p-6 flex justify-center items-center gap-6 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] relative z-10">
        {slides && !isRecording && !isProcessing && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-4 text-stone-600 hover:bg-stone-100 rounded-full font-medium transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Nowy komunikat</span>
          </button>
        )}
        
        <button
          onClick={handleToggleRecording}
          disabled={isProcessing}
          className={cn(
            "flex items-center justify-center w-20 h-20 rounded-full shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
            isRecording 
              ? "bg-stone-900 hover:bg-stone-800 text-white scale-110" 
              : "bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105"
          )}
          aria-label={isRecording ? "Zatrzymaj nagrywanie" : "Rozpocznij nagrywanie"}
        >
          {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8" />}
        </button>
      </footer>
    </div>
  );
}
