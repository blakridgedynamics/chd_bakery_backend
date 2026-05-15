import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // The fallback UI avoids exposing internal error details to customers.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
          <div className="max-w-md rounded-lg border border-border bg-card p-8 shadow-card">
            <h1 className="font-display text-3xl">Something went wrong.</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Please return home and try again.
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="mt-6 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Go home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
