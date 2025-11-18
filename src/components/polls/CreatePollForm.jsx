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
import { Plus, Trash2 } from 'lucide-react';

export const CreatePollForm = () => {
  const navigate = useNavigate();
  const { signer, isConnected } = useWalletContext();
  const { createPoll } = useContract(signer);
  
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState('24');
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

    setIsSubmitting(true);
    const toastId = toast.loading('Creating poll...');

    try {
      const { pollId } = await createPoll(question, validOptions, Number(duration));
      toast.success('Poll created successfully!', { id: toastId });
      navigate(`/poll/${pollId}`);
    } catch (error) {
      console.error('Failed to create poll:', error);
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

          <div>
            <Label htmlFor="duration">Poll Duration</Label>
            <Select
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="1">1 hour</option>
              <option value="6">6 hours</option>
              <option value="24">24 hours</option>
              <option value="168">7 days</option>
            </Select>
          </div>

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