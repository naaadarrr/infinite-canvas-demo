import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Crown, CloudUpload, ChevronDown, X, Lightbulb } from 'lucide-react';
import { ImmersiveModal } from './ImmersiveModal';

type FaceSource = 'photo' | 'describe';
type AvatarStyle = 'ugc' | 'pro';
type AspectRatio = '9:16' | '1:1' | '16:9';

export interface DesignMyAvatarSubmitData {
  actionId: 'design-avatar';
  faceSource: FaceSource;
  photoUrl?: string;
  gender?: string;
  age?: string;
  ethnicity?: string;
  style: AvatarStyle;
  aspectRatio: AspectRatio;
  prompt: string;
}

export interface DesignMyAvatarModalProps {
  open: boolean;
  onClose: () => void;
  credits?: number;
  onSubmit: (data: DesignMyAvatarSubmitData) => void;
  samplePrompts?: string[];
}

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary'];
const AGE_OPTIONS = ['Young (18-25)', 'Adult (26-40)', 'Middle-aged (41-60)', 'Senior (60+)'];
const ETHNICITY_OPTIONS = ['Asian', 'Black', 'Caucasian', 'Hispanic', 'Middle Eastern', 'Mixed', 'South Asian'];

const DEFAULT_SAMPLES = [
  'A professional business woman in a modern office, wearing a navy blazer, warm lighting, confident expression',
  'A friendly young man in casual streetwear, urban background, natural smile, soft daylight',
  'A doctor in a white coat, hospital setting, trustworthy expression, clean background',
];

const sectionLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.5)',
  display: 'block',
  marginBottom: 6,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const segBtn = (active: boolean): React.CSSProperties => ({
  flex: 1,
  height: 34,
  borderRadius: 8,
  border: active ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
  background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
  color: active ? '#fff' : 'rgba(255,255,255,0.4)',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 120ms ease',
});

function SelectDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    window.addEventListener('mousedown', handler, true);
    return () => window.removeEventListener('mousedown', handler, true);
  }, [isOpen]);

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 4 }}>{label}</span>
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        style={{
          width: '100%',
          height: 36,
          padding: '0 10px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          color: value ? '#fff' : 'rgba(255,255,255,0.3)',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || label}</span>
        <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
      </button>
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            padding: 4,
            borderRadius: 8,
            background: '#1e1e1e',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            zIndex: 30,
            maxHeight: 180,
            overflowY: 'auto',
          }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: 'none',
                borderRadius: 4,
                background: opt === value ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: opt === value ? '#fff' : 'rgba(255,255,255,0.6)',
                fontSize: 12,
                fontWeight: opt === value ? 500 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 80ms ease',
              }}
              onMouseEnter={(e) => {
                if (opt !== value) e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseLeave={(e) => {
                if (opt !== value) e.currentTarget.style.background = opt === value ? 'rgba(255,255,255,0.08)' : 'transparent';
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DesignMyAvatarModal({
  open,
  onClose,
  credits = 2,
  onSubmit,
  samplePrompts,
}: DesignMyAvatarModalProps) {
  const [faceSource, setFaceSource] = useState<FaceSource>('photo');
  const [photoUrl, setPhotoUrl] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [ethnicity, setEthnicity] = useState('');
  const [style, setStyle] = useState<AvatarStyle>('ugc');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [prompt, setPrompt] = useState('');
  const [samplesOpen, setSamplesOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const samples = samplePrompts ?? DEFAULT_SAMPLES;

  useEffect(() => {
    if (open) {
      setFaceSource('photo');
      setPhotoUrl('');
      setGender('');
      setAge('');
      setEthnicity('');
      setStyle('ugc');
      setAspectRatio('9:16');
      setPrompt('');
      setSamplesOpen(false);
    }
  }, [open]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUrl(URL.createObjectURL(file));
    e.target.value = '';
  }, []);

  const hasFace = faceSource === 'photo' ? !!photoUrl : (!!gender && !!age);
  const hasPrompt = prompt.trim().length > 0;
  const canSubmit = hasFace && hasPrompt;

  const handleSubmit = useCallback(() => {
    if (!canSubmit) return;
    onSubmit({
      actionId: 'design-avatar',
      faceSource,
      photoUrl: faceSource === 'photo' ? photoUrl : undefined,
      gender: faceSource === 'describe' ? gender : undefined,
      age: faceSource === 'describe' ? age : undefined,
      ethnicity: faceSource === 'describe' ? ethnicity : undefined,
      style,
      aspectRatio,
      prompt,
    });
  }, [canSubmit, onSubmit, faceSource, photoUrl, gender, age, ethnicity, style, aspectRatio, prompt]);

  return (
    <ImmersiveModal
      open={open}
      title="Design My Avatar"
      subtitle="Create a custom avatar template from a photo or description"
      onClose={onClose}
      maxWidth={640}
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' }}>
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              height: 44,
              width: 400,
              maxWidth: '90%',
              padding: '0 24px',
              borderRadius: 8,
              border: 'none',
              fontSize: 14,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'all 120ms ease',
              background: canSubmit ? '#3643FF' : 'rgba(255,255,255,0.08)',
              color: canSubmit ? '#fff' : 'rgba(255,255,255,0.4)',
              cursor: canSubmit ? 'pointer' : 'default',
            }}
            onMouseEnter={(e) => {
              if (canSubmit) e.currentTarget.style.background = '#4a55ff';
            }}
            onMouseLeave={(e) => {
              if (canSubmit) e.currentTarget.style.background = '#3643FF';
            }}
          >
            <span>Generate</span>
            <div style={{ width: 1, height: 16, background: canSubmit ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Crown size={16} color={canSubmit ? '#facc15' : 'currentColor'} />
              <span>{credits}</span>
            </div>
          </button>
        </div>
      }
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          padding: '4px 0',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.06) transparent',
        }}
      >
        {/* Face Source */}
        <div>
          <span style={sectionLabel}>Face Source</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => setFaceSource('photo')} style={segBtn(faceSource === 'photo')}>
              Photo Upload
            </button>
            <button type="button" onClick={() => setFaceSource('describe')} style={segBtn(faceSource === 'describe')}>
              Describe
            </button>
          </div>
        </div>

        {/* Photo upload */}
        {faceSource === 'photo' && (
          <div>
            {photoUrl ? (
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 280,
                  aspectRatio: '3/4',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: '#111',
                }}
              >
                <img src={photoUrl} alt="Face" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <button
                  type="button"
                  onClick={() => {
                    if (photoUrl.startsWith('blob:')) URL.revokeObjectURL(photoUrl);
                    setPhotoUrl('');
                  }}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 32,
                    height: 32,
                    borderRadius: 4,
                    background: 'rgba(0,0,0,0.4)',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  height: 140,
                  borderRadius: 10,
                  border: '1.5px dashed rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.02)',
                  color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  transition: 'all 120ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                }}
              >
                <CloudUpload size={24} style={{ opacity: 0.4 }} />
                Upload a face photo
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>JPG, PNG supported</span>
              </button>
            )}
          </div>
        )}

        {/* Describe mode */}
        {faceSource === 'describe' && (
          <div style={{ display: 'flex', gap: 10 }}>
            <SelectDropdown label="Gender" value={gender} options={GENDER_OPTIONS} onChange={setGender} />
            <SelectDropdown label="Age" value={age} options={AGE_OPTIONS} onChange={setAge} />
            <SelectDropdown label="Ethnicity" value={ethnicity} options={ETHNICITY_OPTIONS} onChange={setEthnicity} />
          </div>
        )}

        {/* Style */}
        <div>
          <span style={sectionLabel}>Style</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => setStyle('ugc')} style={segBtn(style === 'ugc')}>
              UGC
            </button>
            <button type="button" onClick={() => setStyle('pro')} style={segBtn(style === 'pro')}>
              Pro
            </button>
          </div>
        </div>

        {/* Aspect Ratio */}
        <div>
          <span style={sectionLabel}>Aspect Ratio</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['9:16', '1:1', '16:9'] as AspectRatio[]).map((r) => (
              <button key={r} type="button" onClick={() => setAspectRatio(r)} style={segBtn(aspectRatio === r)}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt */}
        <div>
          <span style={sectionLabel}>Appearance Prompt</span>
          <div style={{ position: 'relative' }}>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your avatar's appearance, outfit, background..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                paddingBottom: 32,
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                color: '#fff',
                fontSize: 13,
                lineHeight: '1.5',
                resize: 'none',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 12,
                right: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setSamplesOpen((p) => !p)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.35)',
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: 0,
                    transition: 'color 100ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.35)';
                  }}
                >
                  <Lightbulb size={12} />
                  Sample Prompts
                </button>
                {samplesOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: 0,
                      width: 360,
                      padding: 4,
                      borderRadius: 8,
                      background: '#1e1e1e',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                      zIndex: 30,
                    }}
                  >
                    {samples.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setPrompt(s);
                          setSamplesOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          border: 'none',
                          borderRadius: 6,
                          background: 'transparent',
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: 12,
                          lineHeight: '1.4',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 80ms ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  color: prompt.length > 2000 ? '#ef4444' : 'rgba(255,255,255,0.25)',
                }}
              >
                {prompt.length}/2000
              </span>
            </div>
          </div>
        </div>
      </div>
    </ImmersiveModal>
  );
}
