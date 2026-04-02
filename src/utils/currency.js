export const formatVnd = (value) => {
  const numeric = Number(value || 0);
  const safeValue = Number.isFinite(numeric) ? Math.round(numeric) : 0;
  return `${new Intl.NumberFormat("en-US").format(safeValue)} VND`;
};
