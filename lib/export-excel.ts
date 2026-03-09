export async function exportToExcel(data: Record<string, unknown>[], headers: { key: string; label: string }[], fileName: string) {
  const XLSX = await import('xlsx');

  const rows = data.map((row) =>
    headers.reduce<Record<string, unknown>>((acc, h) => {
      acc[h.label] = row[h.key] ?? '';
      return acc;
    }, {})
  );

  const ws = XLSX.utils.json_to_sheet(rows);

  // 컬럼 너비 자동 조절
  const colWidths = headers.map((h) => {
    const maxLen = Math.max(
      h.label.length,
      ...rows.map((r) => String(r[h.label] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
