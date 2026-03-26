import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallbackMessage?: string;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    public handleReset = () => {
        this.setState({ hasError: false, error: null });
        if (this.props.onReset) {
            this.props.onReset();
        } else {
            // Default reload if no reset handler provided
            window.location.reload();
        }
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="w-full h-full min-h-[50vh] flex flex-col items-center justify-center p-8 bg-cyber-dark/80 text-white rounded-xl border border-red-500/30">
                    <div className="bg-red-900/40 p-6 rounded-full mb-6 border border-red-500/50 relative">
                        <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping"></div>
                        <AlertTriangle size={64} className="text-red-400 relative z-10" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400">
                        {this.props.fallbackMessage || "System Error Encountered"}
                    </h2>
                    <p className="text-gray-400 mb-8 max-w-md text-center font-mono text-sm leading-relaxed">
                        {this.state.error?.message || "An unexpected error occurred while rendering this interface. Remote state has not been lost."}
                    </p>
                    <button
                        onClick={this.handleReset}
                        className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center gap-2"
                    >
                        <RefreshCw size={18} />
                        Attempt Recovery
                    </button>
                    <div className="mt-8 text-xs text-gray-600 font-mono uppercase tracking-widest">
                        ERROR CODE: 0xDEADBEEF
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
