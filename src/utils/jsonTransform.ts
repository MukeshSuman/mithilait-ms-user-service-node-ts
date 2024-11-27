type Primitive = string | number | boolean | null | undefined;

type NestedObject = {
    [key: string]: Primitive | NestedObject | Array<any>;
};

type FlattenedObject = {
    [key: string]: Primitive | Array<Primitive>;
};

/**
 * Flattens a deeply nested object into a single-level object,
 * excluding specified keys from root level
 * @param obj The object to flatten
 * @param ignoreKeys Array of keys to ignore at root level
 * @param prefix Current path prefix for nested keys
 * @param seenKeys Set of keys already encountered
 * @returns A flattened object with configured key handling
 */
export const flattenObject = (
    obj: NestedObject,
    ignoreKeys: string[] = [],
    prefix: string = '',
    seenKeys: Set<string> = new Set()
): FlattenedObject => {
    return Object.keys(obj).reduce((acc: FlattenedObject, key: string) => {
        const value = obj[key];
        const newKey = prefix ? `${prefix}_${key}` : key;
        const shouldIgnoreAtRoot = ignoreKeys.includes(key);
        let skipKey = false;
        if(shouldIgnoreAtRoot){
            skipKey = true
            // console.log('shouldIgnoreAtRoot', key, shouldIgnoreAtRoot)
        } else if (value === null || value === undefined) {
            if (!shouldIgnoreAtRoot && !prefix && !seenKeys.has(key)) {
                acc[key] = value;
                seenKeys.add(key);
            } else if (prefix) {
                acc[newKey] = value;
            }
        }
        else if (Array.isArray(value)) {
            if (value.every(item => typeof item !== 'object' || item === null)) {
                if (!shouldIgnoreAtRoot && !prefix && !seenKeys.has(key)) {
                    acc[key] = value;
                    seenKeys.add(key);
                } else if (prefix) {
                    acc[newKey] = value;
                }
            } else {
                value.forEach((item, index) => {
                    if (typeof item === 'object' && item !== null) {
                        const arrayFlattened = flattenObject(
                            item,
                            ignoreKeys,
                            `${prefix ? prefix + '_' : ''}${key}[${index}]`,
                            seenKeys
                        );
                        Object.assign(acc, arrayFlattened);
                    } else {
                        const arrayKey = `${prefix ? prefix + '_' : ''}${key}[${index}]`;
                        acc[arrayKey] = item;
                    }
                });
            }
        }
        else if (typeof value === 'object') {
            const nestedFlattened = flattenObject(value, ignoreKeys, newKey, seenKeys);
            Object.assign(acc, nestedFlattened);
        }
        else {
            if (!shouldIgnoreAtRoot && !prefix && !seenKeys.has(key)) {
                acc[key] = value;
                seenKeys.add(key);
            } else if (prefix) {
                acc[newKey] = value;
            }
        }

        return acc;
    }, {});
}

type TransformConfig = {
    selectKeys: string[]; // Keys to select directly
    renames?: Record<string, string>; // Map of old key names to new key names
    newKeys?: Record<string, string>; // Map of new key names to comma-separated keys to join
};

// Input object type (example based on the given data structure)
type OriginalObject = {
    [key: string]: Primitive | NestedObject | Array<any>;
    // [key: string]: any; // Original object allows dynamic properties
};

// Arrow function implementation
export const transformObject = (
    original: OriginalObject,
    { selectKeys, renames, newKeys }: TransformConfig
): Record<string, any> => {
    const result: Record<string, any> = {};

    // Add selected keys directly
    selectKeys.forEach(key => {
        if (original[key] !== undefined) {
            result[key] = original[key];
        }
    });

    // Add and rename keys based on renames object
    if(renames){
        Object.entries(renames).forEach(([oldKey, newKey]) => {
            if (original[oldKey] !== undefined) {
                result[newKey] = original[oldKey];
            }
        });
    }

    // Add new joined keys
    if(newKeys){
        Object.entries(newKeys).forEach(([newKey, keysToJoin]) => {
            const values = keysToJoin.split(',').map(key => original[key]).filter(Boolean);
            if (values.length > 0) {
                result[newKey] = values.join(' '); // Join with a space or customize as needed
            }
        });
    }
    return result;
};

type AnyObject = {
    [key: string]: any; // Object with dynamic properties
  };
  
 export const reorderObjectKeys = (obj: AnyObject, keyOrder: string[]): AnyObject => {
    const reorderedObject: AnyObject = {};
  
    // Add keys in the specified order
    keyOrder.forEach(key => {
      if (key in obj) {
        reorderedObject[key] = obj[key];
      }
    });
  
    // Add any remaining keys not in the keyOrder
    Object.keys(obj).forEach(key => {
      if (!(key in reorderedObject)) {
        reorderedObject[key] = obj[key];
      }
    });
  
    return reorderedObject;
  };
  
  // Example usage
//   const originalObject = {
//     name: "John Doe",
//     email: "john.doe@example.com",
//     age: 25,
//     role: "Admin",
//   };
  
//   const keyOrder = ["role", "name", "email"]; // Desired key order
  
//   const reorderedObject = reorderKeys(originalObject, keyOrder);
  
//   console.log("Original Object:", originalObject);
//   console.log("Reordered Object:", reorderedObject);
  

// Example configuration and usage
// const originalObject: OriginalObject = {
//     "_id": "6720a0f720341192db5fac6d",
//     "firstName": "TEST",
//     "lastName": "Dev",
//     "email": "1730191607646@fake.com",
//     "phoneNumber": "9199780666",
//     "exam_title": "Exam CS 3",
//     "class": 9,
//     "section": "B",
// };

// const config: TransformConfig = {
//     selectKeys: ['email'],
//     renames: { phoneNumber: "phone", exam_title: "title" },
//     newKeys: { name: 'firstName,lastName', classDetails: 'class,section' },
// };

// Transform the object
// const newObject = transformObject(originalObject, config);

// console.log(newObject);



// const testObject = {
//   "_id": "670ce060bf2461ef2ef2a2d1",
//   "email": "student66@gmail.com",
//   "__v": 0,
//   "assessmentYear": 2024,
//   "class": 9,
//   "createdAt": "2024-10-14T09:12:00.774Z",
//   "dateOfBirth": "2020-09-25T13:33:44.222Z",
//   "emailVerified": false,
//   "firstName": "student",
//   "gender": "Male",
//   "isActive": true,
//   "isDeleted": false,
//   "lastName": "dev",
//   "loginAttempts": 0,
//   "password": "$2b$10$Jo4ApxQMs/4cawgtHhbXMOrSNfhB3.6SAaosPaF8qcgMaqDS3HCsW",
//   "phoneNumber": "+1 (821) 757-4262",
//   "registrationDate": "2024-10-14T09:12:00.776Z",
//   "role": "student",
//   "rollNumber": 13,
//   "schoolId": "670cd514da4921a72e8958b0",
//   "section": "A",
//   "status": "Active",
//   "subscriptionStatus": "Free",
//   "twoFactorEnabled": false,
//   "updatedAt": "2024-10-16T17:30:02.646Z",
//   "username": "0STU1728897120773",
//   "report": {
//     "_id": "671fa0cf7c53947c7c6afd8d",
//     "schoolId": "671a559376f023bccc851396",
//     "examId": "671fa0b87c53947c7c6afd84",
//     "studentId": "670ce060bf2461ef2ef2a2d1",
//     "fileId": "671fa0cf7c53947c7c6afd8a",
//     "status": "Completed",
//     "isDeleted": false,
//     "reason": "",
//     "createdAt": "2024-10-28T14:33:51.517Z",
//     "updatedAt": "2024-10-28T14:35:02.424Z",
//     "__v": 0,
//     "apiReponse": {
//       "privPronJson": {
//         "Confidence": 0.6387901,
//         "Lexical": "the old high there is an engine",
//         "ITN": "the old high there is an engine",
//         "MaskedITN": "the old high there is an engine",
//         "Display": "The old high there is an engine.",
//         "PronunciationAssessment": {
//           "AccuracyScore": 85,
//           "FluencyScore": 69,
//           "CompletenessScore": 100,
//           "PronScore": 75.4
//         },
//         "Words": [
//           {
//             "Word": "the",
//             "Offset": 22700000,
//             "Duration": 4200000,
//             "PronunciationAssessment": {
//               "AccuracyScore": 80,
//               "ErrorType": "None"
//             }
//           },
//           {
//             "Word": "old",
//             "Offset": 27200000,
//             "Duration": 6600000,
//             "PronunciationAssessment": {
//               "AccuracyScore": 40,
//               "ErrorType": "Mispronunciation"
//             }
//           },
//           {
//             "Word": "high",
//             "Offset": 45500000,
//             "Duration": 2900000,
//             "PronunciationAssessment": {
//               "AccuracyScore": 100,
//               "ErrorType": "None"
//             }
//           },
//           {
//             "Word": "there",
//             "Offset": 48500000,
//             "Duration": 4900000,
//             "PronunciationAssessment": {
//               "AccuracyScore": 94,
//               "ErrorType": "None"
//             }
//           },
//           {
//             "Word": "is",
//             "Offset": 54800000,
//             "Duration": 2700000,
//             "PronunciationAssessment": {
//               "AccuracyScore": 96,
//               "ErrorType": "None"
//             }
//           },
//           {
//             "Word": "an",
//             "Offset": 57600000,
//             "Duration": 1600000,
//             "PronunciationAssessment": {
//               "AccuracyScore": 100,
//               "ErrorType": "None"
//             }
//           },
//           {
//             "Word": "engine",
//             "Offset": 59300000,
//             "Duration": 6100000,
//             "PronunciationAssessment": {
//               "AccuracyScore": 86,
//               "ErrorType": "None"
//             }
//           }
//         ]
//       }
//     },
//     "result": {
//       "accuracyScore": 85,
//       "completenessScore": 100,
//       "fluencyScore": 69,
//       "pronunciationScore": 75.4,
//       "prosodyScore": null
//     }
//   },
//   "file": {
//     "_id": "671fa0cf7c53947c7c6afd8a",
//     "fileName": "testne.wav",
//     "fileType": "audio/wav",
//     "fileSize": 673964,
//     "fileUrl": "uploads/exam/671a559376f023bccc851396/1730126031504-testne.wav",
//     "uploadedById": "671a559376f023bccc851396",
//     "schoolId": "671a559376f023bccc851396",
//     "isActive": true,
//     "isDeleted": false,
//     "createdAt": "2024-10-28T14:33:51.513Z",
//     "updatedAt": "2024-10-28T14:33:51.513Z",
//     "__v": 0
//   },
//   "hasTakenExam": true,
//   "name": "student dev",
//   "id": "670ce060bf2461ef2ef2a2d1"
// }

// Specify keys to ignore at root level
// const ignoreKeys = ['type', 'city', 'age', 'apiReponse', '__v'];
// apiReponse
// const flattened = flattenObject(testObject, ignoreKeys);
// console.log(flattened);

