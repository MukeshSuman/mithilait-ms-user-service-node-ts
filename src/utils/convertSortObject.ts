// type SortOrder = "asc" | "desc";
export type SortOrder = 'asc' | 'ascending' | 'desc' | 'descending';
type SortObject = Record<string, SortOrder>;
type ConvertedSortObject = Record<string, 1 | -1>;

export const convertSortObject = (
  sortObject: SortObject
): ConvertedSortObject => {
  const convertedSort: ConvertedSortObject = {};

  Object.entries(sortObject).forEach(([key, value]) => {
    // convertedSort[key] = value.toLowerCase() === "asc" ? 1 : -1;
    if (typeof value === 'string') {
      if (['asc', 'ascending'].includes(value.toLowerCase())) {
        convertedSort[key] = 1;
      }
      if (['desc', 'descending'].includes(value.toLowerCase())) {
        convertedSort[key] = -1;
      }
    }
  });

  return convertedSort;
};
