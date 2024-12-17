'use client'

import React, { useState } from 'react';
import { fal } from "@fal-ai/client";

// const MAX_ITERATIONS = 2;

interface ImprovementDirection {
    title: string;
    description: string;
    prompt: string;
}

interface Iteration {
    number: number;
    originalPrompt: string;
    prompt: string;
    imageUrl: string;
    status: 'generating' | 'analyzing' | 'complete' | 'error';
    analysis?: {
        description: string;
        isOptimal: boolean;
        improvementDirections: ImprovementDirection[];
    };
}

interface ProcessState {
    step: 'idle' | 'enhancing' | 'generating' | 'analyzing';
    message: string;
}

interface OutputMode {
    id: string;
    name: string;
    description: string;
    dimensions: string;
    layout: string;
}

interface VerboseToggleProps {
    isVerbose: boolean;
    onChange: (value: boolean) => void;
}

interface PromptGuideProps {
    prompt: string;
    setPrompt: (value: string) => void;
    isLoading: boolean;
    selectedMode: OutputMode;
    onModeChange: (mode: OutputMode) => void;
}

const OUTPUT_MODES: OutputMode[] = [
    {
        id: 'image',
        name: 'Image Mode',
        description: 'Digital illustration suitable for presentations or standalone use, with full composition and background',
        dimensions: 'square_1_1',
        layout: '1:1' // Add explicit layout format
    },
    {
        id: 'emoji',
        name: 'Emoji Mode',
        description: 'Focused frog upper body shot with transparent background, perfect for Slack emoji use',
        dimensions: 'square_1_1',
        layout: '1:1' // Add explicit layout format
    }
];

const getStatusStyles = (status: Iteration['status']) => {
    switch (status) {
        case 'generating':
            return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case 'analyzing':
            return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'complete':
            return 'text-green-600 bg-green-50 border-green-200';
        case 'error':
            return 'text-red-600 bg-red-50 border-red-200';
        default:
            return 'text-slate-600 bg-slate-50 border-slate-200';
    }
};

const IterationCard: React.FC<{
    iteration: Iteration;
    isSelected: boolean;
    onClick: () => void;
    className?: string;
}> = ({ iteration, isSelected, onClick, className }) => (
    <button
        onClick={onClick}
        className={`
            relative flex flex-col items-center p-2 rounded-lg transition-all
            ${isSelected
                ? 'bg-white shadow-lg scale-100 opacity-100 border-2 border-indigo-500'
                : 'bg-white/80 hover:bg-white hover:shadow-md scale-95 opacity-80 hover:opacity-100 border border-slate-200'
            }
            ${className}
        `}
    >
        <div className="relative w-32 h-32 rounded-md overflow-hidden">
            {iteration.imageUrl ? (
                <img
                    src={iteration.imageUrl}
                    alt={`Iteration ${iteration.number}`}
                    className="w-full h-full object-cover"
                />
            ) : (
                <ImageLoadingAnimation />
            )}
        </div>
        <div className="mt-2 text-sm font-medium text-slate-700">
            #{iteration.number}
        </div>
    </button>
);

const ImageLoadingAnimation = () => (
    <div className="relative w-full aspect-square rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-emerald-500/20">
            <div className="absolute inset-0 animate-gradient">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-emerald-500/40 blur-xl" />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-emerald-500/30 blur-2xl" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl animate-bounce-slow filter drop-shadow-lg">
                    🐸
                </div>
            </div>
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] animate-pulse" />
        </div>
    </div>
);

const VerboseToggle: React.FC<VerboseToggleProps> = ({ isVerbose, onChange }) => (
    <button
        onClick={() => onChange(!isVerbose)}
        className={`
        flex items-center gap-2 px-4 py-2 rounded-full 
        font-medium transition-all duration-200
        ${isVerbose
                ? 'bg-indigo-100 text-indigo-700 shadow-inner border border-indigo-200'
                : 'bg-white text-slate-600 shadow-sm hover:shadow border border-slate-200 hover:border-indigo-200'
            }
      `}
    >
        <span>
            {isVerbose ? 'Hide Intermediate Steps' : 'Show Intermediate Steps'}
        </span>
    </button>
);

const ProcessStateIndicator: React.FC<{ state: ProcessState }> = ({ state }) => {
    if (state.step === 'idle') return null;

    const getStateStyles = () => {
        switch (state.step) {
            case 'enhancing':
                return 'bg-purple-50 border-purple-200 text-purple-700';
            case 'generating':
                return 'bg-yellow-50 border-yellow-200 text-yellow-700';
            case 'analyzing':
                return 'bg-blue-50 border-blue-200 text-blue-700';
            default:
                return 'bg-slate-50 border-slate-200 text-slate-700';
        }
    };

    return (
        <div className={`
            fixed top-4 right-4 z-50 px-4 py-2 rounded-full
            border shadow-sm animate-fade-in
            ${getStateStyles()}
        `}>
            <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-r-transparent" />
                <span className="text-sm font-medium">{state.message}</span>
            </div>
        </div>
    );
};

const StatusBadge: React.FC<{ status: Iteration['status'] }> = ({ status }) => (
    <div className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full
        text-sm font-medium shadow-sm backdrop-blur-sm
        border transition-all duration-300
        ${getStatusStyles(status)}
    `}>
        {status === 'analyzing' && (
            <div className="animate-spin h-3 w-3 border-2 border-current rounded-full border-r-transparent" />
        )}
        {status}
    </div>
);

// Add type for subscription result
interface FalSubscriptionResult {
    data: {
        images: Array<{
            url: string;
        }>;
    };
    unsubscribe?: () => Promise<void>;
}

interface RembgResult {
    data?: {
        image?: {
            url: string;
        };
    };
}

// Add QR code modal state
interface QRModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const VenmoQRModal: React.FC<QRModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm"
             onClick={onClose}>
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full mx-4 transform transition-all"
                 onClick={e => e.stopPropagation()}>
                <div className="text-center space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-900">Support txt2bufo</h3>
                        <p className="text-sm text-slate-600">Your support helps keep the frogs hopping! 🐸</p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl shadow-inner">
                        <img 
                            src="/qr.png"
                            alt="Venmo QR Code"
                            className="w-full h-auto rounded-lg"
                        />
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600">Scan with your phone's camera or Venmo app</p>
                        <div className="flex flex-col gap-3">
                            <a
                                href="https://venmo.com/u/Artemii-Novoselov"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                Open in Venmo App
                                <span className="text-white opacity-75">📱</span>
                            </a>
                            <button
                                onClick={onClose}
                                className="text-slate-500 hover:text-slate-700 text-sm font-medium"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function ImageImprover() {
    const [prompt, setPrompt] = useState('');
    const [iterations, setIterations] = useState<Iteration[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentIteration, setCurrentIteration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [processState, setProcessState] = useState<ProcessState>({
        step: 'idle',
        message: ''
    });
    const [selectedMode, setSelectedMode] = useState<OutputMode>(OUTPUT_MODES[0]);
    const [isVerbose, setIsVerbose] = useState(false);
    // Create refs for scrolling
    const promptRefs = React.useRef<(HTMLDivElement | null)[]>([]);
    const imageRefs = React.useRef<(HTMLDivElement | null)[]>([]);
    const analysisRefs = React.useRef<(HTMLDivElement | null)[]>([]);
    const [selectedImprovement, setSelectedImprovement] = useState<{
        iterationNumber: number;
        improvementIndex: number;
    } | null>(null);
    const [currentSeed, setCurrentSeed] = useState<number | null>(null);
    const [selectedIterationNumber, setSelectedIterationNumber] = useState<number | null>(null);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);

    // Add this useEffect to handle the refs array
    React.useEffect(() => {
        promptRefs.current = promptRefs.current.slice(0, iterations.length);
        imageRefs.current = imageRefs.current.slice(0, iterations.length);
        analysisRefs.current = analysisRefs.current.slice(0, iterations.length);
    }, [iterations.length]);

    const generateImage = async (currentPrompt: string) => {
        setProcessState({ step: 'generating', message: 'Generating image with Fal.ai...' });

        let subscription: FalSubscriptionResult | undefined;
        try {
            // Generate initial image as before
            const styleInstruction = selectedMode.description;
            const fullPrompt = [
                currentPrompt,
                `Style: ${styleInstruction}`,
                'bufo',
                `Format: ${selectedMode.id}`
            ].filter(Boolean).join(' || ');

            const seed = currentSeed ?? Math.floor(Math.random() * 1000000);
            if (!currentSeed) {
                setCurrentSeed(seed);
            }

            subscription = await fal.subscribe('fal-ai/flux-lora', {
                input: {
                    prompt: fullPrompt,
                    num_images: 1,
                    enable_safety_checker: true,
                    safety_tolerance: "2",
                    seed: seed,
                    loras: [{
                        path: "https://storage.googleapis.com/fal-flux-lora/2e141fc0246b46b99b22ca362fd43feb_pytorch_lora_weights.safetensors",
                        scale: 1
                    }],
                    image_size: "square_hd"
                },
                logs: true
            });

            let imageUrl = subscription.data.images[0].url;

            // If in emoji mode, remove the background
            if (selectedMode.id === 'emoji') {
                setProcessState({ step: 'generating', message: 'Removing background for emoji...' });

                const rembgResult = await fal.subscribe("fal-ai/imageutils/rembg", {
                    input: {
                        image_url: imageUrl,
                        crop_to_bbox: true
                    },
                    logs: true
                }) as RembgResult;

                if (rembgResult?.data?.image?.url) {
                    imageUrl = rembgResult.data.image.url;
                } else {
                    console.warn('Background removal failed, using original image');
                }
            }

            return imageUrl;
        } catch (error) {
            try {
                // Attempt to unsubscribe if possible
                if (subscription?.unsubscribe) {
                    await subscription.unsubscribe();
                }
            } catch (unsubError) {
                console.warn('Failed to unsubscribe:', unsubError);
            }
            console.error('Detailed generation error:', error);
            
            // Properly handle the unknown error type
            if (error instanceof Error) {
                throw error;
            } else if (typeof error === 'string') {
                throw new Error(error);
            } else {
                throw new Error('An unknown error occurred during image generation');
            }
        }
    };

    const analyzeImage = async (imageUrl: string, prompt: string) => {
        setProcessState({ step: 'analyzing', message: 'Claude is analyzing the image...' });

        try {
            const requestPayload = {
                imageUrl,
                prompt,
                layout: {
                    id: selectedMode.id,
                    name: selectedMode.name,
                    description: selectedMode.description,
                    dimensions: selectedMode.dimensions
                }
            };

            console.log('Analyzing image request:', requestPayload);

            const response = await fetch('/api/analyze-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Analysis error details:', errorData);
                throw new Error(`Failed to analyze image: ${errorData.error || response.statusText}`);
            }

            const analysisResult = await response.json();
            console.log('Analysis result:', analysisResult);

            // Ensure the response has the correct structure
            return {
                description: analysisResult.description || 'No description available',
                isOptimal: analysisResult.isOptimal || false,
                improvements: Array.isArray(analysisResult.improvements)
                    ? analysisResult.improvements
                    : Array.isArray(analysisResult.improvementDirections)
                        ? analysisResult.improvementDirections
                        : []
            };
        } catch (error) {
            console.error('Error analyzing image:', error);
            throw error;
        }
    };

    const getStatusStyles = (status: Iteration['status']) => {
        switch (status) {
            case 'generating':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'analyzing':
                return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'complete':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'error':
                return 'text-red-600 bg-red-50 border-red-200';
            default:
                return 'text-slate-600 bg-slate-50 border-slate-200';
        }
    };

    const startImprovement = async () => {
        if (!prompt) return;

        setIsLoading(true);
        setCurrentIteration(0);
        setError(null);
        setCurrentSeed(null);
        setIterations([]);

        try {
            const enhancedPrompt = await enhancePrompt(prompt);
            let currentPrompt = enhancedPrompt;
            await processIteration(currentPrompt, 1);
        } catch (error) {
            console.error('Error in improvement loop:', error);
            setError('Failed to complete the improvement process: ' + (error as Error).message);
        } finally {
            setIsLoading(false);
            setProcessState({ step: 'idle', message: '' });
        }
    };

    // New helper function to process a single iteration
    const processIteration = async (currentPrompt: string, iterationNumber: number) => {
        setCurrentIteration(iterationNumber);
        setSelectedImprovement(null);
        setSelectedIterationNumber(iterationNumber);

        try {
            // Add new iteration to state
            setIterations(prev => {
                const newIterations = [
                    ...prev,
                    {
                        originalPrompt: iterationNumber === 1 ? prompt : prev[prev.length - 1].prompt,
                        prompt: currentPrompt,
                        imageUrl: '',
                        number: iterationNumber,
                        status: 'generating' as const
                    }
                ];

                // Scroll to the new prompt
                setTimeout(() => {
                    const newIndex = newIterations.length - 1;
                    promptRefs.current[newIndex]?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }, 100);

                return newIterations;
            });

            // Generate image
            const imageUrl = await generateImage(currentPrompt);

            // Update iteration with image
            setIterations(prev => {
                const updatedIterations = prev.map(it =>
                    it.number === iterationNumber
                        ? { ...it, imageUrl, status: 'analyzing' as const }
                        : it
                );

                setTimeout(() => {
                    const currentIndex = iterationNumber - 1;
                    imageRefs.current[currentIndex]?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }, 100);

                return updatedIterations;
            });

            // Analyze image
            const analysis = await analyzeImage(imageUrl, currentPrompt);

            // Update iteration with analysis
            setIterations(prev => {
                const updatedIterations = prev.map(it =>
                    it.number === iterationNumber
                        ? {
                            ...it,
                            analysis: {
                                description: analysis.description || 'No description available',
                                isOptimal: analysis.isOptimal || false,
                                improvementDirections: Array.isArray(analysis.improvements)
                                    ? analysis.improvements.map(imp => ({
                                        title: imp.title || 'Improvement Option',
                                        description: imp.description || '',
                                        prompt: imp.prompt || ''
                                    }))
                                    : []
                            },
                            status: 'complete' as const
                        }
                        : it
                );

                setTimeout(() => {
                    const currentIndex = iterationNumber - 1;
                    analysisRefs.current[currentIndex]?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }, 100);

                return updatedIterations;
            });

        } catch (error) {
            console.error(`Error in iteration ${iterationNumber}:`, error);
            setIterations(prev => prev.map(it =>
                it.number === iterationNumber
                    ? { ...it, status: 'error' as const }
                    : it
            ));
            throw error;
        }
    };


    const handleImprovementSelection = async (iteration: Iteration, direction: ImprovementDirection, improvementIndex: number) => {
        setIsLoading(true);
        setError(null);
        setSelectedImprovement({
            iterationNumber: iteration.number,
            improvementIndex: improvementIndex
        });

        try {
            await processIteration(direction.prompt, iteration.number + 1);
        } catch (error) {
            setError(`Failed at iteration ${iteration.number + 1}: ${(error as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const enhancePrompt = async (
        promptToEnhance: string,
        imageDescription?: string,
        improvements?: string
    ) => {
        setProcessState({ step: 'enhancing', message: 'Claude is improving the prompt...' });

        try {
            // Match the payload structure expected by the API
            const requestPayload = {
                originalPrompt: promptToEnhance,
                imageDescription,
                improvements,
                layout: {
                    id: selectedMode.id,
                    name: selectedMode.name,
                    description: selectedMode.description,
                    dimensions: selectedMode.dimensions
                }
            };

            console.log('Sending request with payload:', requestPayload);

            const response = await fetch('/api/enhance-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestPayload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('Prompt enhancement error details:', errorData);
                throw new Error(`Failed to enhance prompt: ${errorData.error || response.statusText}`);
            }

            const enhancedPrompt = await response.json();
            console.log('Enhanced prompt:', enhancedPrompt);
            return enhancedPrompt;
        } catch (error) {
            console.error('Error enhancing prompt:', error);
            throw new Error(`Prompt enhancement failed: ${(error as Error).message || error}`);
        }
    };

    const handlePromptChange = React.useCallback((value: string) => {
        setPrompt(value);
    }, []);

    const handleModeChange = (mode: string) => {
        setSelectedMode(OUTPUT_MODES.find(m => m.id === mode) || OUTPUT_MODES[0]);
    };

    // Get currently selected iteration
    const selectedIteration = iterations.find(it => it.number === selectedIterationNumber);

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Donation Banner */}
            <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-4 z-50 shadow-lg">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-300 animate-bounce">⭐</span>
                        <p className="text-sm md:text-base">
                            Love txt2bufo? Help keep the magic alive!
                        </p>
                    </div>
                    <button
                        onClick={() => setIsQRModalOpen(true)}
                        className="px-4 py-1 bg-white text-indigo-600 rounded-full text-sm font-medium hover:bg-yellow-100 transition-colors duration-200 flex items-center gap-2"
                    >
                        Support the Project
                        <span className="text-xs opacity-75">📱</span>
                    </button>
                </div>
            </div>

            {/* QR Code Modal */}
            <VenmoQRModal 
                isOpen={isQRModalOpen}
                onClose={() => setIsQRModalOpen(false)}
            />

            {/* Left Controls Sidebar */}
            <div className="w-[320px] h-full bg-white border-r border-slate-200 flex flex-col">
                {/* Add padding-top to account for the banner */}
                <div className="p-8 border-b border-slate-100 mt-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-slate-900">
                                <span>txt</span>
                                <span className="text-indigo-600">2</span>
                                <span>bufo</span>
                            </h1>
                            <span className="text-2xl animate-bounce">🐸</span>
                        </div>
                        <p className="text-slate-600">
                            Transform your ideas into beautiful <span className="text-indigo-600 font-medium">Bufos</span>
                        </p>
                    </div>
                </div>

                {/* Controls Section */}
                <div className="flex-1 p-8 space-y-8">
                    {/* Verbose Toggle */}
                    <div className="flex justify-end">
                        <VerboseToggle
                            isVerbose={isVerbose}
                            onChange={setIsVerbose}
                        />
                    </div>

                    {/* Mode Selection */}
                    <div className="space-y-4">
                        <label className="text-sm font-medium text-slate-700">Output Mode</label>
                        <div className="grid grid-cols-1 gap-3">
                            {OUTPUT_MODES.map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setSelectedMode(mode)}
                                    className={`
                                        p-4 rounded-lg text-left transition-colors duration-200
                                        ${selectedMode.id === mode.id
                                            ? 'bg-indigo-50 ring-2 ring-indigo-500'
                                            : 'bg-white ring-1 ring-slate-200 hover:ring-indigo-300'
                                        }
                                    `}
                                >
                                    <div className="font-medium text-slate-900">{mode.name}</div>
                                    <div className="mt-1 text-sm text-slate-600">
                                        {mode.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Prompt Input */}
                    <div className="space-y-4">
                        <label className="text-sm font-medium text-slate-700">Your Prompt</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe your vision..."
                            className="w-full h-32 p-4 rounded-lg text-slate-900 bg-white ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                        />
                        <button
                            onClick={startImprovement}
                            disabled={isLoading || prompt.trim() === ''}
                            className={`
                                w-full py-3 px-4 rounded-lg font-medium
                                transition-all duration-200 flex items-center justify-center gap-2
                                ${isLoading || prompt.trim() === ''
                                    ? 'bg-slate-100 text-slate-400'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                }
                            `}
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                'Generate Bufo'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Image Display with Gallery */}
            <div className="flex-1 flex flex-col">
                {/* Add padding-top to account for the banner */}
                <div className="flex-1 flex items-center justify-center p-8 mt-12">
                    {selectedIteration ? (
                        <div className="relative w-full max-w-2xl mx-auto">
                            {/* Main Image */}
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-12 transition-all duration-300">
                                <div className="p-4">
                                    <div className="relative aspect-square rounded-lg overflow-hidden">
                                        {selectedIteration.imageUrl ? (
                                            <img
                                                src={selectedIteration.imageUrl}
                                                alt={`Iteration ${selectedIteration.number}`}
                                                className="w-full h-full object-contain transition-opacity duration-300"
                                            />
                                        ) : (
                                            <ImageLoadingAnimation />
                                        )}
                                        <div className="absolute top-4 right-4">
                                            <StatusBadge status={selectedIteration.status} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Gallery */}
                            {iterations.length > 0 && (
                                <div className="absolute left-1/2 -translate-x-1/2 -bottom-24 w-full max-w-xl">
                                    <div className="flex items-center justify-center gap-6 p-4 bg-white rounded-2xl shadow-sm">
                                        {iterations.map((iteration) => (
                                            <button
                                                key={iteration.number}
                                                onClick={() => setSelectedIterationNumber(iteration.number)}
                                                className={`
                                                    relative group w-24 h-24 rounded-xl overflow-hidden
                                                    transition-all duration-300 ease-in-out
                                                    ${iteration.number === selectedIterationNumber
                                                        ? 'ring-2 ring-indigo-500 ring-offset-2 scale-105'
                                                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                                                    }
                                                `}
                                            >
                                                {iteration.imageUrl ? (
                                                    <img
                                                        src={iteration.imageUrl}
                                                        alt={`Version ${iteration.number}`}
                                                        className="w-full h-full object-cover transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full">
                                                        <ImageLoadingAnimation />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 flex items-center justify-center
                                                    bg-black/0 group-hover:bg-black/10 transition-colors duration-200">
                                                    <span className="text-sm font-medium text-white/90 
                                                        shadow-sm px-2 py-1 rounded-full bg-black/20">
                                                        #{iteration.number}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-slate-400">Enter a prompt to get started</div>
                    )}
                </div>

                {/* Spacer for Gallery */}
                <div className="h-32" />
            </div>

            {/* Enhancement Panel - Right Side */}
            <div className="w-[320px] bg-white border-l border-slate-200">
                {/* Add padding-top to account for the banner */}
                <div className="p-6 mt-12">
                    <h3 className="text-sm font-medium text-slate-900 mb-6">
                        Enhancement Options
                    </h3>

                    {selectedIteration?.analysis?.improvementDirections.map((direction, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleImprovementSelection(selectedIteration, direction, idx)}
                            disabled={isLoading}
                            className={`
                                w-full p-4 rounded-lg text-left transition-all duration-200
                                group relative border-2 mb-3
                                ${selectedImprovement?.improvementIndex === idx
                                    ? 'bg-indigo-50 border-indigo-500'
                                    : 'hover:bg-slate-50 border-slate-200'
                                }
                            `}
                        >
                            <h4 className="text-sm font-medium text-slate-900 mb-1">
                                {direction.title}
                            </h4>
                            <p className="text-xs text-slate-600 pr-6">
                                {direction.description}
                            </p>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 
                                text-slate-400 group-hover:text-indigo-500 transition-colors duration-200">
                                →
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}