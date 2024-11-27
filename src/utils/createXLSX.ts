// import * as XLSX from "xlsx";
// import * as fs from "fs";

// // Define the type of data
// type Data = {
//   [key: string]: string | number | boolean;
// };

// // Function to write an array of objects to an Excel file
// const writeArrayToExcel = (data: Data[], filePath: string): void => {
//   // Step 1: Create a worksheet from the array of objects
//   const worksheet = XLSX.utils.json_to_sheet(data);

//   // Step 2: Create a new workbook and append the worksheet
//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

//   // Step 3: Write the workbook to the file
//   XLSX.writeFile(workbook, filePath);

//   console.log(`Excel file created at: ${filePath}`);
// };

// // Example data
// const data: Data[] = [
//   { name: "John Doe", email: "john.doe@example.com", age: 25 },
//   { name: "Jane Smith", email: "jane.smith@example.com", age: 30 },
// ];

// // Generate file name with date and time
// const now = new Date();
// const formattedDate = now.toISOString().split("T")[0];
// const formattedTime = now.toTimeString().split(" ")[0].replace(/:/g, "-");
// const fileName = `./${formattedDate}_${formattedTime}-data.xlsx`;

// // Call the function to write the array to an Excel file
// writeArrayToExcel(data, fileName);

import * as XLSX from 'xlsx';
import { WorkBook, WorkSheet } from 'xlsx';
import { writeFile } from 'fs/promises';
import * as fs from "fs";
import path from "path";


interface ExcelOptions {
  sheetName?: string;
  fileName?: string;
  headers?: string[];
  subPath?: string
}

export async function arrayToXLSX<T extends Record<string, any>>(
  data: T[],
  options: ExcelOptions = {}
): Promise<string> {
  try {
    const {
      sheetName = 'Sheet1',
      fileName = `export_${Date.now()}.xlsx`,
      headers,
      subPath= "/exam/reports"
    } = options;
    const downloadExamReportPath = path.join(__dirname, "../../downloads",  subPath);;

    // const uploadDir =   // Create the full path
  
    // Check if directory exists, if not, create it
    if (!fs.existsSync(downloadExamReportPath)) {
      fs.mkdirSync(downloadExamReportPath, { recursive: true });  // Create the directory recursively
    }

    // // Check if directory exists, if not, create it
    // if (!fs.existsSync(uploadDir)) {
    //   fs.mkdirSync(uploadDir, { recursive: true });  // Create the directory recursively
    // }

    // // Create the recordings directory if it doesn't exist
    // if (!fs.existsSync(path.join(__dirname, downloadExamReportPath))) {
    //   fs.mkdirSync(path.join(__dirname, downloadExamReportPath));
    // }
    // Set default options


    // Create workbook
    const workbook: WorkBook = XLSX.utils.book_new();

    // If headers are provided, add them to the beginning of the worksheet
    let worksheetData: any[][] = [];

    if (headers) {
      worksheetData.push(headers);
    } else if (data.length > 0) {
      // Use object keys as headers if not provided
      worksheetData.push(Object.keys(data[0]));
    }

    // Convert data to array format
    const rows = data.map(item => Object.values(item));
    worksheetData = worksheetData.concat(rows);

    // Create worksheet
    const worksheet: WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const filePath = `${downloadExamReportPath}/${fileName}`;
    console.log('filePath', filePath);

    // Write file
    await writeFile(filePath, buffer);

    return `./downloads/.${subPath}/${fileName}`;
  } catch (error: Error | any) {
    throw new Error(`Failed to convert array to XLSX: ${error.message}`);
  }
}
