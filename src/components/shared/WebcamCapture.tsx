import {
    useState, useRef, useCallback, useEffect
} from 'react';
import {
    Camera, RotateCcw, Check, X
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface WebcamCaptureProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (imageData: string) => void;
}

export function WebcamCapture({ isOpen, onClose, onCapture }: WebcamCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [isStreaming, setIsStreaming] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

    // Start webcam stream
    const startStream = useCallback(async () => {
        try {
            setError(null);

            // Stop existing stream if any
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode,
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                },
                audio: false,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setIsStreaming(true);
            }
        } catch (err) {
            console.error('Error accessing webcam:', err);
            setError('Não foi possível acessar a câmera. Verifique as permissões.');
            setIsStreaming(false);
        }
    }, [facingMode]);

    // Stop webcam stream
    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsStreaming(false);
    }, []);

    // Capture photo
    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0);

        // Convert to base64
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);

        // Stop the stream to free resources
        stopStream();
    }, [stopStream]);

    // Toggle camera (front/back)
    const toggleCamera = useCallback(() => {
        setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
    }, []);

    // Retake photo
    const retakePhoto = useCallback(() => {
        setCapturedImage(null);
        startStream();
    }, [startStream]);

    // Confirm capture
    const confirmCapture = useCallback(() => {
        if (capturedImage) {
            onCapture(capturedImage);
            onClose();
        }
    }, [capturedImage, onCapture, onClose]);

    // Start stream when dialog opens
    useEffect(() => {
        if (isOpen && !capturedImage) {
            startStream();
        }

        return () => {
            stopStream();
        };
    }, [isOpen, startStream, stopStream, capturedImage]);

    // Restart stream when facing mode changes
    useEffect(() => {
        if (isOpen && !capturedImage && isStreaming) {
            startStream();
        }
    }, [facingMode]);

    // Handle dialog close
    const handleClose = useCallback(() => {
        stopStream();
        setCapturedImage(null);
        setError(null);
        onClose();
    }, [stopStream, onClose]);

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Capturar Foto</DialogTitle>
                    <DialogDescription>
                        Posicione-se em frente à câmera e clique em capturar
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Video/Image display area */}
                    <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                        {error ? (
                            <div className="absolute inset-0 flex items-center justify-center text-center p-4">
                                <div>
                                    <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                                    <p className="text-sm text-destructive">{error}</p>
                                    <button
                                        className="btn-secondary mt-4"
                                        onClick={startStream}
                                    >
                                        Tentar novamente
                                    </button>
                                </div>
                            </div>
                        ) : capturedImage ? (
                            <img
                                src={capturedImage}
                                alt="Captured"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                        )}

                        {/* Hidden canvas for capture */}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {/* Controls */}
                    <div className="flex justify-center gap-4">
                        {capturedImage ? (
                            <>
                                <button
                                    className="btn-secondary"
                                    onClick={retakePhoto}
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Tirar outra
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={confirmCapture}
                                >
                                    <Check className="w-4 h-4" />
                                    Usar foto
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    className="btn-secondary"
                                    onClick={toggleCamera}
                                    disabled={!isStreaming}
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Inverter
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={capturePhoto}
                                    disabled={!isStreaming}
                                >
                                    <Camera className="w-4 h-4" />
                                    Capturar
                                </button>
                                <button
                                    className="btn-secondary"
                                    onClick={handleClose}
                                >
                                    <X className="w-4 h-4" />
                                    Cancelar
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default WebcamCapture;
