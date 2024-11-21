type SortOrder = "asc" | "desc";
type SortObject = Record<string, SortOrder>;
type ConvertedSortObject = Record<string, 1 | -1>;

export const convertSortObject = (sortObject: SortObject): ConvertedSortObject => {
  const convertedSort: ConvertedSortObject = {};

  Object.entries(sortObject).forEach(([key, value]) => {
    // convertedSort[key] = value.toLowerCase() === "asc" ? 1 : -1;
    if(value.toLowerCase() === 'asc'){
        convertedSort[key] = 1;
    } 
    if(value.toLowerCase() === 'desc'){
        convertedSort[key] = -1;
    }
  });

  return convertedSort;
}
