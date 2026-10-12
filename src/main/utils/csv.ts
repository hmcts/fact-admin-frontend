export type CsvSerialisationOptions = {
  alwaysQuote?: boolean;
  normaliseLineEndings?: boolean;
};

export function escapeCsvValue(value = '', options: CsvSerialisationOptions = {}): string {
  const normalisedValue = options.normaliseLineEndings === false ? value : value.replaceAll('\r\n', '\n');
  const escapedValue = normalisedValue.replaceAll('"', '""');

  return options.alwaysQuote || /[",\n]/.test(normalisedValue) ? `"${escapedValue}"` : normalisedValue;
}

export function serialiseCsvRow(values: readonly string[], options: CsvSerialisationOptions = {}): string {
  return values.map(value => escapeCsvValue(value, options)).join(',');
}

export function serialiseCsv(rows: readonly (readonly string[])[], options: CsvSerialisationOptions = {}): string {
  return rows.map(row => serialiseCsvRow(row, options)).join('\n');
}
