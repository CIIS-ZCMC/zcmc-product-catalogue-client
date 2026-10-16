import React, { useState } from 'react';
import {
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { api } from '../services/api';

export default function ImportExportModal({ open, onClose, onImportSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select a CSV file first.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    try {
      const res = await api.importProducts(selectedFile);
      setResult(res);
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Import failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      if (api.downloadExportCsv) {
        await api.downloadExportCsv();
      } else {
        window.location.href = api.getExportUrl();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to download template');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleReset()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>Import / Export Product Catalogue</DialogTitle>
              <DialogDescription>
                Batch import standardized items or download the ZCMC CSV template
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errorMsg && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <div>
              <AlertTitle>{result.message}</AlertTitle>
              <AlertDescription>
                Added: {result.imported} new items • Updated: {result.updated} existing items
              </AlertDescription>
            </div>
          </Alert>
        )}

        <div className="space-y-4 py-1">
          {/* Download Template Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                ZCMC Catalogue CSV Template
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Includes PhilGEPS, UNSPSC, and uniform naming columns
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
              <Download className="h-3.5 w-3.5" />
              <span>Download CSV</span>
            </Button>
          </div>

          {/* Upload Dropzone */}
          <label className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/40 p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-colors">
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-2 group-hover:scale-105 transition-transform">
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {selectedFile ? selectedFile.name : 'Click to select CSV catalogue file'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Accepts .csv files up to 10MB
            </p>
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleReset}>
            Close
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="h-4 w-4" />
            )}
            <span>{uploading ? 'Processing Import...' : 'Import to Catalogue'}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
