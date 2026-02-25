/**
 * @file src/components/ErrorBoundary.tsx
 * @description React class component that catches rendering errors in its subtree.
 *
 * Renders a user-friendly "Something went wrong" fallback UI instead of a blank
 * screen when an unhandled JavaScript error propagates during render.
 * In development mode, the raw error message is displayed for debugging.
 */
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center mb-6 text-destructive animate-bounce">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">Something went wrong</h1>
                    <p className="text-muted-foreground mb-8 max-w-md">
                        We hit a snag loading this part of the app. It's safe to refresh or head back home.
                    </p>
                    
                    <div className="flex gap-4">
                        <Button
                            variant="primary"
                            className="rounded-2xl gap-2 font-bold"
                            onClick={this.handleReset}
                        >
                            <RefreshCw className="w-4 h-4" />
                            Return Home
                        </Button>
                    </div>
                    {this.state.error && import.meta.env.MODE === 'development' && (
                        <div className="mt-8 p-4 bg-black/20 rounded-xl text-left overflow-auto max-w-full">
                            <pre className="text-xs text-red-400 font-mono">
                                {this.state.error.toString()}
                            </pre>
                        </div>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
