import React from 'react';
import { Alert } from '../Alert';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Alert variant="destructive" className="max-w-lg">
            <h2 className="font-head text-xl mb-2">Something went wrong</h2>
            <p className="text-sm">{this.state.error?.message || 'An unexpected error occurred'}</p>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}