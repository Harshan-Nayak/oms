export interface WeaverChallanHistory {
  date: string;
  party: string;
  quantity: number;
}

export interface ShortingEntryHistory {
  date: string;
  quantity: number;
  type: string;
}

export interface IsteachingChallanHistory {
  date: string;
  challanNo: string;
  product: string;
  quantity: number;
  top_qty?: number | null;
  top_pcs_qty?: number | null;
  bottom_qty?: number | null;
  bottom_pcs_qty?: number | null;
  both_selected?: boolean | null;
  both_top_qty?: number | null;
  both_bottom_qty?: number | null;
}

export interface ExpenseHistory {
  date: string;
  amount: number;
  reason: string;
}

export interface BatchHistoryData {
  batch_number: string;
  weaver_challan: WeaverChallanHistory;
  shorting_entries: ShortingEntryHistory[];
  isteaching_challans: IsteachingChallanHistory[];
  expenses: ExpenseHistory[];
}