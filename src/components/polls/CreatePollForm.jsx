import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../../context/WalletContext';
import { useContract } from '../../hooks/useContract';
import { Card, CardHeader, CardTitle, CardContent } from '../retroui/Card';
import { Input } from '../retroui/Input';
import { Label } from '../retroui/Label';
import { Select } from '../retroui/Select';
import { Button } from '../retroui/Button';
import { toast } from '../retroui/Sonner';
import { Plus, Trash2, Clock } from 'lucide-react';

export const CreatePollForm = () => {
  const navigate = useNavigate();
  const { signer, isConnected } = useWalletContext();
  const { createPoll } = useContract(signer);
  
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [durationType, setDurationType] = useState('preset');
  const [presetDuration, setPresetDuration] = useState('60');
  const [customValue, setCustomValue] = useState('30');
  const [customUnit, setCustomUnit] = useState('minutes');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  /**
   * ✅ FIXED: Calculate total duration in minutes with explicit number conversion
   */
  const calculateDurationMinutes = () => {
    if (durationType === 'preset') {
      // Ensure we return a clean integer
      return parseInt(presetDuration, 10);
    } else {
      const value = parseInt(customValue, 10);
      if (customUnit === 'hours') {
        return value * 60;
      }
      return value;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      toast.error('Please add at least 2 options');
      return;
    }

    const durationMinutes = calculateDurationMinutes();
    
    if (durationMinutes < 1) {
      toast.error('Duration must be at least 1 minute');
      return;
    }

    if (isNaN(durationMinutes)) {
      toast.error('Invalid duration value');
      return;
    }

    if (durationType === 'custom' && !customValue) {
      toast.error('Please enter a custom duration value');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Creating poll...');

    try {
      // ✅ CRITICAL FIX: Explicit logging to diagnose duration issues
      console.log('📝 Creating poll with explicit duration:', {
        durationMinutes,
        durationType,
        presetDuration,
        customValue,
        customUnit,
        calculatedMinutes: durationMinutes,
        willExpireAt: `${Math.floor(Date.now() / 1000)} + ${durationMinutes * 60} seconds`
      });
      
      // Ensure we're passing a clean integer to the contract
      const cleanDuration = Math.floor(durationMinutes);
      
      console.log('  → Sending to contract:', cleanDuration, 'minutes');
      
      const { pollId } = await createPoll(question, validOptions, cleanDuration);
      
      console.log('  ✅ Poll created successfully with ID:', pollId);
      
      toast.success('Poll created successfully!', { id: toastId });
      navigate(`/poll/${pollId}`);
    } catch (error) {
      console.error('❌ Failed to create poll:', error);
      toast.error('Failed to create poll: ' + error.message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Poll</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question Input */}
          <div>
            <Label htmlFor="question">Poll Question</Label>
            <Input
              id="question"
              placeholder="What's your favorite programming language?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Options */}
          <div className="space-y-4">
            <Label>Options</Label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  disabled={isSubmitting}
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeOption(index)}
                    disabled={isSubmitting}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            ))}
            {options.length < 5 && (
              <Button
                type="button"
                variant="outline"
                onClick={addOption}
                disabled={isSubmitting}
                className="w-full flex items-center gap-2 justify-center"
              >
                <Plus size={16} />
                Add Option
              </Button>
            )}
          </div>

          {/* Duration Selector */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Clock size={16} />
              Poll Duration
            </Label>
            
            {/* Duration Type Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={durationType === 'preset' ? 'default' : 'outline'}
                onClick={() => setDurationType('preset')}
                disabled={isSubmitting}
                className="flex-1"
              >
                Preset Duration
              </Button>
              <Button
                type="button"
                variant={durationType === 'custom' ? 'default' : 'outline'}
                onClick={() => setDurationType('custom')}
                disabled={isSubmitting}
                className="flex-1"
              >
                Custom Duration
              </Button>
            </div>

            {/* Preset Duration Selector */}
            {durationType === 'preset' && (
              <Select
                id="preset-duration"
                value={presetDuration}
                onChange={(e) => setPresetDuration(e.target.value)}
                disabled={isSubmitting}
              >
                <option value="1">1 minute (Demo)</option>
                <option value="5">5 minutes (Quick Test)</option>
                <option value="60">1 hour</option>
                <option value="360">6 hours</option>
                <option value="1440">24 hours (1 day)</option>
                <option value="10080">7 days (1 week)</option>
              </Select>
            )}

            {/* Custom Duration Input */}
            {durationType === 'custom' && (
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter duration"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  disabled={isSubmitting}
                  className="flex-1"
                />
                <Select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  disabled={isSubmitting}
                  className="w-32"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                </Select>
              </div>
            )}

            {/* Duration Preview */}
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <strong>Duration:</strong> {calculateDurationMinutes()} minutes
              {calculateDurationMinutes() >= 60 && (
                <span> ({(calculateDurationMinutes() / 60).toFixed(1)} hours)</span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !isConnected}
          >
            {isSubmitting ? 'Creating...' : 'Create Poll'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};