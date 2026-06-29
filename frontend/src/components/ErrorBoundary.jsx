import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[40vh] flex flex-col items-center justify-center px-6 text-center">
          <h1 className="text-xl font-semibold text-ink mb-2">Something went wrong</h1>
          <p className="text-muted mb-6 max-w-md">
            Please refresh the page. If the problem continues, contact us directly.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-lg bg-brand text-white font-medium hover:bg-brand-dark transition-colors"
          >
            Refresh page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
