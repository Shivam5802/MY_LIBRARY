import React, { useRef, useState } from 'react';
import { Camera, Trash2, Crop } from 'lucide-react';
import { ImageCropModal } from './ImageCropModal';

interface ImageUploadProps {
  label: string;
  value?: string | null;
  onChange: (base64: string | null) => void;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  value,
  onChange,
  disabled,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedRawImage, setSelectedRawImage] = useState<string | null>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedRawImage(base64);
      setIsCropModalOpen(true);
      // Reset input value so re-selecting the exact same file triggers onChange
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedBase64: string) => {
    onChange(croppedBase64);
    setIsCropModalOpen(false);
  };

  const handleOpenExistingCrop = () => {
    if (value) {
      setSelectedRawImage(value);
      setIsCropModalOpen(true);
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-4">
        {/* Preview Circle */}
        <div className="relative w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0 group shadow-xs">
          {value ? (
            <>
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={handleOpenExistingCrop}
                disabled={disabled}
                className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                title="Crop & Adjust Photo"
              >
                <Crop className="w-5 h-5 text-indigo-300" />
              </button>
            </>
          ) : (
            <Camera className="w-6 h-6 text-slate-400 dark:text-slate-500" />
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={disabled}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            {value ? 'Change Photo' : 'Upload Photo'}
          </button>

          {value && (
            <>
              <button
                type="button"
                disabled={disabled}
                onClick={handleOpenExistingCrop}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600/10 dark:hover:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 transition-colors cursor-pointer"
                title="Crop and adjust photo position/zoom"
              >
                <Crop className="w-3.5 h-3.5" />
                Crop &amp; Adjust
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 transition-colors cursor-pointer"
                title="Remove Photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Interactive Crop & Adjust Modal */}
      {selectedRawImage && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageSrc={selectedRawImage}
          onCropComplete={handleCropComplete}
          onClose={() => setIsCropModalOpen(false)}
        />
      )}
    </div>
  );
};
