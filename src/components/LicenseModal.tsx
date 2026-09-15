import React, { useState } from 'react';
import { Key, CheckCircle2, AlertCircle, Loader2, ShieldCheck, X, ExternalLink } from 'lucide-react';
import {
  LicenseInfo,
  verifyGumroadLicense,
  clearStoredLicense,
} from '../engine/licenseEngine';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenseInfo: LicenseInfo | null;
  onLicenseChange: (info: LicenseInfo | null) => void;
  isMandatory?: boolean;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  onClose,
  licenseInfo,
  onLicenseChange,
  isMandatory = false,
}) => {
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKeyInput.trim()) {
      setErrorMessage('Please enter your license key.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await verifyGumroadLicense(licenseKeyInput);

    setIsVerifying(false);

    if (result.success && result.licenseInfo) {
      onLicenseChange(result.licenseInfo);
      setSuccessMessage('License successfully verified and activated!');
      setLicenseKeyInput('');
      setTimeout(() => {
        setSuccessMessage(null);
        if (!isMandatory) {
          onClose();
        }
      }, 1200);
    } else {
      setErrorMessage(result.message || 'Invalid license key. Please verify and try again.');
    }
  };

  const handleDeactivate = () => {
    clearStoredLicense();
    onLicenseChange(null);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const canDismiss = !isMandatory || licenseInfo !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-md bg-studio-panel border border-studio-border rounded-md shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-studio-border bg-studio-bg/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-sm bg-studio-accent/10 border border-studio-accent/20">
              <Key className="w-4 h-4 text-studio-accent" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-studio-text tracking-wide">
                {licenseInfo ? 'License Management' : 'Software Activation'}
              </h3>
              <p className="text-[11px] text-studio-muted">
                {licenseInfo ? 'Halftone Studio Pro Active' : 'Enter your Gumroad license key to continue'}
              </p>
            </div>
          </div>
          {canDismiss && (
            <button
              onClick={onClose}
              className="p-1.5 text-studio-muted hover:text-studio-text hover:bg-studio-hover rounded-sm transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {licenseInfo ? (
            /* Active License Status Card */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-sm space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Licensed & Activated</span>
                </div>
                <div className="text-xs text-studio-muted space-y-1 pt-1">
                  <div className="flex justify-between">
                    <span>Registered to:</span>
                    <span className="font-mono text-studio-text">{licenseInfo.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>License Key:</span>
                    <span className="font-mono text-studio-text">
                      ••••••••-{licenseInfo.key.slice(-8) || 'ACTIVATED'}
                    </span>
                  </div>
                  {licenseInfo.uses !== undefined && (
                    <div className="flex justify-between">
                      <span>Seat Usage:</span>
                      <span className="font-mono text-studio-text">{licenseInfo.uses} active seat(s)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleDeactivate}
                  className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 rounded-sm transition-colors"
                >
                  Deactivate Device
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-studio-accent hover:bg-studio-accent/90 rounded-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Unactivated Key Input Form */
            <form onSubmit={handleActivate} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="license-key" className="text-xs font-medium text-studio-text flex items-center justify-between">
                  <span>Gumroad License Key</span>
                  <a
                    href="https://gumroad.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-studio-accent hover:underline flex items-center gap-1"
                  >
                    <span>Find Key</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                <input
                  id="license-key"
                  type="text"
                  value={licenseKeyInput}
                  onChange={(e) => setLicenseKeyInput(e.target.value)}
                  placeholder="e.g. 6F0E4C97-B72A4E69-A11BF6C4-AF6517E7"
                  className="w-full px-3 py-2 text-xs font-mono bg-studio-bg border border-studio-border focus:border-studio-accent rounded-sm text-studio-text placeholder:text-studio-muted/40 outline-none transition-colors"
                  autoFocus
                  disabled={isVerifying}
                />
                <p className="text-[11px] text-studio-muted">
                  The license key sent to your email receipt after purchase.
                </p>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-sm flex items-start gap-2 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-sm flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isVerifying || !licenseKeyInput.trim()}
                  className="w-full py-2 px-4 bg-studio-accent hover:bg-studio-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-sm transition-colors flex items-center justify-center gap-2 shadow"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying with Gumroad...</span>
                    </>
                  ) : (
                    <span>Activate License</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
