import { useState, useEffect } from 'react';
import { useNivaariStore } from '@/lib/nivaariStore';

interface TutorialOverlayProps {
  onFinish: () => void;
}

export default function TutorialOverlay({ onFinish }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);

  // listen for first placement event
  useEffect(() => {
    const handlePlace = () => {
      if (step === 1) {
        setStep(2);
      }
    };
    window.addEventListener('tutorial-place', handlePlace as EventListener);
    return () => window.removeEventListener('tutorial-place', handlePlace as EventListener);
  }, [step]);

  const close = () => {
    onFinish();
  };

  const baseStyles = 'absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
  const boxStyles = 'bg-white rounded-lg p-6 max-w-md text-center';
  const buttonStyles = 'mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700';

  if (step === 0) {
    return (
      <div className={baseStyles}>
        <div className={boxStyles}>
          <h2 className="text-xl font-bold mb-4">Welcome to Nivaari!</h2>
          <p className="mb-6">Let's take a quick tour to get you started. You'll earn 50 reputation for finishing.</p>
          <button className={buttonStyles} onClick={() => setStep(1)}>Start Tutorial</button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className={baseStyles}>
        <div className={boxStyles}>
          <h2 className="text-xl font-bold mb-4">Place your first tile</h2>
          <p className="mb-6">Choose any tool from the toolbar and tap on the grid to add a tile. I'll wait here.</p>
          <p className="text-sm text-gray-500">(You can drag for multi‑tile shapes, too)</p>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className={baseStyles}>
        <div className={boxStyles}>
          <h2 className="text-xl font-bold mb-4">Great work!</h2>
          <p className="mb-6">You've placed a tile and completed the tutorial. You've been awarded 50 reputation.</p>
          <button className={buttonStyles} onClick={close}>Continue</button>
        </div>
      </div>
    );
  }

  return null;
}
