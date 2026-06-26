import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Switch } from '../../../components/ui/switch';
import { PRESET_RATIOS } from '../hooks/useAspectRatio';

interface CustomRatioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWidth: number;
  currentHeight: number;
  onApply: (width: number, height: number, name: string) => void;
}

export const CustomRatioModal: React.FC<CustomRatioModalProps> = ({
  open,
  onOpenChange,
  currentWidth,
  currentHeight,
  onApply,
}) => {
  const [width, setWidth] = useState<string>(currentWidth.toString());
  const [height, setHeight] = useState<string>(currentHeight.toString());
  const [isLocked, setIsLocked] = useState(false);
  const [lockedRatio, setLockedRatio] = useState<number>(currentWidth / currentHeight);

  useEffect(() => {
    if (open) {
      setWidth(currentWidth.toString());
      setHeight(currentHeight.toString());
      setLockedRatio(currentWidth / currentHeight);
    }
  }, [open, currentWidth, currentHeight]);

  const handleWidthChange = (val: string) => {
    setWidth(val);
    const numWidth = parseInt(val, 10);
    if (isLocked && !isNaN(numWidth) && numWidth > 0) {
      setHeight(Math.round(numWidth / lockedRatio).toString());
    }
  };

  const handleHeightChange = (val: string) => {
    setHeight(val);
    const numHeight = parseInt(val, 10);
    if (isLocked && !isNaN(numHeight) && numHeight > 0) {
      setWidth(Math.round(numHeight * lockedRatio).toString());
    }
  };

  const handlePresetSelect = (presetKey: string) => {
    if (presetKey === 'Custom') return;
    const preset = PRESET_RATIOS[presetKey];
    if (preset) {
      // Assuming a base of 1080 for presets to give realistic pixel values
      const baseHeight = 1080;
      const baseWidth = Math.round(baseHeight * (preset.width / preset.height));
      setWidth(baseWidth.toString());
      setHeight(baseHeight.toString());
      if (isLocked) {
        setLockedRatio(preset.width / preset.height);
      }
    }
  };

  const toggleLock = (checked: boolean) => {
    setIsLocked(checked);
    const w = parseInt(width, 10);
    const h = parseInt(height, 10);
    if (checked && !isNaN(w) && !isNaN(h) && h > 0) {
      setLockedRatio(w / h);
    }
  };

  const numW = parseInt(width, 10);
  const numH = parseInt(height, 10);
  const isValid = !isNaN(numW) && !isNaN(numH) && numW > 0 && numW <= 10000 && numH > 0 && numH <= 10000;

  const handleApply = () => {
    if (isValid) {
      onApply(numW, numH, 'Custom');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0B1020]/95 backdrop-blur-3xl border-white/10 text-slate-200 shadow-2xl rounded-2xl w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-white tracking-wide">Custom Aspect Ratio</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Width</label>
              <input 
                type="number"
                value={width}
                onChange={(e) => handleWidthChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500 transition-colors"
              />
            </div>
            
            <div className="mt-6 text-slate-500">×</div>
            
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Height</label>
              <input 
                type="number"
                value={height}
                onChange={(e) => handleHeightChange(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>

          {!isValid && (
            <p className="text-red-400 text-xs font-medium">Width and Height must be between 1 and 10000 pixels.</p>
          )}

          <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
            <label className="text-sm font-semibold text-slate-300">Lock Aspect Ratio</label>
            <Switch checked={isLocked} onCheckedChange={toggleLock} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preset Ratio</label>
            <select 
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500 transition-colors appearance-none"
              onChange={(e) => handlePresetSelect(e.target.value)}
              defaultValue="Custom"
            >
              {Object.keys(PRESET_RATIOS).map((key) => (
                <option key={key} value={key} className="bg-[#0B1020] text-white">
                  {key} ({PRESET_RATIOS[key].name})
                </option>
              ))}
              <option value="Custom" className="bg-[#0B1020] text-white">Custom</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-white hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button 
            disabled={!isValid}
            onClick={handleApply}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:opacity-90 text-white font-bold px-6 shadow-lg shadow-purple-500/20"
          >
            Apply Ratio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
