const normalizeKey = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const getFieldValue = (record, keys) => {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && String(record[key]).trim() !== '') {
      return String(record[key]).trim();
    }
  }
  return '';
};

const parseDateValue = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export const normalizeImportedRecords = (records) => {
  return records.map((record) => {
    const normalizedRecord = Object.fromEntries(
      Object.entries(record).map(([key, value]) => [normalizeKey(key), value])
    );

    return {
      player: getFieldValue(normalizedRecord, ['player', 'playername', 'name']),
      amount: getFieldValue(normalizedRecord, ['amount', 'amt', 'value']),
      date: getFieldValue(normalizedRecord, ['date', 'transactiondate', 'createdon']),
      description: getFieldValue(normalizedRecord, ['description', 'details', 'note'])
    };
  });
};

export const validateImportedRecords = (records) => {
  if (!Array.isArray(records) || records.length === 0) {
    return {
      valid: false,
      message: 'Error: Invalid file structure. Please include at least one record with Player, Date, and Amount columns.'
    };
  }

  const normalizedRecords = normalizeImportedRecords(records);
  const invalidIndex = normalizedRecords.findIndex((record) => {
    if (!record.player || !record.amount || !record.date) return true;
    if (Number.isNaN(Number(record.amount))) return true;
    if (!parseDateValue(record.date)) return true;
    return false;
  });

  if (invalidIndex !== -1) {
    return {
      valid: false,
      message: `Error: Invalid file structure in row ${invalidIndex + 2}. Expected Player, Date, and Amount values.`
    };
  }

  return {
    valid: true,
    records: normalizedRecords
  };
};

export const parseDelimitedRecords = (text) => {
  const lines = text.split('\n').filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(/[,\t]/).map((header) => normalizeKey(header));
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(/[,\t]/).map((value) => value.trim());
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index];
    });
    records.push(record);
  }

  return records;
};

export const parseImportedFile = async (file) => {
  const text = await file.text();

  if (file.name.endsWith('.json')) {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  return parseDelimitedRecords(text);
};