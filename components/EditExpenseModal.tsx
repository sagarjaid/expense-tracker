/** @format */

'use client';

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import ExpenseForm from './ExpenseForm';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  subcategory: string;
  date: string;
}

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  onSuccess: () => void;
}

export default function EditExpenseModal({
  isOpen,
  onClose,
  expense,
  onSuccess,
}: EditExpenseModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: {
    amount: string;
    description: string;
    category: string;
    subcategory: string;
    date: Date | undefined;
  }) => {
    if (!expense) return;

    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error('User not authenticated');
      setLoading(false);
      return;
    }

    // Convert date to local timezone
    let localDate;
    if (formData.date) {
      const userDate = new Date(formData.date);
      localDate = new Date(
        userDate.getTime() - userDate.getTimezoneOffset() * 60000
      );
    }

    const updatedExpense = {
      amount: parseFloat(formData.amount),
      description:
        formData.description.trim() === '' ? 'NULL' : formData.description,
      category: formData.category,
      subcategory: formData.subcategory,
      date: localDate ? format(localDate, 'yyyy-MM-dd') : undefined,
    };

    const { error } = await supabase
      .from('expenses')
      .update(updatedExpense)
      .eq('id', expense.id);

    if (error) {
      toast.error('Error updating expense: ' + error.message);
    } else {
      toast.success('Expense updated successfully!');
      onSuccess();
      onClose();
    }
    setLoading(false);
  };

  return (
    <Modal
      isModalOpen={isOpen}
      setIsModalOpen={onClose}
      title='Edit Expense'>
      {expense && (
        <ExpenseForm
          initialValues={{
            amount: expense.amount.toString(),
            description:
              expense.description === 'NULL' ? '' : expense.description,
            category: expense.category,
            subcategory: expense.subcategory,
            date: expense.date
              ? new Date(expense.date + 'T00:00:00')
              : undefined,
          }}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel='Update Expense'
          showVoiceInput={false}
        />
      )}
    </Modal>
  );
}
