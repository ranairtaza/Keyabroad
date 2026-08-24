"use client";

import { useCompareStore } from '@/store/compare';
import { Button } from '@keyabroad/ui/components/button';
import { X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ComparePage() {
  const { items, removeItem, clearItems } = useCompareStore();

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Compare Selected Items</h1>
          {items.length > 0 && (
            <Button variant="outline" onClick={clearItems} className="text-red-600 border-red-200 hover:bg-red-50">
              Clear All
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <h2 className="text-xl font-medium text-slate-900 mb-2">Nothing to compare</h2>
            <p className="text-slate-500 mb-6">Select up to 4 programs or universities to compare them side by side.</p>
            <div className="flex justify-center gap-4">
              <Link href="/programs">
                <Button>Browse Programs</Button>
              </Link>
              <Link href="/universities">
                <Button variant="outline">Browse Universities</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-6 border-b border-slate-200 border-r w-48 bg-slate-50">Feature</th>
                  {items.map((item) => (
                    <th key={item.id} className="p-6 border-b border-slate-200 text-center min-w-[250px]">
                      <div className="flex justify-end mb-2">
                        <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-600">
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900">{item.name}</h3>
                      <p className="text-sm text-slate-500 capitalize">{item.type}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-6 border-b border-slate-200 border-r font-medium text-slate-700 bg-slate-50">Country</td>
                  {items.map((item) => (
                    <td key={item.id} className="p-6 border-b border-slate-200 text-center">
                      {item.country || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-6 border-b border-slate-200 border-r font-medium text-slate-700 bg-slate-50">Tuition Fee</td>
                  {items.map((item) => (
                    <td key={item.id} className="p-6 border-b border-slate-200 text-center">
                      {item.tuition_fee ? `${item.tuition_fee} ${item.currency || ''}/yr` : 'Contact for details'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-6 border-b border-slate-200 border-r font-medium text-slate-700 bg-slate-50">Degree Level</td>
                  {items.map((item) => (
                    <td key={item.id} className="p-6 border-b border-slate-200 text-center capitalize">
                      {item.degree_level || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-6 border-b border-slate-200 border-r font-medium text-slate-700 bg-slate-50">Duration</td>
                  {items.map((item) => (
                    <td key={item.id} className="p-6 border-b border-slate-200 text-center">
                      {item.duration || 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-6 border-r font-medium text-slate-700 bg-slate-50">Action</td>
                  {items.map((item) => (
                    <td key={item.id} className="p-6 text-center">
                      <Link href={
                        item.type === 'program' 
                          ? (item.university_slug && item.slug ? `/programs/${item.university_slug}/${item.slug}` : `/programs/${item.id}`) 
                          : `/universities/${item.slug || item.id}`
                      }>
                        <Button className="w-full flex items-center justify-center gap-2">
                          View Details <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
