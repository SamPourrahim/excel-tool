import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import type { TableRow, DatePair, ComparePair } from './types';
import { parseJalaliDate, parseGregorianDate } from './utils/dateConverter';
import { generatePythonCode } from './services/geminiService';
import { FileUpload } from './components/FileUpload';
import { ColumnSelector } from './components/ColumnSelector';
import { DataTable } from './components/DataTable';
import { CodeSnippet } from './components/CodeSnippet';
import { CodeIcon, TableIcon, CalendarIcon, DownloadIcon, PlusIcon, TrashIcon, MergeIcon, ArrowRightIcon, GroupIcon, CompareIcon } from './components/IconComponents';

type View = 'table' | 'code';
type AppMode = 'calculate' | 'merge' | 'group' | 'compare';

const App: React.FC = () => {
  // Common state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [resultData, setResultData] = useState<TableRow[]>([]);
  const [pythonCode, setPythonCode] = useState<string>('');
  const [activeView, setActiveView] = useState<View>('table');
  const [appMode, setAppMode] = useState<AppMode>('calculate');
  const [nextId, setNextId] = useState(2);


  // State for Date Calculation
  const [calcFile, setCalcFile] = useState<File | null>(null);
  const [calcData, setCalcData] = useState<TableRow[]>([]);
  const [calcHeaders, setCalcHeaders] = useState<string[]>([]);
  const [datePairs, setDatePairs] = useState<DatePair[]>([{ id: 1, start: '', end: '', startType: 'jalali', endType: 'jalali' }]);
  const [isDataFromMerge, setIsDataFromMerge] = useState<boolean>(false);

  // State for File Merging
  const [file1, setFile1] = useState<File | null>(null);
  const [file1Name, setFile1Name] = useState<string>('');
  const [data1, setData1] = useState<TableRow[]>([]);
  const [headers1, setHeaders1] = useState<string[]>([]);
  const [key1, setKey1] = useState('');
  const [file2, setFile2] = useState<File | null>(null);
  const [data2, setData2] = useState<TableRow[]>([]);
  const [headers2, setHeaders2] = useState<string[]>([]);
  const [key2, setKey2] = useState('');

  // State for Grouping
  const [groupFile, setGroupFile] = useState<File | null>(null);
  const [groupData, setGroupData] = useState<TableRow[]>([]);
  const [groupHeaders, setGroupHeaders] = useState<string[]>([]);
  const [groupKey, setGroupKey] = useState('');
  
  // State for Comparing
  const [compareFile1, setCompareFile1] = useState<File | null>(null);
  const [compareData1, setCompareData1] = useState<TableRow[]>([]);
  const [compareHeaders1, setCompareHeaders1] = useState<string[]>([]);
  const [compareKey1, setCompareKey1] = useState('');
  const [compareFile2, setCompareFile2] = useState<File | null>(null);
  const [compareData2, setCompareData2] = useState<TableRow[]>([]);
  const [compareHeaders2, setCompareHeaders2] = useState<string[]>([]);
  const [compareKey2, setCompareKey2] = useState('');
  const [comparePairs, setComparePairs] = useState<ComparePair[]>([{ id: 1, col1: '', col2: '' }]);


  const switchMode = (newMode: AppMode) => {
    if (appMode === newMode) return;

    // Reset common state
    setError('');
    setResultData([]);
    setPythonCode('');
    setActiveView('table');
    setIsLoading(false);
    setNextId(2);

    // Reset all mode-specific states
    setCalcFile(null); setCalcData([]); setCalcHeaders([]); setDatePairs([{ id: 1, start: '', end: '', startType: 'jalali', endType: 'jalali' }]); setIsDataFromMerge(false);
    setFile1(null); setFile1Name(''); setData1([]); setHeaders1([]); setKey1(''); setFile2(null); setData2([]); setHeaders2([]); setKey2('');
    setGroupFile(null); setGroupData([]); setGroupHeaders([]); setGroupKey('');
    setCompareFile1(null); setCompareData1([]); setCompareHeaders1([]); setCompareKey1(''); setCompareFile2(null); setCompareData2([]); setCompareHeaders2([]); setCompareKey2(''); setComparePairs([{ id: 1, col1: '', col2: '' }]);

    setAppMode(newMode);
  };
  
  const handleFileGeneric = (
    file: File,
    setFileState: React.Dispatch<React.SetStateAction<File | null>>,
    setDataState: React.Dispatch<React.SetStateAction<TableRow[]>>,
    setHeadersState: React.Dispatch<React.SetStateAction<string[]>>,
    setFileNameState?: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setIsLoading(true);
    setError('');
    setFileState(file);
    if(setFileNameState) setFileNameState(file.name);
    setResultData([]);
    setPythonCode('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result;
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<TableRow>(worksheet);
        
        if (jsonData.length > 0) {
          setDataState(jsonData);
          setHeadersState(Object.keys(jsonData[0]));
        } else {
          setError('فایل اکسل خالی است یا فرمت آن پشتیبانی نمی‌شود.');
        }
      } catch (e) {
        setError('خطا در پردازش فایل. لطفاً از یک فایل اکسل معتبر استفاده کنید.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setError('خطا در خواندن فایل.');
      setIsLoading(false);
    }
    reader.readAsArrayBuffer(file);
  };

  const addDatePair = () => { setDatePairs([...datePairs, { id: nextId, start: '', end: '', startType: 'jalali', endType: 'jalali' }]); setNextId(nextId + 1); };
  const removeDatePair = (id: number) => { setDatePairs(datePairs.filter(p => p.id !== id)); };
  const updateDatePair = (id: number, key: keyof Omit<DatePair, 'id'>, value: string) => { setDatePairs(datePairs.map(p => p.id === id ? { ...p, [key]: value } : p)); };
  
  const addComparePair = () => { setComparePairs([...comparePairs, { id: nextId, col1: '', col2: '' }]); setNextId(nextId + 1); };
  const removeComparePair = (id: number) => { setComparePairs(comparePairs.filter(p => p.id !== id)); };
  const updateComparePair = (id: number, key: 'col1' | 'col2', value: string) => { setComparePairs(comparePairs.map(p => p.id === id ? { ...p, [key]: value } : p)); };

  
  const handleCalculate = useCallback(async () => {
    if (datePairs.some(p => !p.start || !p.end)) {
      setError('لطفاً برای تمام زوج‌ها، ستون‌های شروع و پایان را انتخاب کنید.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResultData([]);
    setPythonCode('');
    setActiveView('table');

    const newResultData = calcData.map(originalRow => {
      const newRow = { ...originalRow };
      datePairs.forEach(pair => {
        if (pair.start && pair.end) {
          const startDateStr = String(originalRow[pair.start]);
          const endDateStr = String(originalRow[pair.end]);
          
          const parseDate = (dateStr: string, type: 'jalali' | 'gregorian') => {
            return type === 'jalali' ? parseJalaliDate(dateStr) : parseGregorianDate(dateStr);
          };

          const startDate = parseDate(startDateStr, pair.startType);
          const endDate = parseDate(endDateStr, pair.endType);

          const newColName = `${pair.start}_تا_${pair.end}`;
          
          let difference: string | number;
          if (startDate && endDate) {
            const timeDiff = endDate.getTime() - startDate.getTime();
            difference = Math.round(timeDiff / (1000 * 60 * 60 * 24));
          } else if (startDate && !endDateStr) {
            difference = 'تاریخ وجود ندارد';
          } else {
            difference = 'تاریخ نامعتبر';
          }
          newRow[newColName] = difference;
        }
      });
      return newRow;
    });
    setResultData(newResultData);

    const validPairs = datePairs.filter(p => p.start && p.end);
    const code = await generatePythonCode('calculate', { pairs: validPairs });
    setPythonCode(code);
    setIsLoading(false);
  }, [calcData, datePairs]);

  const handleMerge = useCallback(async () => {
    if (!data1.length || !data2.length || !key1 || !key2) {
      setError('لطفاً هر دو فایل و ستون‌های کلیدی را برای ادغام انتخاب کنید.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResultData([]);
    setPythonCode('');
    setActiveView('table');
    
    const data2Grouped = new Map<string, TableRow[]>();
    for (const row of data2) {
        const key = String(row[key2]);
        if (!data2Grouped.has(key)) { data2Grouped.set(key, []); }
        data2Grouped.get(key)!.push(row);
    }
    
    const mergedData: TableRow[] = [];
    data1.forEach(row1 => {
        const key1Value = String(row1[key1]);
        const matchingRows2 = data2Grouped.get(key1Value);
        
        if (matchingRows2 && matchingRows2.length > 0) {
            matchingRows2.forEach(row2Data => {
                const restOfRow2 = { ...row2Data };
                delete restOfRow2[key2];
                mergedData.push({ ...row1, ...restOfRow2 });
            });
        } else {
            mergedData.push({ ...row1 });
        }
    });
    setResultData(mergedData);
    
    setData1(mergedData);
    setHeaders1(mergedData.length > 0 ? Object.keys(mergedData[0]) : []);
    setFile1(null);
    setFile1Name(`نتیجه ادغام (${mergedData.length} سطر)`);
    setKey1('');
    
    setFile2(null); setData2([]); setHeaders2([]); setKey2('');

    const code = await generatePythonCode('merge', { key1, key2 });
    setPythonCode(code);
    setIsLoading(false);
  }, [data1, data2, key1, key2]);

  const handleGroup = useCallback(async () => {
    if (!groupData.length || !groupKey) {
        setError('لطفاً فایل و ستون کلیدی را برای گروه‌بندی انتخاب کنید.');
        return;
    }
    setIsLoading(true);
    setError('');
    setResultData([]);
    setPythonCode('');
    setActiveView('table');

    const counts: { [key: string]: number } = {};
    for (const row of groupData) {
        const key = String(row[groupKey]);
        counts[key] = (counts[key] || 0) + 1;
    }
    const duplicateKeys = new Set(Object.keys(counts).filter(key => counts[key] > 1));
    const filteredData = groupData.filter(row => duplicateKeys.has(String(row[groupKey])));
    filteredData.sort((a, b) => String(a[groupKey]).localeCompare(String(b[groupKey])));
    setResultData(filteredData);
    
    if(filteredData.length === 0) {
         setError('هیچ رکوردی با ورودی‌های تکراری در ستون کلیدی انتخاب شده یافت نشد.');
    }
    const code = await generatePythonCode('group', { key: groupKey });
    setPythonCode(code);
    setIsLoading(false);
  }, [groupData, groupKey]);
  
  const handleCompare = useCallback(async () => {
    if (!compareData1.length || !compareData2.length || !compareKey1 || !compareKey2 || comparePairs.some(p => !p.col1 || !p.col2)) {
        setError('لطفاً هر دو فایل، ستون‌های کلیدی و تمام زوج‌های مقایسه را انتخاب کنید.');
        return;
    }
    setIsLoading(true);
    setError('');
    setResultData([]);
    setPythonCode('');
    setActiveView('table');

    const data2Map = new Map<string, TableRow>();
    compareData2.forEach(row => {
        data2Map.set(String(row[compareKey2]), row);
    });

    const comparisonResult: TableRow[] = [];
    compareData1.forEach(row1 => {
        const key1Value = String(row1[compareKey1]);
        const row2 = data2Map.get(key1Value);
        const newRow: TableRow = { ...row1, _diffs: {} };
        let hasDifference = false;

        comparePairs.forEach(pair => {
            if (pair.col1 && pair.col2) {
                const val1 = row1[pair.col1];
                const val2 = row2 ? row2[pair.col2] : undefined;

                // Add column from file 2 for context, prefixed
                const file2ColName = `(فایل۲) ${pair.col2}`;
                newRow[file2ColName] = val2;

                if (String(val1 ?? '') !== String(val2 ?? '')) {
                    hasDifference = true;
                    newRow._diffs![pair.col1] = true;
                    newRow._diffs![file2ColName] = true;
                }
            }
        });

        if (hasDifference) {
            newRow['differences_summary'] = 'تفاوت';
        } else {
            newRow['differences_summary'] = 'مطابقت دارد';
        }
        comparisonResult.push(newRow);
    });

    setResultData(comparisonResult);

    const code = await generatePythonCode('compare', { 
        key1: compareKey1, 
        key2: compareKey2, 
        pairs: comparePairs.filter(p => p.col1 && p.col2) 
    });
    setPythonCode(code);
    setIsLoading(false);
}, [compareData1, compareData2, compareKey1, compareKey2, comparePairs]);

  const handleSendDataToCalculate = () => {
      switchMode('calculate');
      setCalcData(resultData);
      setCalcHeaders(resultData.length > 0 ? Object.keys(resultData[0]) : []);
      setIsDataFromMerge(true);
  };

  const handleDownload = () => {
    if (resultData.length === 0) return;
    
    // Create a deep copy and remove the internal _diffs property before download
    const dataForExport = resultData.map(row => {
        const newRow = {...row};
        delete newRow._diffs;
        return newRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ProcessedData');
    
    let filename = 'processed_data.xlsx';
    if (appMode === 'calculate') filename = 'date_difference_results.xlsx';
    else if (appMode === 'merge') filename = 'merged_file.xlsx';
    else if (appMode === 'group') filename = 'grouped_records.xlsx';
    else if (appMode === 'compare') filename = 'comparison_results.xlsx';

    XLSX.writeFile(workbook, filename);
  };

  const renderCalculateView = () => (
    <aside className="lg:col-span-4 bg-white p-6 rounded-xl shadow-lg h-fit">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2 text-indigo-700">۱. بارگذاری یا انتقال فایل</h2>
          {isDataFromMerge ? (
              <div className="border-2 border-dashed border-green-300 bg-green-50 rounded-lg p-4 text-center">
                  <p className="font-semibold text-green-700">داده‌های ادغام شده برای محاسبه آماده است.</p>
                  <p className="text-xs text-green-600 mt-1">{`شامل ${calcData.length} سطر.`}</p>
                  <button onClick={() => { setIsDataFromMerge(false); setCalcData([]); setCalcHeaders([]); }} className="mt-3 text-xs text-slate-500 hover:text-slate-700"> پاک کردن و بارگذاری فایل جدید </button>
              </div>
          ) : ( <FileUpload onFileSelect={(file) => handleFileGeneric(file, setCalcFile, setCalcData, setCalcHeaders)} currentFile={calcFile} title="فایل اکسل خود را انتخاب کنید" /> )}
        </div>
        {calcHeaders.length > 0 && ( <>
            <div>
              <h2 className="text-lg font-semibold mb-2 text-indigo-700">۲. انتخاب زوج ستون‌ها</h2>
              <div className="space-y-4">
                {datePairs.map((pair) => (
                  <div key={pair.id} className="p-3 border rounded-lg bg-slate-50 relative">
                    {datePairs.length > 1 && ( <button onClick={() => removeDatePair(pair.id)} className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center hover:bg-red-600"> <TrashIcon /> </button> )}
                    <div>
                        <ColumnSelector id={`start-${pair.id}`} label="ستون تاریخ شروع" columns={calcHeaders} selectedColumn={pair.start} onColumnChange={(val) => updateDatePair(pair.id, 'start', val)} />
                        <div className="flex justify-end mt-2">
                            <div className="inline-flex rounded-md shadow-sm" role="group">
                                <button type="button" onClick={() => updateDatePair(pair.id, 'startType', 'jalali')} className={`px-3 py-1 text-xs font-medium border border-slate-300 ${pair.startType === 'jalali' ? 'bg-indigo-600 text-white z-10 ring-1 ring-indigo-500' : 'bg-white text-slate-700 hover:bg-slate-50'} rounded-r-md transition-colors`}>
                                    شمسی
                                </button>
                                <button type="button" onClick={() => updateDatePair(pair.id, 'startType', 'gregorian')} className={`px-3 py-1 text-xs font-medium border-t border-b border-l border-slate-300 ${pair.startType === 'gregorian' ? 'bg-indigo-600 text-white z-10 ring-1 ring-indigo-500' : 'bg-white text-slate-700 hover:bg-slate-50'} rounded-l-md transition-colors`}>
                                    میلادی
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="mt-2">
                         <ColumnSelector id={`end-${pair.id}`} label="ستون تاریخ پایان" columns={calcHeaders} selectedColumn={pair.end} onColumnChange={(val) => updateDatePair(pair.id, 'end', val)} />
                         <div className="flex justify-end mt-2">
                            <div className="inline-flex rounded-md shadow-sm" role="group">
                                <button type="button" onClick={() => updateDatePair(pair.id, 'endType', 'jalali')} className={`px-3 py-1 text-xs font-medium border border-slate-300 ${pair.endType === 'jalali' ? 'bg-indigo-600 text-white z-10 ring-1 ring-indigo-500' : 'bg-white text-slate-700 hover:bg-slate-50'} rounded-r-md transition-colors`}>
                                    شمسی
                                </button>
                                <button type="button" onClick={() => updateDatePair(pair.id, 'endType', 'gregorian')} className={`px-3 py-1 text-xs font-medium border-t border-b border-l border-slate-300 ${pair.endType === 'gregorian' ? 'bg-indigo-600 text-white z-10 ring-1 ring-indigo-500' : 'bg-white text-slate-700 hover:bg-slate-50'} rounded-l-md transition-colors`}>
                                    میلادی
                                </button>
                            </div>
                        </div>
                    </div>
                  </div>
                ))}
                <button onClick={addDatePair} className="w-full flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-2 px-4 rounded-md transition-colors"> <PlusIcon /> <span>افزودن زوج جدید</span> </button>
              </div>
            </div>
            <div> <button onClick={handleCalculate} disabled={isLoading || datePairs.some(p => !p.start || !p.end)} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center"> {isLoading ? 'در حال پردازش...' : '۳. محاسبه'} </button> </div>
        </> )}
      </div>
    </aside>
  );

  const renderMergeView = () => (
     <aside className="lg:col-span-4 bg-white p-6 rounded-xl shadow-lg h-fit">
      <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2 text-indigo-700">۱. بارگذاری فایل‌ها</h2>
            <div className="space-y-4">
              { file1Name ? (
                  <div className="border-2 border-dashed border-green-300 bg-green-50 rounded-lg p-4 text-center">
                      <p className="font-semibold text-green-700">فایل اول (اصلی):</p>
                      <p className="text-sm text-green-600 mt-1">{file1Name}</p>
                  </div>
              ) : ( <FileUpload onFileSelect={(file) => handleFileGeneric(file, setFile1, setData1, setHeaders1, setFile1Name)} currentFile={file1} title="فایل اول (اصلی)" /> )}
              <FileUpload onFileSelect={(file) => handleFileGeneric(file, setFile2, setData2, setHeaders2)} currentFile={file2} title="فایل دوم (ادغامی)" />
            </div>
          </div>
          {(headers1.length > 0 && headers2.length > 0) && ( <>
              <div>
                <h2 className="text-lg font-semibold mb-2 text-indigo-700">۲. انتخاب ستون‌های کلیدی</h2>
                <div className="space-y-4">
                  <ColumnSelector id="key1" label="ستون کلید فایل اول" columns={headers1} selectedColumn={key1} onColumnChange={setKey1} />
                  <ColumnSelector id="key2" label="ستون کلید فایل دوم" columns={headers2} selectedColumn={key2} onColumnChange={setKey2} />
                </div>
              </div>
              <div> <button onClick={handleMerge} disabled={isLoading || !key1 || !key2} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center"> {isLoading ? 'در حال پردازش...' : '۳. ادغام فایل‌ها'} </button> </div>
          </> )}
          {resultData.length > 0 && appMode === 'merge' && (
              <div className="border-t pt-4">
                  <button onClick={handleSendDataToCalculate} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"> <span>ارسال برای محاسبه فاصله زمانی</span> <ArrowRightIcon /> </button>
              </div>
          )}
      </div>
     </aside>
  );

  const renderGroupView = () => (
    <aside className="lg:col-span-4 bg-white p-6 rounded-xl shadow-lg h-fit">
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold mb-2 text-indigo-700">۱. بارگذاری فایل</h2>
                <FileUpload onFileSelect={(file) => handleFileGeneric(file, setGroupFile, setGroupData, setGroupHeaders)} currentFile={groupFile} title="فایل اکسل خود را انتخاب کنید" />
            </div>
            {groupHeaders.length > 0 && ( <>
                <div>
                    <h2 className="text-lg font-semibold mb-2 text-indigo-700">۲. انتخاب ستون کلیدی</h2>
                    <p className="text-sm text-slate-600 mb-3">تمام ردیف‌هایی که در این ستون مقدار یکسان و تکراری دارند، نمایش داده خواهند شد.</p>
                    <ColumnSelector id="groupKey" label="ستون کلیدی (مانند شماره فاکتور)" columns={groupHeaders} selectedColumn={groupKey} onColumnChange={setGroupKey} />
                </div>
                <div> <button onClick={handleGroup} disabled={isLoading || !groupKey} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center"> {isLoading ? 'در حال پردازش...' : '۳. یافتن رکوردهای تکراری'} </button> </div>
            </> )}
        </div>
    </aside>
  );

  const renderCompareView = () => (
    <aside className="lg:col-span-4 bg-white p-6 rounded-xl shadow-lg h-fit">
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold mb-2 text-indigo-700">۱. بارگذاری فایل‌ها</h2>
                <div className="space-y-4">
                    <FileUpload onFileSelect={(file) => handleFileGeneric(file, setCompareFile1, setCompareData1, setCompareHeaders1)} currentFile={compareFile1} title="فایل اول (پایه)" />
                    <FileUpload onFileSelect={(file) => handleFileGeneric(file, setCompareFile2, setCompareData2, setCompareHeaders2)} currentFile={compareFile2} title="فایل دوم (مقایسه)" />
                </div>
            </div>
            {(compareHeaders1.length > 0 && compareHeaders2.length > 0) && (
                <>
                    <div>
                        <h2 className="text-lg font-semibold mb-2 text-indigo-700">۲. انتخاب ستون‌های کلیدی برای تطبیق</h2>
                        <div className="space-y-4 p-3 border rounded-lg bg-slate-50">
                            <ColumnSelector id="compareKey1" label="ستون کلید فایل اول" columns={compareHeaders1} selectedColumn={compareKey1} onColumnChange={setCompareKey1} />
                            <div className="mt-2"><ColumnSelector id="compareKey2" label="ستون کلید فایل دوم" columns={compareHeaders2} selectedColumn={compareKey2} onColumnChange={setCompareKey2} /></div>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold mb-2 text-indigo-700">۳. انتخاب ستون‌ها برای مقایسه</h2>
                        <div className="space-y-4">
                          {comparePairs.map(pair => (
                            <div key={pair.id} className="p-3 border rounded-lg bg-slate-50 relative">
                              {comparePairs.length > 1 && (<button onClick={() => removeComparePair(pair.id)} className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center hover:bg-red-600"><TrashIcon /></button>)}
                              <ColumnSelector id={`compare-col1-${pair.id}`} label="ستون از فایل اول" columns={compareHeaders1} selectedColumn={pair.col1} onColumnChange={(val) => updateComparePair(pair.id, 'col1', val)} />
                              <div className="mt-2"><ColumnSelector id={`compare-col2-${pair.id}`} label="ستون از فایل دوم" columns={compareHeaders2} selectedColumn={pair.col2} onColumnChange={(val) => updateComparePair(pair.id, 'col2', val)} /></div>
                            </div>
                          ))}
                          <button onClick={addComparePair} className="w-full flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-2 px-4 rounded-md transition-colors"><PlusIcon /><span>افزودن زوج مقایسه</span></button>
                        </div>
                    </div>
                    <div>
                        <button onClick={handleCompare} disabled={isLoading || !compareKey1 || !compareKey2 || comparePairs.some(p => !p.col1 || !p.col2)} className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center">
                            {isLoading ? 'در حال پردازش...' : '۴. مقایسه فایل‌ها'}
                        </button>
                    </div>
                </>
            )}
        </div>
    </aside>
  );


  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"> <CalendarIcon /> </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">ابزار پیشرفته اکسل</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="mb-6 border-b border-slate-200">
            <div className="flex space-x-4" dir="ltr">
                <button onClick={() => switchMode('calculate')} className={`flex items-center gap-2 font-medium pb-3 px-1 border-b-2 ${appMode === 'calculate' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}> <CalendarIcon /> محاسبه زمانی </button>
                <button onClick={() => switchMode('merge')} className={`flex items-center gap-2 font-medium pb-3 px-1 border-b-2 ${appMode === 'merge' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}> <MergeIcon /> ادغام فایل‌ها </button>
                <button onClick={() => switchMode('group')} className={`flex items-center gap-2 font-medium pb-3 px-1 border-b-2 ${appMode === 'group' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}> <GroupIcon /> یافتن تکراری‌ها </button>
                <button onClick={() => switchMode('compare')} className={`flex items-center gap-2 font-medium pb-3 px-1 border-b-2 ${appMode === 'compare' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}> <CompareIcon /> مقایسه فایل‌ها </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {appMode === 'calculate' ? renderCalculateView() : appMode === 'merge' ? renderMergeView() : appMode === 'group' ? renderGroupView() : renderCompareView() }
          
          <section className="lg:col-span-8">
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4" role="alert">{error}</div>}
            
            {(resultData.length > 0 || pythonCode) && !isLoading && (
              <div className="bg-white rounded-xl shadow-lg">
                <div className="border-b border-slate-200 flex justify-between items-center pr-4">
                  <nav className="flex space-x-2" dir="ltr">
                    <button onClick={() => setActiveView('table')} className={`flex items-center gap-2 font-medium py-4 px-2 border-b-2 transition-colors ${activeView === 'table' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}> <TableIcon /> <span>داده‌های نتیجه</span> </button>
                    <button onClick={() => setActiveView('code')} className={`flex items-center gap-2 font-medium py-4 px-2 border-b-2 transition-colors ${activeView === 'code' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}> <CodeIcon /> <span>کد پایتون</span> </button>
                  </nav>
                  {resultData.length > 0 && (
                    <button onClick={handleDownload} className="flex items-center gap-2 bg-green-500 text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors mr-2"> <DownloadIcon /> <span>دانلود اکسل</span> </button>
                  )}
                </div>
                
                <div className="p-2 md:p-4">
                  {activeView === 'table' ? (
                      <>
                        {resultData.length > 100 && (
                            <div className="text-sm text-slate-700 bg-yellow-100 border border-yellow-300 p-3 rounded-md mb-3" role="alert">
                                <p><strong>توجه:</strong> برای بهبود عملکرد، فقط <strong>۱۰۰ سطر اول</strong> از کل <strong>{resultData.length}</strong> نتیجه در جدول زیر نمایش داده می‌شود. فایل اکسل دانلودی شامل تمام نتایج خواهد بود.</p>
                            </div>
                        )}
                        <DataTable data={resultData.slice(0, 100)} />
                      </>
                  ) : <CodeSnippet code={pythonCode} />}
                </div>
              </div>
            )}
            {resultData.length === 0 && !pythonCode && !isLoading && (
                 <div className="flex items-center justify-center bg-white p-6 rounded-xl shadow-lg h-full min-h-[300px]">
                    <div className="text-center text-slate-500">
                      <p className="text-lg font-medium">نتایج در اینجا نمایش داده می‌شوند.</p>
                      <p className="text-sm">مراحل را در پنل کناری دنبال کنید.</p>
                    </div>
                </div>
             )}
             {isLoading && (
                <div className="flex items-center justify-center bg-white p-6 rounded-xl shadow-lg h-full min-h-[300px]">
                    <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="o 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
             )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;