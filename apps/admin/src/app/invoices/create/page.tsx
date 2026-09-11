"use client";

import { useState } from "react";
import { Plus, Trash, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createDraftInvoice } from "../actions";

export default function CreateInvoicePage() {
  const [items, setItems] = useState([{ id: 1, description: "", quantity: 1, unit_amount: 0 }]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: "", quantity: 1, unit_amount: 0 }]);
  };

  const removeItem = (id: number) => {
    if (items.length === 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const total = items.reduce((acc, item) => acc + (item.quantity * item.unit_amount), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Link href="/invoices" className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-white">Create Draft Invoice</h2>
          <p className="text-slate-400">Generate a new invoice for a student.</p>
        </div>
      </div>

      <form action={createDraftInvoice} className="space-y-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
        
        {/* Core Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Student ID</label>
            <input 
              required
              name="student_id"
              type="text" 
              placeholder="UUID of the student" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Currency</label>
            <select required name="currency_code" defaultValue="PKR" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary">
              <option value="PKR">PKR - Pakistani Rupee</option>
              <option value="USD">USD - US Dollar</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="EUR">EUR - Euro</option>
              <option value="CAD">CAD - Canadian Dollar</option>
              <option value="AUD">AUD - Australian Dollar</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Due Date</label>
            <input 
              required
              name="due_date"
              type="date" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Invoice Items</h3>
            <button type="button" onClick={addItem} className="text-primary hover:text-blue-400 font-medium text-sm flex items-center gap-1">
              <Plus size={16} /> Add Item
            </button>
          </div>

          {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-4 items-end bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
              <div className="col-span-12 md:col-span-6 space-y-2">
                <label className="text-xs font-medium text-slate-400">Description</label>
                <input 
                  required
                  name="item_description[]"
                  type="text" 
                  placeholder="e.g. Visa Processing Fee" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].description = e.target.value;
                    setItems(newItems);
                  }}
                />
              </div>
              <div className="col-span-4 md:col-span-2 space-y-2">
                <label className="text-xs font-medium text-slate-400">Qty</label>
                <input 
                  required
                  name="item_quantity[]"
                  type="number" 
                  min="0.01"
                  step="0.01"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  value={item.quantity}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].quantity = parseFloat(e.target.value) || 0;
                    setItems(newItems);
                  }}
                />
              </div>
              <div className="col-span-6 md:col-span-3 space-y-2">
                <label className="text-xs font-medium text-slate-400">Unit Amount</label>
                <input 
                  required
                  name="item_unit_amount[]"
                  type="number" 
                  min="0"
                  step="0.01"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                  value={item.unit_amount}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].unit_amount = parseFloat(e.target.value) || 0;
                    setItems(newItems);
                  }}
                />
              </div>
              <div className="col-span-2 md:col-span-1 flex justify-end pb-2">
                <button 
                  type="button" 
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                  className="text-slate-500 hover:text-red-400 disabled:opacity-50 transition-colors"
                >
                  <Trash size={18} />
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <div className="text-right">
              <span className="text-slate-400 text-sm mr-4">Calculated Total</span>
              <span className="text-2xl font-bold text-white">{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex justify-end gap-3">
          <Link href="/invoices" className="px-6 py-2.5 text-slate-300 hover:text-white font-medium transition-colors">
            Cancel
          </Link>
          <button type="submit" className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg shadow-md transition-all">
            Save Draft Invoice
          </button>
        </div>
      </form>
    </div>
  );
}
