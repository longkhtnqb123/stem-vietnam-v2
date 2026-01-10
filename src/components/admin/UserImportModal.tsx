import React, { useState, useRef } from 'react';
import { X, Upload, FileJson, FileSpreadsheet, Check, AlertCircle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface UserImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const API_URL = (import.meta.env.VITE_API_URL || 'https://stem-vietnam-api.stu725114073.workers.dev').replace(/\/$/, '');

export default function UserImportModal({ isOpen, onClose, onSuccess }: UserImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);
        setResult(null);

        try {
            if (selectedFile.name.endsWith('.json')) {
                const text = await selectedFile.text();
                const data = JSON.parse(text);
                if (Array.isArray(data)) {
                    setPreviewData(data);
                } else {
                    setError('Invalid JSON format. Expected an array of users.');
                }
            } else if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
                const buffer = await selectedFile.arrayBuffer();
                const workbook = XLSX.read(buffer);
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(sheet);
                setPreviewData(data);
            } else {
                setError('Unsupported file format. Please upload .json, .xlsx, or .xls');
            }
        } catch (err: any) {
            setError('Error parsing file: ' + err.message);
        }
    };

    const handleUpload = async () => {
        if (previewData.length === 0) return;

        setLoading(true);
        setError(null);

        // Normalize data keys (lowercase)
        const normalizedData = previewData.map(item => {
            const newItem: any = {};
            Object.keys(item).forEach(key => {
                newItem[key.toLowerCase()] = item[key];
            });
            return {
                name: newItem.name || newItem['tên'] || newItem['fullname'],
                email: newItem.email || newItem['thư điện tử'],
                role: newItem.role || newItem['vai trò'] || 'student',
                password: newItem.password || newItem['mật khẩu'] // Optional
            };
        });

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/users/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(normalizedData)
            });

            if (res.ok) {
                const data = await res.json();
                setResult(data.results);
                if (data.results.success > 0) {
                    onSuccess(); // Refresh parent list
                }
            } else {
                const data = await res.json();
                setError(data.error || 'Bulk import failed');
            }
        } catch (err: any) {
            setError(err.message || 'Connection error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Import Users (Bulk)</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {!result ? (
                    <div className="space-y-6">
                        {/* Drop Zone */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/50 transition-all text-center"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".json,.xlsx,.xls"
                                className="hidden"
                            />
                            {file ? (
                                <div className="text-emerald-600 flex flex-col items-center gap-2">
                                    {file.name.endsWith('.json') ? <FileJson size={40} /> : <FileSpreadsheet size={40} />}
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            ) : (
                                <div className="text-slate-400 flex flex-col items-center gap-2">
                                    <Upload size={40} />
                                    <p className="font-medium text-slate-600">Click to upload JSON or Excel</p>
                                    <p className="text-xs">Supported: .json, .xlsx, .xls</p>
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                {error}
                            </div>
                        )}

                        {previewData.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-700">Preview ({previewData.length} records)</p>
                                <div className="max-h-40 overflow-auto border border-slate-200 rounded-lg">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 border-b">Name</th>
                                                <th className="px-3 py-2 border-b">Email</th>
                                                <th className="px-3 py-2 border-b">Role</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.slice(0, 5).map((row, i) => (
                                                <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                                                    <td className="px-3 py-2">{row.name || row['Name']}</td>
                                                    <td className="px-3 py-2">{row.email || row['Email']}</td>
                                                    <td className="px-3 py-2">{row.role || row['Role'] || 'student'}</td>
                                                </tr>
                                            ))}
                                            {previewData.length > 5 && (
                                                <tr>
                                                    <td colSpan={3} className="px-3 py-2 text-center text-slate-400 italic">
                                                        ... and {previewData.length - 5} more
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 justify-end">
                            <button onClick={onClose} className="px-4 py-2 hover:bg-slate-100 rounded-lg font-medium text-slate-600 transition-colors text-sm">Cancel</button>
                            <button
                                onClick={handleUpload}
                                disabled={loading || !file}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg font-medium shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all text-sm flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                Import {previewData.length > 0 ? `(${previewData.length})` : ''} Users
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 space-y-4">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                            <Check size={32} className="text-emerald-600" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-slate-800">Import Complete!</h4>
                            <p className="text-slate-500">Successfully imported <span className="text-emerald-600 font-bold">{result.success}</span> users.</p>
                            {result.failed > 0 && <p className="text-red-500 text-sm mt-1">Failed: {result.failed}</p>}
                        </div>

                        {result.errors.length > 0 && (
                            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-left max-h-40 overflow-auto text-xs text-red-700 font-mono">
                                {result.errors.map((e, i) => <p key={i}>• {e}</p>)}
                            </div>
                        )}

                        <button onClick={onClose} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-slate-700 transition-colors">
                            Close & Refresh
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
