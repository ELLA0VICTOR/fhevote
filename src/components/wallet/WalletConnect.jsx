import React from 'react';
import { useWalletContext } from '../../context/WalletContext';
import { Button } from '../retroui/Button';
import { Wallet, AlertCircle } from 'lucide-react';
import { Badge } from '../retroui/Badge';

export const WalletConnect = () => {
  const { 
    account, 
    isConnecting, 
    isConnected, 
    isCorrectNetwork,
    connectWallet, 
    disconnectWallet,
    switchToSepolia 
  } = useWalletContext();

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        {!isCorrectNetwork && (
          <Button
            variant="destructive"
            size="sm"
            onClick={switchToSepolia}
            className="flex items-center gap-2"
          >
            <AlertCircle size={16} />
            Switch to Sepolia
          </Button>
        )}
        <Badge variant="outline" className="font-mono">
          {account.slice(0, 6)}...{account.slice(-4)}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={disconnectWallet}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={connectWallet}
      disabled={isConnecting}
      className="flex items-center gap-2"
    >
      <Wallet size={20} />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
};