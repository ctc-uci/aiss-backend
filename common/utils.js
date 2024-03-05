// toCamel, isArray, and isObject are helper functions used within utils only
const toCamel = (s) => {
  return s.replace(/([-_][a-z])/g, ($1) => {
    return $1.toUpperCase().replace('-', '').replace('_', '');
  });
};

const isArray = (a) => {
  return Array.isArray(a);
};

const isISODate = (str) => {
  try {
    const ISOString = str.toISOString();
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(ISOString)) return false;
    const d = new Date(ISOString);
    return d.toISOString() === ISOString;
  } catch (err) {
    return false;
  }
};

// dependency for catalog.js
const isInteger = (value) => {
  return value && /^\d+$/.test(value);
};

// dependency for publishedSchedule.js
const calculateYear = (eventDate, gradeLevel) => {
  if (gradeLevel) {
    const currentDay = new Date(eventDate);
    // console.log('current day', currentDay.getFullYear() + (currentDay.getMonth() >= 7 ? 2 : 1));
    if (gradeLevel.toLowerCase() === 'junior') {
      // if the current month is august or later
      // then junior will be current year + 2
      // otherwise junior will be current year + 1
      // months are zero indexed
      return [(currentDay.getFullYear() + (currentDay.getMonth() >= 7 ? 2 : 1)).toString(10)];
    }
    if (gradeLevel.toLowerCase() === 'senior') {
      // if the current month is august or later
      // then senior will be current year + 1
      // otherwise senior will be current year
      return [(currentDay.getFullYear() + (currentDay.getMonth() >= 7 ? 1 : 0)).toString(10)];
    }
    if (gradeLevel.toLowerCase() === 'both') {
      return [
        (currentDay.getFullYear() + (currentDay.getMonth() >= 7 ? 1 : 0)).toString(10),
        (currentDay.getFullYear() + (currentDay.getMonth() >= 7 ? 2 : 1)).toString(10),
      ];
    }
  }
  return [];
};

const isObject = (o) => {
  return o === Object(o) && !isArray(o) && typeof o !== 'function' && !isISODate(o);
};

// Database columns are in snake case. JavaScript is suppose to be in camel case
// This function converts the keys from the sql query to camel case so it follows JavaScript conventions
const keysToCamel = (data) => {
  if (isObject(data)) {
    const newData = {};
    Object.keys(data).forEach((key) => {
      newData[toCamel(key)] = keysToCamel(data[key]);
    });
    return newData;
  }
  if (isArray(data)) {
    return data.map((i) => {
      return keysToCamel(i);
    });
  }
  if (
    typeof data === 'string' &&
    data.length > 0 &&
    data[0] === '{' &&
    data[data.length - 1] === '}'
  ) {
    let parsedList = data.replaceAll('"', '');
    parsedList = parsedList.slice(1, parsedList.length - 1).split(',');
    return parsedList;
  }
  return data;
};

const getSeasonFromMonthAndYear = (month, year) => {
  if (month === 11) {
    return `Winter ${year + 1}`;
  }
  if (month === 0 || month === 1) {
    return `Winter ${year}`;
  }
  // spring
  // march-may -> winter [year]
  if (month >= 2 && month <= 4) {
    return `Winter ${year}`;
  }
  // summer
  // june-august -> summer [year]
  if (month >= 5 && month <= 7) {
    return `Summer ${year}`;
  }
  // fall
  // september-november -> fall [year]
  return `Fall ${year}`;
};

module.exports = { keysToCamel, isInteger, calculateYear, getSeasonFromMonthAndYear };
