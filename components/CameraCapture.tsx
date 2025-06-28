/** @format */

'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface CameraCaptureProps {
  onTasksExtracted: (tasks: string[]) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onTasksExtracted,
  onClose,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Could not access camera. Please check permissions.');
      console.error('Camera access error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setCapturedImage(result);
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const processImage = useCallback(async () => {
    if (!capturedImage) return;

    setLoading(true);
    setError(null);

    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('image', blob, 'notebook.jpg');

      const res = await fetch('/api/ocr-tasks', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.tasks && data.tasks.length > 0) {
        onTasksExtracted(data.tasks);
        toast.success(`${data.tasks.length} tasks extracted from image!`);
        onClose();
      } else {
        setError(
          'No tasks found in the image. Please try again with a clearer photo.'
        );
      }
    } catch (err) {
      setError('Failed to process image. Please try again.');
      console.error('Image processing error:', err);
    } finally {
      setLoading(false);
    }
  }, [capturedImage, onTasksExtracted, onClose]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setError(null);
    startCamera();
  }, [startCamera]);

  React.useEffect(() => {
    // Detect if device is mobile (screen width < md)
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  React.useEffect(() => {
    if (isMobile) {
      startCamera();
      return () => {
        stopCamera();
      };
    }
    // If not mobile, ensure camera is stopped
    stopCamera();
    // eslint-disable-next-line
  }, [isMobile, startCamera, stopCamera]);

  return (
    <div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto'>
        <div className='p-4 border-b'>
          <h3 className='text-lg font-semibold'>Capture Notebook Tasks</h3>
          <p className='text-sm text-gray-600 mt-1'>
            Take a photo of your notebook to extract tasks
          </p>
        </div>

        <div className='p-4'>
          {!capturedImage ? (
            <div className='space-y-4'>
              {/* Camera View (Mobile Only) */}
              {isMobile && (
                <div className='relative bg-gray-100 rounded-lg overflow-hidden'>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className='w-full h-64 object-cover'
                  />
                  {error && (
                    <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-50'>
                      <div className='text-white text-center p-4'>
                        <p className='text-sm'>{error}</p>
                        <Button
                          onClick={startCamera}
                          className='mt-2'
                          size='sm'>
                          Retry Camera
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Camera Controls (Mobile Only) */}
              <div className='flex justify-center space-x-4'>
                {isMobile && (
                  <Button
                    onClick={capturePhoto}
                    disabled={!stream || !!error}
                    className='flex items-center gap-2 block md:hidden'>
                    <Camera className='w-4 h-4' />
                    Capture Photo
                  </Button>
                )}
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant='outline'
                  className='flex items-center gap-2'>
                  <Upload className='w-4 h-4' />
                  Upload Image
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                onChange={handleFileUpload}
                className='hidden'
              />
            </div>
          ) : (
            <div className='space-y-4'>
              {/* Captured Image */}
              <div className='relative'>
                <img
                  src={capturedImage}
                  alt='Captured notebook'
                  className='w-full h-64 object-cover rounded-lg'
                />
              </div>

              {/* Action Buttons */}
              <div className='flex justify-center space-x-4'>
                <Button
                  onClick={processImage}
                  disabled={loading}
                  className='flex items-center gap-2'>
                  {loading ? 'Processing...' : 'Extract Tasks'}
                </Button>
                <Button
                  onClick={retakePhoto}
                  variant='outline'
                  className='flex items-center gap-2'>
                  <RotateCcw className='w-4 h-4' />
                  Retake
                </Button>
              </div>

              {error && (
                <div className='text-red-500 text-sm text-center'>{error}</div>
              )}
            </div>
          )}
        </div>

        <div className='p-4 border-t'>
          <Button
            onClick={onClose}
            variant='outline'
            className='w-full'>
            Cancel
          </Button>
        </div>
      </div>

      {/* Hidden canvas for capturing */}
      <canvas
        ref={canvasRef}
        className='hidden'
      />
    </div>
  );
};

export default CameraCapture;
