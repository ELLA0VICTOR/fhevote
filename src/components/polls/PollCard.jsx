import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../retroui/Card';
import { Button } from '../retroui/Button';
import { Badge } from '../retroui/Badge';
import { Clock, Users } from 'lucide-react';

/**
 * ✅ MOBILE RESPONSIVE - Poll Card optimized for mobile devices
 */
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

  const now = Date.now() / 1000;
  const isPollExpired = now >= poll.endTime;
  const isActuallyActive = poll.isActive && !isPollExpired;

  const totalVotes = poll.finalResults 
    ? poll.finalResults.reduce((sum, v) => sum + v, 0)
    : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow flex flex-col h-full">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex justify-between items-start gap-3 mb-2">
          <CardTitle className="text-base sm:text-lg md:text-xl flex-1 break-words leading-tight">
            {poll.question}
          </CardTitle>
          <Badge 
            variant={isActuallyActive ? 'default' : 'secondary'}
            className="flex-shrink-0 text-xs"
          >
            {isActuallyActive ? 'Active' : 'Ended'}
          </Badge>
        </div>
        <CardDescription className="text-xs sm:text-sm truncate">
          by {poll.creator.slice(0, 6)}...{poll.creator.slice(-4)}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
            <span>{poll.options.length} options</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
            <span>{timeRemaining()}</span>
          </div>
          {totalVotes > 0 && (
            <div className="flex items-center gap-1">
              <span>{totalVotes} votes</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 sm:p-6 pt-0 mt-auto">
        <Button
          onClick={() => navigate(`/poll/${poll.id}`)}
          className="w-full text-sm sm:text-base"
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