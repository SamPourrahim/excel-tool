export interface TableRow {
  [key: string]: any;
  _diffs?: { [key: string]: boolean };
}

export interface DatePair {
  id: number;
  start: string;
  end: string;
  startType: 'jalali' | 'gregorian';
  endType: 'jalali' | 'gregorian';
}

export interface ComparePair {
  id: number;
  col1: string;
  col2: string;
}