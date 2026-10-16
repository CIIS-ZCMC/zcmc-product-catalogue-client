import React from 'react';
import {
  Package,
  CheckCircle2,
  FolderTree,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

export default function DashboardView({ stats, onNavigateToProducts }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="h-28 animate-pulse bg-slate-100/70" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            SSOT Catalogue Analytics &amp; Overview
          </h1>
          <p className="text-xs text-slate-500">
            Real-time metrics across standardized hospital items, UNSPSC taxonomy, and naming compliance
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onNavigateToProducts}>
          <span>Browse Full Catalogue</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Catalogue Products"
          value={(stats.total_products || 0).toLocaleString()}
          subtitle="Standardized Hospital Items"
          icon={Package}
          iconBg="bg-blue-50 text-blue-600 border-blue-200/60"
        />
        <MetricCard
          title="Uniform Naming Compliance"
          value={`${stats.compliance_rate || 0}%`}
          subtitle="Compliant Uppercase & Structure"
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-600 border-emerald-200/60"
        />
        <MetricCard
          title="Primary UNSPSC Segments"
          value={stats.total_segments || 58}
          subtitle="Top-Level Category Groups"
          icon={FolderTree}
          iconBg="bg-sky-50 text-sky-600 border-sky-200/60"
        />
        <MetricCard
          title="Total UNSPSC Categories"
          value={stats.total_categories?.toLocaleString() || '158,519'}
          subtitle="Segments, Families, Classes & Commodities"
          icon={Layers}
          iconBg="bg-indigo-50 text-indigo-600 border-indigo-200/60"
        />
      </div>

      {/* Middle Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Group Distribution */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Distribution by Category Group</CardTitle>
            <CardDescription>
              Item count across top-level procurement classifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.group_distribution?.length > 0 ? (
              stats.group_distribution.map((g, idx) => {
                const pct =
                  stats.total_products > 0
                    ? Math.round((g.count / stats.total_products) * 100)
                    : 0;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 truncate pr-3">
                        {g.category_group || 'Unclassified'}
                      </span>
                      <span className="font-mono font-semibold text-blue-600 shrink-0">
                        {g.count} items ({pct}%)
                      </span>
                    </div>
                    <Progress value={pct} />
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                No category distribution data available yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Units of Measure (UOM) Breakdown */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Units of Measure (UOM) Frequency</CardTitle>
            <CardDescription>
              Standard packaging units used in procurement purchase requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.uom_distribution?.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {stats.uom_distribution.map((u, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                  >
                    <div className="text-lg font-bold font-mono text-blue-600">
                      {u.count}
                    </div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 truncate mt-0.5">
                      {u.uom}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                No UOM frequency data available yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recently Catalogued Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="space-y-1">
            <CardTitle className="text-base">Recently Catalogued Hospital Items</CardTitle>
            <CardDescription>
              Latest entries verified under uniform naming guidelines
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onNavigateToProducts} className="text-blue-600">
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {stats.recent_products?.map((item) => (
              <div
                key={item.id}
                className="group rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                      {item.erp_item_code}
                    </span>
                    <Badge variant="secondary" className="uppercase text-[10px]">
                      {item.uom}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                    {item.item_description}
                  </p>
                  {item.full_category_path && (
                    <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2">
                      {item.full_category_path}
                    </p>
                  )}
                </div>

                {item.bizbox_item_code && (
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">BizBox Code:</span>
                    <span className="font-mono font-medium text-slate-700">
                      {item.bizbox_item_code}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, iconBg }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {title}
            </p>
            <p className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {value}
            </p>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
