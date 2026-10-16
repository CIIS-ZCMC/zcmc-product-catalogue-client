import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RefreshCw,
  History,
  PlusCircle,
  Pencil,
  Trash2,
  UploadCloud,
  FileText,
  Eye,
  User,
  ShieldCheck,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from './ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { api } from '../services/api';

const ACTION_CONFIG = {
  CREATED: { label: 'Created', variant: 'success', icon: PlusCircle },
  UPDATED: { label: 'Updated', variant: 'blue', icon: Pencil },
  DELETED: { label: 'Deleted', variant: 'destructive', icon: Trash2 },
  IMPORTED: { label: 'Imported', variant: 'secondary', icon: UploadCloud },
  PDF_UPLOADED: { label: 'PDF Upload', variant: 'info', icon: FileText },
};

export default function ActivityLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);

  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        per_page: rowsPerPage,
      };
      if (search.trim()) {
        params.search = search.trim();
      }
      if (selectedAction !== 'ALL') {
        params.action = selectedAction;
      }
      const res = await api.getActivityLogs(params);
      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, selectedAction]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const currentPage = page + 1;
  const startRow = total === 0 ? 0 : page * rowsPerPage + 1;
  const endRow = Math.min(total, (page + 1) * rowsPerPage);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-300">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">
              System Audit Trail &amp; Activity Logs
            </h1>
            <p className="text-xs text-slate-300">
              Immutable audit logs tracking product creations, modifications, deletions, and document uploads.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge className="bg-white/10 text-slate-100 border-white/20 font-mono text-xs py-1 px-2.5">
            Total Events: {total}
          </Badge>
          <Button
            size="sm"
            onClick={() => fetchLogs()}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search logs by user, description, or item code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-9"
            />
          </div>

          <div className="w-full sm:w-52">
            <Select
              value={selectedAction}
              onValueChange={(val) => {
                setSelectedAction(val);
                setPage(0);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                <SelectItem value="CREATED">Created</SelectItem>
                <SelectItem value="UPDATED">Updated</SelectItem>
                <SelectItem value="DELETED">Deleted</SelectItem>
                <SelectItem value="IMPORTED">Imported</SelectItem>
                <SelectItem value="PDF_UPLOADED">PDF Uploaded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="overflow-hidden">
        <Table className="min-w-[860px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[16%]">Timestamp</TableHead>
              <TableHead className="w-[12%]">Action</TableHead>
              <TableHead className="w-[22%]">User / Actor</TableHead>
              <TableHead className="w-[17%]">Target Item</TableHead>
              <TableHead className="w-[25%]">Description</TableHead>
              <TableHead className="w-[8%] text-center">Changes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span>Loading audit logs...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <p className="text-sm font-semibold text-slate-600">No activity logs found.</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Try clearing search filters or perform catalogue actions to generate logs.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const actionCfg = ACTION_CONFIG[log.action] || {
                  label: log.action,
                  variant: 'secondary',
                  icon: History,
                };
                const ActionIcon = actionCfg.icon;
                const hasDiff = Boolean(log.old_values || log.new_values);

                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-medium text-slate-600 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionCfg.variant} className="text-[11px]">
                        <ActionIcon className="h-3 w-3" />
                        {actionCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                          {log.user?.is_admin ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                          ) : (
                            <User className="h-3.5 w-3.5 text-slate-400" />
                          )}
                          <span>{log.user_name || 'System'}</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {log.user_email || '—'} {log.ip_address ? `• ${log.ip_address}` : ''}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-bold text-blue-600 block">
                        {log.entity_identifier || `#${log.entity_id || '—'}`}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      {log.description}
                    </TableCell>
                    <TableCell className="text-center">
                      {hasDiff ? (
                        <Button
                          variant="blueOutline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setSelectedLog(log)}
                          title="Inspect attribute diff"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <Select
              value={String(rowsPerPage)}
              onValueChange={(val) => {
                setRowsPerPage(parseInt(val, 10));
                setPage(0);
              }}
            >
              <SelectTrigger className="h-8 w-[72px] text-xs bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 15, 25, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-slate-400 ml-2">
              Showing <strong className="text-slate-800">{startRow}</strong>–
              <strong className="text-slate-800">{endRow}</strong> of{' '}
              <strong className="text-slate-800">{total}</strong> events
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="mr-2 font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page <= 0}
              onClick={() => setPage(0)}
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page <= 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(totalPages - 1)}
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Change Inspection Diff Dialog */}
      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        {selectedLog && (
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <ArrowLeftRight className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle>Audit Change Details • Log #{selectedLog.id}</DialogTitle>
                  <DialogDescription>
                    Executed by <strong>{selectedLog.user_name}</strong> ({selectedLog.user_email}) on{' '}
                    {formatDate(selectedLog.created_at)}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <p className="text-xs font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              {selectedLog.description}
            </p>

            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[26%]">Attribute</TableHead>
                    <TableHead className="w-[37%] text-red-600">Before (Old Value)</TableHead>
                    <TableHead className="w-[37%] text-emerald-700">After (New Value)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const oldVal = selectedLog.old_values || {};
                    const newVal = selectedLog.new_values || {};
                    const keys = Array.from(
                      new Set([...Object.keys(oldVal), ...Object.keys(newVal)])
                    );

                    if (keys.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-6 text-xs text-slate-400">
                            No structured attribute diff available for this event.
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return keys.map((key) => {
                      const vOld =
                        oldVal[key] !== undefined && oldVal[key] !== null
                          ? String(oldVal[key])
                          : '—';
                      const vNew =
                        newVal[key] !== undefined && newVal[key] !== null
                          ? String(newVal[key])
                          : '—';

                      return (
                        <TableRow key={key}>
                          <TableCell className="text-xs font-semibold text-slate-700 capitalize">
                            {key.replace(/_/g, ' ')}
                          </TableCell>
                          <TableCell className="text-xs bg-red-50/70 text-red-900 break-words font-mono">
                            {vOld}
                          </TableCell>
                          <TableCell className="text-xs bg-emerald-50/70 text-emerald-900 font-semibold break-words font-mono">
                            {vNew}
                          </TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
