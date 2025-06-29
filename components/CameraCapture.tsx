/** @format */

'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import Webcam from 'react-webcam';

interface CameraCaptureProps {
  onTasksExtracted: (tasks: string[]) => void;
  onClose: () => void;
}

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );
};

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onTasksExtracted,
  onClose,
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
      } else {
        setError('Failed to capture photo. Please try again.');
      }
    }
  }, []);

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
  }, []);

  const handleClose = useCallback(() => {
    setCapturedImage(null);
    setError(null);
    setLoading(false);
    onClose();
  }, [onClose]);

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
              {isMobile ? (
                <div className='relative bg-gray-100 rounded-lg overflow-hidden'>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat='image/jpeg'
                    videoConstraints={{ facingMode: 'environment' }}
                    className='w-full h-64 object-cover rounded-lg'
                  />
                </div>
              ) : null}
              <div className='flex justify-center space-x-4'>
                {isMobile ? (
                  <Button
                    onClick={capturePhoto}
                    variant='default'
                    className='flex items-center gap-2  md:hidden'>
                    <Camera className='w-4 h-4' />
                    Capture Photo
                  </Button>
                ) : null}
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
              <div className='relative'>
                <img
                  src={capturedImage}
                  alt='Captured notebook'
                  className='w-full h-64 object-cover rounded-lg'
                />
              </div>
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
            onClick={handleClose}
            variant='outline'
            className='w-full'>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
