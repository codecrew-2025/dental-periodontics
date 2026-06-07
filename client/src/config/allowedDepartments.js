export const ALLOWED_DEPARTMENTS = new Set([
  'periodontics',
  'periodontology',
  'oral',
  'oralmedicine',
  'oralmedicineandradiology',
  'oralmedicineradiology',
  'oralandmaxillofacial',
  'oralandmaxillofacialsurgery',
  'general',
  'generaldentistry',
]);

export const isDepartmentAllowed = (dept) => {
  const key = String(dept || '').trim().toLowerCase().replace(/[\s_]+/g, '');
  return ALLOWED_DEPARTMENTS.has(key);
};
