import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../retroui/Card';
import { Button } from '../retroui/Button';
import { Badge } from '../retroui/Badge';
import { Clock, Users } from 'lucide-react';

export const PollCard = ({ poll }) => {
  const navigate = useNavigate();
  
  const timeRemaining = () => {
    const now = Date.now() / 1000;
    const end = poll.endTime;
    const diff = end - now;

    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  // Check both isActive flag AND time-based expiry
  const now = Date.now() / 1000;
  const isPollExpired = now >= poll.endTime;
  const isActuallyActive = poll.isActive && !isPollExpired;

  const totalVotes = poll.finalResults 
    ? poll.finalResults.reduce((sum, v) => sum + v, 0)
    : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-xl">{poll.question}</CardTitle>
          <Badge variant={isActuallyActive ? 'default' : 'secondary'}>
            {isActuallyActive ? 'Active' : 'Ended'}
          </Badge>
        </div>
        <CardDescription>
          by {poll.creator.slice(0, 6)}...{poll.creator.slice(-4)}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users size={16} />
            <span>{poll.options.length} options</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={16} />
            <span>{timeRemaining()}</span>
          </div>
          {totalVotes > 0 && (
            <div className="flex items-center gap-1">
              <span>{totalVotes} votes</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button
          onClick={() => navigate(`/poll/${poll.id}`)}
          className="w-full"
        >
          {poll.finalResults && poll.finalResults.length > 0 
            ? 'View Results' 
            : isActuallyActive 
              ? 'Vote Now' 
              : 'View Poll'}
        </Button>
      </CardFooter>
    </Card>
  );
};