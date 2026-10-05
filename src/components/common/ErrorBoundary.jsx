import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SILOKA Application Error Boundary Caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 antialiased">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shadow-xs">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Terjadi Kendala Memuat Antarmuka
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sistem SILOKA mendeteksi pembaruan pada modul persuratan. Silakan muat ulang halaman ini untuk memperbarui tampilan kerja Anda.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-unsil-green-800 hover:bg-unsil-green-900 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-unsil-gold-300" />
                <span>Muat Ulang Halaman</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Ke Beranda</span>
              </button>
            </div>

            {this.state.error && (
              <div className="pt-2 border-t border-slate-100 text-left">
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="text-[11px] text-slate-500 hover:text-slate-700 font-semibold underline cursor-pointer"
                >
                  {this.state.showDetails ? 'Sembunyikan Rincian Teknis' : 'Lihat Rincian Teknis'}
                </button>
                {this.state.showDetails && (
                  <pre className="mt-2 p-2.5 bg-slate-900 text-amber-300 text-[10px] font-mono rounded-lg overflow-x-auto max-h-36 whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </pre>
                )}
              </div>
            )}

            <p className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100">
              Biro Keuangan dan Umum • Universitas Siliwangi
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
