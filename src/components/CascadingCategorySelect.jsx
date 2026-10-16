import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, X, Info, Layers } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Combobox } from './ui/combobox';
import { api } from '../services/api';

/**
 * Commodity-first Category Selector built with shadcn/ui.
 * 1. User selects the Commodity (Level 3).
 * 2. All parent relations (Segment, Family, Class, Breadcrumbs) auto-appear right away.
 */
export default function CascadingCategorySelect({ selectedKey, onSelectCategory }) {
  const [commodityOptions, setCommodityOptions] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);

  // Load initial default commodities on mount
  useEffect(() => {
    let active = true;
    const loadInitialCommodities = async () => {
      try {
        setLoading(true);
        const data = await api.getCommodities('');
        if (active) {
          setCommodityOptions(data || []);
        }
      } catch (err) {
        console.error('Failed to load initial commodities', err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInitialCommodities();
    return () => {
      active = false;
    };
  }, []);

  // Resolve full commodity details if selectedKey is provided
  useEffect(() => {
    if (!selectedKey) {
      setSelectedCommodity(null);
      return;
    }

    if (selectedCommodity && selectedCommodity.key === Number(selectedKey)) {
      return;
    }

    let active = true;
    const fetchCategoryDetails = async () => {
      try {
        setLoading(true);
        const cat = await api.getCategory(selectedKey);
        if (active && cat) {
          const ancestors = cat.ancestors || [];
          const segment = ancestors[0] || null;
          const family = ancestors[1] || null;
          const classItem = ancestors[2] || null;

          const commodityObj = {
            key: cat.key,
            code: cat.code,
            title: cat.title,
            level: cat.level,
            definition: cat.definition,
            full_path: cat.full_path,
            relations: {
              segment: segment ? segment.title : null,
              segment_code: segment ? segment.code : null,
              family: family ? family.title : null,
              family_code: family ? family.code : null,
              class: classItem ? classItem.title : null,
              class_code: classItem ? classItem.code : null,
              commodity: cat.title,
              commodity_code: cat.code,
            },
            hierarchy: [
              ...ancestors,
              { key: cat.key, code: cat.code, title: cat.title, level: cat.level },
            ],
          };

          setSelectedCommodity(commodityObj);
          setCommodityOptions((prev) => {
            const exists = prev.some((o) => o.key === cat.key);
            return exists ? prev : [commodityObj, ...prev];
          });
        }
      } catch (err) {
        console.error('Failed to fetch category details for key', selectedKey, err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCategoryDetails();
    return () => {
      active = false;
    };
  }, [selectedKey]);

  const handleSearchChange = (newInputValue) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!newInputValue || newInputValue.trim().length < 2) {
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await api.getCommodities(newInputValue.trim());
        setCommodityOptions(results || []);
      } catch (err) {
        console.error('Failed to search commodities', err);
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  const handleSelect = (item) => {
    if (item) {
      setSelectedCommodity(item);
      onSelectCategory({
        key: item.key,
        code: item.code,
        title: item.title,
        level: item.level,
      });
    } else {
      setSelectedCommodity(null);
      onSelectCategory(null);
    }
  };

  const handleClear = () => {
    setSelectedCommodity(null);
    onSelectCategory(null);
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <Layers className="h-4 w-4 text-blue-600" />
          <span>Select UNSPSC Commodity *</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Select the specific commodity item. Its parent Segment, Family, and Class relations resolve automatically.
        </p>
      </div>

      <Combobox
        options={commodityOptions}
        value={selectedCommodity}
        onChange={handleSelect}
        onSearchChange={handleSearchChange}
        loading={loading}
        getOptionLabel={(opt) => (opt.code ? `${opt.title} [${opt.code}]` : opt.title || '')}
        getOptionKey={(opt) => opt.key}
        isOptionEqual={(a, b) => Number(a?.key) === Number(b?.key)}
        placeholder="Type commodity name or code (e.g. Paracetamol, Nitrile gloves, Copier paper, 14111507)..."
        searchPlaceholder="Search UNSPSC commodities by name or 8-digit code..."
        renderOption={(option) => {
          const relations = option.relations || {};
          return (
            <div className="space-y-0.5 py-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-900">{option.title}</span>
                {option.code && (
                  <span className="font-mono text-[11px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 shrink-0">
                    {option.code}
                  </span>
                )}
              </div>
              {(relations.class || relations.segment) && (
                <p className="text-[11px] text-slate-500">
                  {relations.class ? `Class: ${relations.class}` : ''}
                  {relations.class && relations.segment ? ' • ' : ''}
                  {relations.segment ? `Segment: ${relations.segment}` : ''}
                </p>
              )}
            </div>
          );
        }}
      />

      {/* Auto-Resolved 4-Tier Hierarchy Breakdown Card */}
      {selectedCommodity && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                Resolved UNSPSC Hierarchy Relations
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="default" className="font-mono text-[11px]">
                UNSPSC: {selectedCommodity.code || 'N/A'}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleClear}
                className="h-6 w-6 text-slate-500 hover:text-slate-800"
                title="Clear Selection"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Level 1: Segment */}
            <div className="rounded-lg border border-blue-100 bg-white p-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                1. Segment (Group)
              </span>
              <p className="text-xs font-semibold text-slate-800 mt-0.5 leading-snug">
                {selectedCommodity.relations?.segment || 'Top Level Segment'}
              </p>
              {selectedCommodity.relations?.segment_code && (
                <span className="font-mono text-[10px] text-slate-400">
                  Code: {selectedCommodity.relations.segment_code}
                </span>
              )}
            </div>

            {/* Level 2: Family */}
            <div className="rounded-lg border border-blue-100 bg-white p-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                2. Family
              </span>
              <p className="text-xs font-semibold text-slate-800 mt-0.5 leading-snug">
                {selectedCommodity.relations?.family || 'Category Family'}
              </p>
              {selectedCommodity.relations?.family_code && (
                <span className="font-mono text-[10px] text-slate-400">
                  Code: {selectedCommodity.relations.family_code}
                </span>
              )}
            </div>

            {/* Level 3: Class */}
            <div className="rounded-lg border border-blue-100 bg-white p-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                3. Class
              </span>
              <p className="text-xs font-semibold text-slate-800 mt-0.5 leading-snug">
                {selectedCommodity.relations?.class || 'Category Class'}
              </p>
              {selectedCommodity.relations?.class_code && (
                <span className="font-mono text-[10px] text-slate-400">
                  Code: {selectedCommodity.relations.class_code}
                </span>
              )}
            </div>

            {/* Level 4: Commodity */}
            <div className="rounded-lg border-2 border-blue-600 bg-white p-2.5 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                4. Commodity (Assigned)
              </span>
              <p className="text-xs font-bold text-blue-700 mt-0.5 leading-snug">
                {selectedCommodity.title}
              </p>
              {selectedCommodity.code && (
                <span className="font-mono text-[10px] font-semibold text-blue-600">
                  Code: {selectedCommodity.code}
                </span>
              )}
            </div>
          </div>

          {selectedCommodity.full_path && (
            <div className="pt-2 border-t border-dashed border-blue-200 text-xs">
              <span className="font-semibold text-blue-700 mr-1.5">Full Hierarchy Trail:</span>
              <span className="text-slate-700">{selectedCommodity.full_path}</span>
            </div>
          )}

          {selectedCommodity.definition && (
            <div className="pt-2 border-t border-dashed border-blue-200 flex items-start gap-2 text-xs text-slate-600 italic">
              <Info className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>&ldquo;{selectedCommodity.definition}&rdquo;</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
