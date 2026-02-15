import { Component } from 'react'

export class ProfileErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-8 text-center">
          <p className="font-medium text-red-600">Something went wrong on this page.</p>
          <p className="mt-2 text-sm text-red-700">{this.state.error?.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}
