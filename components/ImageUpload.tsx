import React, { useRef, useState } from 'react';

interface ImageUploadProps {
  onImageSelected: (file: File, preview: string) => void;
  onDetecting?: (detecting: boolean) => void;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelected,
  onDetecting,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        onImageSelected(file, preview);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Back camera on mobile
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
      }
    } catch (err) {
      setCameraError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
            const preview = canvasRef.current?.toDataURL('image/jpeg') || '';
            onImageSelected(file, preview);
            closeCamera();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const closeCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setIsCameraOpen(false);
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'grid', gap: 4 }}>
        <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 700 }}>Add a photo</div>
        <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.45 }}>
          A clear image helps the assistant detect the issue and prefill the report faster.
        </div>
      </div>

      {isCameraOpen ? (
        <div
          style={{
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid rgba(148,163,184,0.24)',
            background: 'rgba(2,6,23,0.92)',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              background: '#020617',
            }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 12 }}>
            <button
              type="button"
              onClick={capturePhoto}
              style={{
                borderRadius: 12,
                border: '1px solid rgba(134,239,172,0.3)',
                background: 'linear-gradient(145deg, rgba(22,163,74,0.34), rgba(21,128,61,0.52))',
                color: '#dcfce7',
                padding: '11px 12px',
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              📸 Capture
            </button>
            <button
              type="button"
              onClick={closeCamera}
              style={{
                borderRadius: 12,
                border: '1px solid rgba(248,113,113,0.3)',
                background: 'rgba(239,68,68,0.16)',
                color: '#fecaca',
                padding: '11px 12px',
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>
      ) : (
        <>
          {cameraError && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 12,
                background: 'rgba(239,68,68,0.14)',
                border: '1px solid rgba(248,113,113,0.28)',
                color: '#fecaca',
                fontSize: 12,
                lineHeight: 1.45,
              }}
            >
              {cameraError}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              style={{
                borderRadius: 12,
                border: '1px solid rgba(125,211,252,0.22)',
                background: 'rgba(15,23,42,0.72)',
                color: '#e2e8f0',
                padding: '12px 14px',
                fontWeight: 700,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                minHeight: 46,
              }}
            >
              📁 Choose image
            </button>
            <button
              type="button"
              onClick={startCamera}
              disabled={disabled}
              style={{
                borderRadius: 12,
                border: '1px solid rgba(251,113,133,0.28)',
                background: 'linear-gradient(145deg, rgba(190,24,93,0.4), rgba(127,29,29,0.56))',
                color: '#ffe4e6',
                padding: '12px 14px',
                fontWeight: 700,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : 1,
                minHeight: 46,
              }}
            >
              📷 Take photo
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </>
      )}
    </div>
  );
};
