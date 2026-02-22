import React, { useState, useRef } from 'react';
import { Upload, Settings, Activity, Cpu, Leaf, Zap, Wrench, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import SafeSlider from './SafeSlider';
import FirmwareExplorer from './FirmwareExplorer';

const STRATEGIES = [
  { id: 'Heavy Duty', icon: <Zap className="w-5 h-5" />, desc: 'Max torque for towing' },
  { id: 'Gasoline', icon: <Activity className="w-5 h-5" />, desc: 'Balanced performance' },
  { id: 'Diesel', icon: <Cpu className="w-5 h-5" />, desc: 'Optimized injection' },
  { id: 'Eco', icon: <Leaf className="w-5 h-5" />, desc: 'Fuel efficiency focus' },
  { id: 'Manual', icon: <Wrench className="w-5 h-5" />, desc: 'Custom parameters' },
];

export default function Dashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [maps, setMaps] = useState<any[]>([]);
  const [activeStrategy, setActiveStrategy] = useState('Gasoline');
  const [tunedValues, setTunedValues] = useState<Record<string, number>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<any>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareUrl, setCompareUrl] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0];
      setFile(uploadedFile);
      
      const formData = new FormData();
      formData.append('file', uploadedFile);

      try {
        // 1. Upload & Extract Metadata
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const meta = await uploadRes.json();
        setMetadata(meta);

        // 2. Analyze Maps via AI
        const analyzeRes = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ metadata: meta }),
        });
        const analysis = await analyzeRes.json();
        
        if (analysis.maps) {
          setMaps(analysis.maps);
          // Initialize tuned values
          const initialValues: Record<string, number> = {};
          analysis.maps.forEach((map: any) => {
            // Mocking a base value based on factor for UI purposes
            initialValues[map.name] = 100 * (map.factor || 1); 
          });
          setTunedValues(initialValues);
        }
      } catch (error) {
        console.error('Upload/Analysis failed', error);
      }
    }
  };

  const handleSliderChange = (mapName: string, value: number) => {
    setTunedValues(prev => ({ ...prev, [mapName]: value }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationResult(null);
    try {
      const res = await fetch('/api/generate-tuned-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata,
          tunedParameters: tunedValues,
          originalFileId: metadata.filename,
          strategy: activeStrategy
        }),
      });
      
      const data = await res.json();
      setGenerationResult(data);
      
      if (res.ok && data.file) {
        // Create a downloadable link for the mocked base64 file
        const blob = new Blob([Buffer.from(data.file, 'base64')], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename || 'tuned_ecu.bin';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Generation failed', error);
      setGenerationResult({ error: 'Failed to generate file. Server error.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompare = (url: string) => {
    setCompareMode(true);
    setCompareUrl(url);
    // In a real app, we would fetch the file from the URL and do a byte-by-byte diff
    // For this demo, we'll just show the UI state
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">ProjectEcu <span className="text-zinc-500 font-normal">Tuning Studio</span></h1>
          </div>
          {metadata && (
            <div className="flex items-center gap-2 text-sm font-mono bg-zinc-800/50 px-3 py-1.5 rounded-md border border-zinc-700/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {metadata.filename}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!file ? (
          // Upload State
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div 
              className="w-full max-w-2xl border-2 border-dashed border-zinc-700 hover:border-indigo-500 bg-zinc-900/50 hover:bg-zinc-900 transition-all rounded-3xl p-12 text-center cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 bg-zinc-800 group-hover:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors">
                <Upload className="w-10 h-10 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">Upload ECU File</h2>
              <p className="text-zinc-400 mb-8 max-w-md mx-auto">Drop your .bin, .hex, or .ori file here to begin analysis and tuning.</p>
              <button className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-zinc-200 transition-colors">
                Select File
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".bin,.hex,.ori" 
                onChange={handleFileUpload} 
              />
            </div>
          </div>
        ) : (
          // Tuning Dashboard
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Sidebar - Strategies */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 px-2">Tuning Strategy</h3>
                <div className="space-y-2">
                  {STRATEGIES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setActiveStrategy(s.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeStrategy === s.id 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                          : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {s.icon}
                      <div className="text-left">
                        <div className="font-medium text-sm">{s.id}</div>
                        <div className={`text-xs ${activeStrategy === s.id ? 'text-indigo-200' : 'text-zinc-500'}`}>
                          {s.desc}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Firmware Explorer Widget */}
              <FirmwareExplorer currentFileMetadata={metadata} onCompare={handleCompare} />
            </div>

            {/* Main Content - Maps & Sliders */}
            <div className="lg:col-span-9 space-y-6">
              
              {compareMode && (
                <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-4 flex items-start gap-4">
                  <FileDiff className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-indigo-300 font-medium mb-1">Compare Mode Active</h3>
                    <p className="text-sm text-indigo-200/70 mb-2">Comparing current file against: <span className="font-mono text-xs bg-black/20 px-1 rounded">{compareUrl}</span></p>
                    <button onClick={() => setCompareMode(false)} className="text-xs bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-3 py-1 rounded transition-colors">
                      Exit Compare
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Map Adjustments</h2>
                    <p className="text-sm text-zinc-400 mt-1">Adjust parameters safely. Hard limits are enforced by the backend.</p>
                  </div>
                  <div className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-mono text-zinc-300 border border-zinc-700">
                    Mode: <span className="text-indigo-400">{activeStrategy}</span>
                  </div>
                </div>

                {maps.length === 0 ? (
                  <div className="text-center py-12 text-zinc-500">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    Analyzing maps via AI...
                  </div>
                ) : (
                  <div className="space-y-2">
                    {maps.map((map, idx) => (
                      <SafeSlider
                        key={idx}
                        mapName={map.name}
                        currentValue={100 * (map.factor || 1)} // Mock base value
                        strategy={activeStrategy}
                        onChange={(val) => handleSliderChange(map.name, val)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Generation Section */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-medium text-white mb-1">Ready to flash?</h3>
                  <p className="text-sm text-zinc-400">Final risk check and checksum calculation will be performed.</p>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || maps.length === 0}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Generate Tuned File
                    </>
                  )}
                </button>
              </div>

              {/* Generation Result / Risk Report */}
              {generationResult && (
                <div className={`p-6 rounded-2xl border ${
                  generationResult.error 
                    ? 'bg-red-500/10 border-red-500/20' 
                    : generationResult.riskReport?.riskLevel === 'High'
                      ? 'bg-yellow-500/10 border-yellow-500/20'
                      : 'bg-emerald-500/10 border-emerald-500/20'
                }`}>
                  {generationResult.error ? (
                    <div className="flex items-start gap-3 text-red-400">
                      <AlertTriangle className="w-6 h-6 shrink-0" />
                      <div>
                        <h4 className="font-medium mb-1">Generation Failed</h4>
                        <p className="text-sm">{generationResult.error}</p>
                        {generationResult.riskReport?.issues && (
                          <ul className="mt-2 list-disc list-inside text-sm opacity-80">
                            {generationResult.riskReport.issues.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
                          </ul>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 text-emerald-400">
                      <CheckCircle className="w-6 h-6 shrink-0" />
                      <div className="w-full">
                        <h4 className="font-medium mb-1">Success! File Ready.</h4>
                        <p className="text-sm text-emerald-200/70 mb-4">{generationResult.message}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-black/20 p-3 rounded-lg border border-emerald-500/20">
                            <div className="text-xs text-emerald-500/70 mb-1 uppercase tracking-wider">New Checksum</div>
                            <div className="font-mono text-sm">{generationResult.checksum}</div>
                          </div>
                          <div className="bg-black/20 p-3 rounded-lg border border-emerald-500/20">
                            <div className="text-xs text-emerald-500/70 mb-1 uppercase tracking-wider">Risk Level</div>
                            <div className="font-medium text-sm">{generationResult.riskReport?.riskLevel || 'Low'}</div>
                          </div>
                        </div>

                        {generationResult.riskReport?.recommendations && generationResult.riskReport.recommendations.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-emerald-500/20">
                            <h5 className="text-xs font-medium text-emerald-500/70 mb-2 uppercase tracking-wider">AI Recommendations</h5>
                            <ul className="space-y-1">
                              {generationResult.riskReport.recommendations.map((rec: string, idx: number) => (
                                <li key={idx} className="text-sm text-emerald-200/80 flex items-start gap-2">
                                  <span className="text-emerald-500 mt-1">•</span> {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
