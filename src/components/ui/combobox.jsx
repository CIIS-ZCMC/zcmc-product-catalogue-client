import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, Search, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '../../lib/utils';

/**
 * Searchable Combobox built on shadcn/ui Popover primitives.
 * Supports both local filtering and async debounced search (`onSearchChange`).
 */
export function Combobox({
  options = [],
  value = null,
  onChange,
  onSearchChange,
  getOptionLabel = (opt) => opt?.label || String(opt || ''),
  getOptionKey = (opt, idx) => opt?.id ?? opt?.key ?? opt?.code ?? idx,
  isOptionEqual = (a, b) => a === b,
  renderOption,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Type to search...',
  emptyText = 'No matching options found.',
  loading = false,
  icon: Icon = null,
  clearable = true,
  className,
  disabled = false,
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const filteredOptions = React.useMemo(() => {
    if (onSearchChange) return options;
    if (!query.trim()) return options;
    const q = query.toLowerCase();
    return options.filter((opt) => getOptionLabel(opt).toLowerCase().includes(q));
  }, [options, query, onSearchChange, getOptionLabel]);

  const selectedLabel = value ? getOptionLabel(value) : '';

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setQuery('');
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-left shadow-2xs transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
            className
          )}
        >
          <span className="flex items-center gap-2 min-w-0 flex-1">
            {Icon && <Icon className="h-4 w-4 text-blue-600 shrink-0" />}
            <span
              className={cn(
                'truncate',
                selectedLabel ? 'text-slate-900 font-medium' : 'text-slate-400'
              )}
            >
              {selectedLabel || placeholder}
            </span>
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />}
            {clearable && value && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                title="Clear selection"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronsUpDown className="h-4 w-4 text-slate-400" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0 overflow-hidden"
      >
        <div className="flex items-center border-b border-slate-100 px-3 py-2 bg-slate-50/60">
          <Search className="mr-2 h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder={searchPlaceholder}
            className="flex w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            autoFocus
          />
          {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin text-blue-600 shrink-0" />}
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              {loading ? 'Searching...' : emptyText}
            </div>
          ) : (
            filteredOptions.map((option, idx) => {
              const selected = value ? isOptionEqual(option, value) : false;
              return (
                <button
                  key={getOptionKey(option, idx)}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-start justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm outline-none transition-colors hover:bg-blue-50/70',
                    selected && 'bg-blue-50/90 text-blue-700'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    {renderOption ? renderOption(option, selected) : (
                      <span className="font-medium text-slate-900">{getOptionLabel(option)}</span>
                    )}
                  </div>
                  {selected && <Check className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
