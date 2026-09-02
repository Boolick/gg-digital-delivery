import React, { useState } from 'react';
import { Button } from '../../../shared/ui/button/button';
import { Input } from '../../../shared/ui/input/input';
import { PlusCircle, Loader2 } from 'lucide-react';

export interface AdminRestockFormProps {
  onRestock: (sku: string, keys: string[]) => Promise<void>;
  isLoading: boolean;
}

export const AdminRestockForm: React.FC<AdminRestockFormProps> = ({ onRestock, isLoading }) => {
  const [sku, setSku] = useState('KEY-CS2-PRIME');
  const [keysText, setKeysText] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedKeys = keysText
      .split('\n')
      .map((k) => k.trim())
      .filter(Boolean);
    if (!sku || parsedKeys.length === 0) {
      return;
    }
    await onRestock(sku, parsedKeys);
    setKeysText('');
  };

  return (
    <form
      data-testid="admin-restock-form"
      onSubmit={handleSubmit}
      className="p-5 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-4"
    >
      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
        <PlusCircle className="w-4 h-4 text-emerald-600" /> Пополнение пула ключей
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="SKU товара"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="KEY-CS2-PRIME"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Ключи (по одному на строку)
        </label>
        <textarea
          value={keysText}
          onChange={(e) => setKeysText(e.target.value)}
          rows={3}
          placeholder="ABCD-1234-EFGH&#10;IJKL-5678-MNOP"
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:border-black"
          required
        />
      </div>
      <Button
        type="submit"
        disabled={isLoading || !keysText.trim()}
        className="w-full sm:w-auto"
        data-testid="restock-submit-btn"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <PlusCircle className="w-4 h-4 mr-2" />
        )}
        Пополнить ключи
      </Button>
    </form>
  );
};
