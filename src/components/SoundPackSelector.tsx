import { useState, useEffect } from 'react';
import {
  SOUND_PACKS,
  SoundPackId,
  getStoredSoundPack,
  saveSoundPack,
  getStoredSoundVolume,
  saveSoundVolume,
  playKeypressSound,
} from '@/utils/audio-engine';
import { Volume2, VolumeX, Volume1, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SoundPackSelector() {
  const [selectedPack, setSelectedPack] = useState<SoundPackId>('holy-panda');
  const [volume, setVolume] = useState<number>(0.6);

  useEffect(() => {
    setSelectedPack(getStoredSoundPack());
    setVolume(getStoredSoundVolume());
  }, []);

  function handleSelectPack(id: SoundPackId) {
    setSelectedPack(id);
    saveSoundPack(id);
    if (id !== 'muted') {
      playKeypressSound('key');
    }
  }

  function handleVolumeChange(newVolume: number) {
    setVolume(newVolume);
    saveSoundVolume(newVolume);
  }

  function handleTestSound() {
    playKeypressSound('key');
    setTimeout(() => playKeypressSound('space'), 120);
    setTimeout(() => playKeypressSound('enter'), 240);
  }

  return (
    <div className="rounded-2xl border bg-card/90 p-5 backdrop-blur-md shadow-2xl space-y-5">
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎹</span>
          <div>
            <h3 className="font-bold text-base tracking-tight text-foreground">Mechanical Switch Sound Engine</h3>
            <p className="text-xs text-muted-foreground">Select your favorite mechanical keyboard switch audio profile.</p>
          </div>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={handleTestSound} className="gap-1.5 text-xs">
          <Sparkles className="size-3.5 text-amber-400" /> Test Sound
        </Button>
      </div>

      {/* SoundPack Grid Options */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {SOUND_PACKS.map((pack) => {
          const isSelected = selectedPack === pack.id;
          return (
            <button
              key={pack.id}
              type="button"
              onClick={() => handleSelectPack(pack.id)}
              className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all active:scale-[0.98] ${
                isSelected
                  ? 'border-amber-500/60 bg-amber-500/10 text-foreground ring-1 ring-amber-500/50 shadow-md'
                  : 'border-border/60 bg-card/50 hover:bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="text-2xl select-none">{pack.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{pack.name}</span>
                  {isSelected && <Check className="size-3.5 text-amber-500 shrink-0" />}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{pack.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Volume Slider */}
      <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3 text-xs">
        <div className="flex items-center gap-2">
          {volume === 0 || selectedPack === 'muted' ? (
            <VolumeX className="size-4 text-muted-foreground" />
          ) : volume < 0.5 ? (
            <Volume1 className="size-4 text-amber-400" />
          ) : (
            <Volume2 className="size-4 text-amber-400" />
          )}
          <span className="font-medium text-foreground">Switch Audio Volume</span>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={selectedPack === 'muted' ? 0 : volume}
            disabled={selectedPack === 'muted'}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-32 accent-amber-500 cursor-pointer"
          />
          <span className="w-8 text-right font-mono font-bold text-foreground tabular-nums">
            {selectedPack === 'muted' ? '0%' : `${Math.round(volume * 100)}%`}
          </span>
        </div>
      </div>
    </div>
  );
}
