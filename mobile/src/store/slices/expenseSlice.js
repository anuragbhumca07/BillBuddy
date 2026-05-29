import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { expenseService } from '../../services/expenseService';

export const fetchExpenses = createAsyncThunk(
  'expenses/fetchExpenses',
  async (params, { rejectWithValue }) => {
    try {
      const data = await expenseService.getExpenses(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expenses');
    }
  }
);

export const fetchExpenseDetail = createAsyncThunk(
  'expenses/fetchExpenseDetail',
  async (expenseId, { rejectWithValue }) => {
    try {
      const data = await expenseService.getExpense(expenseId);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch expense');
    }
  }
);

export const addExpense = createAsyncThunk(
  'expenses/addExpense',
  async (expenseData, { rejectWithValue }) => {
    try {
      const data = await expenseService.createExpense(expenseData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add expense');
    }
  }
);

export const deleteExpense = createAsyncThunk(
  'expenses/deleteExpense',
  async (expenseId, { rejectWithValue }) => {
    try {
      await expenseService.deleteExpense(expenseId);
      return expenseId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete expense');
    }
  }
);

export const fetchBalances = createAsyncThunk(
  'expenses/fetchBalances',
  async (_, { rejectWithValue }) => {
    try {
      const data = await expenseService.getBalances();
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch balances');
    }
  }
);

export const settleDebt = createAsyncThunk(
  'expenses/settleDebt',
  async (debtData, { rejectWithValue }) => {
    try {
      const data = await expenseService.settleDebt(debtData);
      return data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to settle debt');
    }
  }
);

const expenseSlice = createSlice({
  name: 'expenses',
  initialState: {
    expenses: [],
    selectedExpense: null,
    balances: null,
    loading: false,
    error: null,
  },
  reducers: {
    addExpenseFromSocket: (state, action) => {
      const exists = state.expenses.find(e => e.id === action.payload.id);
      if (!exists) {
        state.expenses.unshift(action.payload);
      }
    },
    clearExpenseError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.expenses = action.payload;
        state.loading = false;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchExpenseDetail.fulfilled, (state, action) => {
        state.selectedExpense = action.payload;
      })
      .addCase(addExpense.pending, (state) => { state.loading = true; })
      .addCase(addExpense.fulfilled, (state, action) => {
        state.expenses.unshift(action.payload);
        state.loading = false;
      })
      .addCase(addExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.filter(e => e.id !== action.payload);
      })
      .addCase(fetchBalances.pending, (state) => { state.loading = true; })
      .addCase(fetchBalances.fulfilled, (state, action) => {
        state.balances = action.payload;
        state.loading = false;
      })
      .addCase(fetchBalances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(settleDebt.pending, (state) => { state.loading = true; })
      .addCase(settleDebt.fulfilled, (state, action) => {
        state.balances = action.payload;
        state.loading = false;
      })
      .addCase(settleDebt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { addExpenseFromSocket, clearExpenseError } = expenseSlice.actions;

export const selectExpenses = (state) => state.expenses.expenses;
export const selectBalances = (state) => state.expenses.balances;
export const selectExpenseLoading = (state) => state.expenses.loading;
export const selectSelectedExpense = (state) => state.expenses.selectedExpense;

export default expenseSlice.reducer;
