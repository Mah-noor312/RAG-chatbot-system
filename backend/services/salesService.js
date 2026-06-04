import { getSalesData } from "../db/mysqlReader.js";

function toDateString(value) {
  if (!value) return "";

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return date.toISOString().slice(0, 10);
  }

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (slashMatch) {
    const month = slashMatch[1].padStart(2, "0");
    const day = slashMatch[2].padStart(2, "0");
    const year = slashMatch[3];

    return `${year}-${month}-${day}`;
  }

  const parsedDate = new Date(text);

  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().slice(0, 10);
  }

  return "";
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

function getNumber(value) {
  const cleanedValue = String(value || "")
    .replace(/,/g, "")
    .trim();

  const num = Number(cleanedValue);

  return Number.isNaN(num) ? 0 : num;
}

function getRevenueWithoutTips(sale) {
  const quantity = getNumber(sale.quantity);
  const unitPrice = getNumber(sale.unitPrice);

  return quantity * unitPrice;
}

function fixSpelling(input) {
  const corrections = {
    burgur: "burger",
    piza: "pizza",
    chiken: "chicken",
    desrt: "dessert",
    fris: "fries",
    sandwitch: "sandwich",
    biryaniii: "biryani",
    drik: "drink",
    cofee: "coffee",
    shak: "shake",
    sal: "sale",
    totl: "total",
    recod: "record",
  };

  let words = String(input || "").toLowerCase().split(" ");

  words = words.map((w) => corrections[w] || w);

  return words.join(" ");
}

function getTips(sale) {
  return getNumber(sale.tip);
}

function getSaleRevenue(sale) {
  return getRevenueWithoutTips(sale) + getTips(sale);
}

function getMonthNumber(monthName) {
  const months = {
    jan: "01",
    january: "01",
    feb: "02",
    february: "02",
    mar: "03",
    march: "03",
    apr: "04",
    april: "04",
    may: "05",
    jun: "06",
    june: "06",
    jul: "07",
    july: "07",
    aug: "08",
    august: "08",
    sep: "09",
    september: "09",
    oct: "10",
    october: "10",
    nov: "11",
    november: "11",
    dec: "12",
    december: "12",
  };

  return months[monthName.toLowerCase()] || null;
}

function getMonthLabel(monthNumber) {
  const labels = {
    "01": "January",
    "02": "February",
    "03": "March",
    "04": "April",
    "05": "May",
    "06": "June",
    "07": "July",
    "08": "August",
    "09": "September",
    "10": "October",
    "11": "November",
    "12": "December",
  };

  return labels[monthNumber] || monthNumber;
}

function getMonthKey(dateString) {
  return String(dateString).slice(0, 7);
}

function getMonthName(monthKey) {
  const [year, month] = monthKey.split("-");
  return `${getMonthLabel(month)} ${year}`;
}

function getAvailableMonthRange(sales) {
  const dates = sales
    .map((sale) => toDateString(sale.date))
    .filter(Boolean)
    .sort();

  if (dates.length === 0) {
    return null;
  }

  return {
    startDate: dates[0],
    endDate: dates[dates.length - 1],
  };
}

function wantsDateWise(question) {
  const q = question.toLowerCase();

  return (
    q.includes("with date") ||
    q.includes("with dates") ||
    q.includes("date wise") ||
    q.includes("date-wise") ||
    q.includes("daily") ||
    q.includes("by date") ||
    q.includes("day wise") ||
    q.includes("day-wise")
  );
}

function wantsMonthWise(question) {
  const q = question.toLowerCase();

  return (
    q.includes("each month") ||
    q.includes("by month") ||
    q.includes("month wise") ||
    q.includes("month-wise") ||
    q.includes("monthly summary") ||
    q.includes("monthly report") ||
    q.includes("month report") ||
    q.includes("month summary") ||
    q.includes("har month") ||
    q.includes("hr month") ||
    q.includes("month ki summary") ||
    q.includes("months summary")
  );
}

function wantsSummaryOnly(question) {
  const q = question.toLowerCase();

  return (
    q.includes("without sold items") ||
    q.includes("without items") ||
    q.includes("no sold items") ||
    q.includes("no items") ||
    q.includes("summary only") ||
    q.includes("only summary") ||
    q.includes("totals only") ||
    q.includes("sirf summary") ||
    q.includes("items mat dikhao") ||
    q.includes("sold items mat dikhao") ||
    q.includes("items na do")
  );
}

function wantsDetailed(question) {
  const q = question.toLowerCase();

  if (wantsSummaryOnly(question)) {
    return false;
  }

  return (
    q.includes("detail") ||
    q.includes("detailed") ||
    q.includes("items") ||
    q.includes("item sold") ||
    q.includes("items sold") ||
    q.includes("sold items") ||
    q.includes("what sold") ||
    q.includes("kya sale") ||
    q.includes("kia sale") ||
    q.includes("kya kya")
  );
}

function wantsAccuracyCheck(question) {
  const q = question.toLowerCase();

  return (
    q.includes("accuracy") ||
    q.includes("verify") ||
    q.includes("check sales") ||
    q.includes("check sales records") ||
    q.includes("number of sales") ||
    q.includes("num of sales") ||
    q.includes("sales count") ||
    q.includes("total transactions") ||
    q.includes("total sale records") ||
    q.includes("total sales records")
  );
}

function wantsMostSoldItem(question) {
  const q = question.toLowerCase();

  return (
    q.includes("most sold") ||
    q.includes("sold most") ||
    q.includes("highest sold") ||
    q.includes("top sold") ||
    q.includes("top selling") ||
    q.includes("best selling") ||
    q.includes("most selling") ||
    q.includes("which item sold most")
  );
}

function getPaymentMethod(question) {
  const q = question.toLowerCase();

  if (q.includes("cash")) return "cash";
  if (q.includes("card")) return "card";
  if (q.includes("online")) return "online";

  return null;
}

function getDishNameFromQuestion(question, sales) {
  const q = normalizeText(question);

  const dishNames = [
    ...new Set(sales.map((sale) => sale.dishName).filter(Boolean)),
  ];

  const sortedDishNames = dishNames.sort((a, b) => {
    return normalizeText(b).length - normalizeText(a).length;
  });

  return sortedDishNames.find((dishName) => {
    return q.includes(normalizeText(dishName));
  });
}

function filterByDishName(sales, dishName) {
  if (!dishName) return sales;

  return sales.filter((sale) => {
    return normalizeText(sale.dishName) === normalizeText(dishName);
  });
}

function filterByPayment(sales, paymentMethod) {
  if (!paymentMethod) return sales;

  return sales.filter((sale) => {
    return String(sale.paymentMethod || "").toLowerCase() === paymentMethod;
  });
}

function getDateRange(question) {
  const q = question.toLowerCase();

  const isoRangeMatch = q.match(
    /(20\d{2}-\d{2}-\d{2})\s*(to|-|se|tak)\s*(20\d{2}-\d{2}-\d{2})/
  );

  if (isoRangeMatch) {
    return {
      startDate: isoRangeMatch[1],
      endDate: isoRangeMatch[3],
      label: `${isoRangeMatch[1]} to ${isoRangeMatch[3]}`,
    };
  }

  const monthWords =
    "jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december";

  const naturalRangeMatch = q.match(
    new RegExp(
      `(\\d{1,2})\\s*(${monthWords})\\s*(20\\d{2})?\\s*(to|-|se)\\s*(\\d{1,2})\\s*(${monthWords})\\s*(20\\d{2})?(\\s*tak)?`
    )
  );

  if (!naturalRangeMatch) {
    return null;
  }

  const startDay = naturalRangeMatch[1].padStart(2, "0");
  const startMonth = getMonthNumber(naturalRangeMatch[2]);
  const startYear = naturalRangeMatch[3] || naturalRangeMatch[7] || "2026";

  const endDay = naturalRangeMatch[5].padStart(2, "0");
  const endMonth = getMonthNumber(naturalRangeMatch[6]);
  const endYear = naturalRangeMatch[7] || naturalRangeMatch[3] || "2026";

  return {
    startDate: `${startYear}-${startMonth}-${startDay}`,
    endDate: `${endYear}-${endMonth}-${endDay}`,
    label: `${startYear}-${startMonth}-${startDay} to ${endYear}-${endMonth}-${endDay}`,
  };
}

function getMonthRange(question) {
  const q = question.toLowerCase();

  const months = {
    january: "01",
    jan: "01",
    february: "02",
    feb: "02",
    march: "03",
    mar: "03",
    april: "04",
    apr: "04",
    may: "05",
    june: "06",
    jun: "06",
    july: "07",
    jul: "07",
    august: "08",
    aug: "08",
    september: "09",
    sep: "09",
    october: "10",
    oct: "10",
    november: "11",
    nov: "11",
    december: "12",
    dec: "12",
  };

  const foundMonth = Object.keys(months).find((monthName) => {
    const regex = new RegExp(`\\b${monthName}\\b`);
    return regex.test(q);
  });

  if (!foundMonth) {
    return null;
  }

  const yearMatch = q.match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : "2026";

  return {
    year,
    month: months[foundMonth],
    label: getMonthLabel(months[foundMonth]),
  };
}

function getMultiMonthRange(question, sales) {
  const q = question.toLowerCase();

  const months = {
    jan: "01",
    january: "01",
    feb: "02",
    february: "02",
    mar: "03",
    march: "03",
    apr: "04",
    april: "04",
    may: "05",
    jun: "06",
    june: "06",
    jul: "07",
    july: "07",
    aug: "08",
    august: "08",
    sep: "09",
    september: "09",
    oct: "10",
    october: "10",
    nov: "11",
    november: "11",
    dec: "12",
    december: "12",
  };

  const monthWords = Object.keys(months).join("|");

  const monthToMonthMatch = q.match(
    new RegExp(`\\b(${monthWords})\\b\\s*(to|-|se)\\s*\\b(${monthWords})\\b`)
  );

  const yearMatch = q.match(/\b(20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : "2026";

  if (monthToMonthMatch) {
    const startMonth = months[monthToMonthMatch[1]];
    const endMonth = months[monthToMonthMatch[3]];

    const endDay = new Date(Number(year), Number(endMonth), 0).getDate();

    return {
      startDate: `${year}-${startMonth}-01`,
      endDate: `${year}-${endMonth}-${String(endDay).padStart(2, "0")}`,
      label: `${getMonthLabel(startMonth)} to ${getMonthLabel(endMonth)} ${year}`,
    };
  }

 const firstMonthsMatch = q.match(
  /\b(first|initial|start|starting)\s*(\d+)\s*(month|months)\b/
);

  if (firstMonthsMatch) {
    const monthsCount = Number(firstMonthsMatch[2]);

    if (monthsCount > 0) {
      const availableRange = getAvailableMonthRange(sales);

      if (!availableRange) return null;

      const start = new Date(`${availableRange.startDate}T00:00:00`);
      const end = new Date(start);

      end.setMonth(start.getMonth() + monthsCount);
      end.setDate(0);

      return {
        startDate: formatDate(start),
        endDate: formatDate(end),
        label: `First ${monthsCount} month${monthsCount > 1 ? "s" : ""}`,
      };
    }
  }

  if (
    q.includes("all months") ||
    q.includes("jan feb mar") ||
    q.includes("january february march")
  ) {
    const availableRange = getAvailableMonthRange(sales);

    if (!availableRange) return null;

    return {
      startDate: availableRange.startDate,
      endDate: availableRange.endDate,
      label: "All available months",
    };
  }

  return null;
}
function getRelativeMonthRange(question) {
  const q = question.toLowerCase();
  const today = new Date();

  if (q.includes("last month")) {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);

    return {
      startDate: formatDate(start),
      endDate: formatDate(end),
      label: `${getMonthLabel(String(start.getMonth() + 1).padStart(2, "0"))} ${start.getFullYear()}`,
    };
  }

  if (q.includes("this month")) {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today);

    return {
      startDate: formatDate(start),
      endDate: formatDate(end),
      label: `${getMonthLabel(String(start.getMonth() + 1).padStart(2, "0"))} ${start.getFullYear()}`,
    };
  }

  return null;
}

function getRelativeDayRange(question) {
  const q = question.toLowerCase();
  const today = new Date();

  function getLastWeekday(targetDayIndex) {
    const result = new Date(today);
    const diff = (result.getDay() - targetDayIndex + 7) % 7 || 7;
    result.setDate(result.getDate() - diff);
    return result;
  }

  // Sunday = 0, Monday = 1 ... Saturday = 6
  const days = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  for (const day in days) {
    if (q.includes(`last ${day}`)) {
      const date = getLastWeekday(days[day]);

      return {
        startDate: formatDate(date),
        endDate: formatDate(date),
        label: `Last ${day}`,
      };
    }

    if (q.includes(`this ${day}`)) {
      const date = new Date(today);
      const diff = (date.getDay() - days[day] + 7) % 7;
      date.setDate(date.getDate() - diff);

      return {
        startDate: formatDate(date),
        endDate: formatDate(date),
        label: `This ${day}`,
      };
    }
  }

  // last week
  if (q.includes("last week")) {
    const end = new Date(today);
    end.setDate(today.getDate() - today.getDay()); // last Sunday

    const start = new Date(end);
    start.setDate(end.getDate() - 6);

    return {
      startDate: formatDate(start),
      endDate: formatDate(end),
      label: "Last Week",
    };
  }

  // this week
  if (q.includes("this week")) {
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());

    return {
      startDate: formatDate(start),
      endDate: formatDate(today),
      label: "This Week",
    };
  }

  return null;
}

function getSingleNaturalDate(question) {
  const q = question.toLowerCase();

  const monthWords =
    "jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december";

  const match = q.match(
    new RegExp(`(\\d{1,2})\\s*(${monthWords})\\s*(20\\d{2})?`)
  );

  if (!match) {
    return null;
  }

  const day = match[1].padStart(2, "0");
  const month = getMonthNumber(match[2]);
  const year = match[3] || "2026";

  return `${year}-${month}-${day}`;
}

function getRandomReasoning({ salesCount, filters = {} }) {
  const templates = [
    `Analysis: Processed ${salesCount} records after applying relevant filters.`,
    `Insight: Computation is based on ${salesCount} matching sales entries.`,
    `Note: Result generated from ${salesCount} filtered transactions.`,
    `Analysis: ${salesCount} records were evaluated to build this output.`,
    `Insight: Data aggregation completed on ${salesCount} sales records.`,
    `Note: System analyzed ${salesCount} entries to compute this result.`,
  ];

  let base = templates[Math.floor(Math.random() * templates.length)];

  const filterHints = [];

  if (filters.dateRange) filterHints.push("date filter applied");
  if (filters.monthRange) filterHints.push("month grouping used");
  if (filters.paymentMethod) filterHints.push("payment filtered");
  if (filters.dishName) filterHints.push("dish-specific query");

  if (filterHints.length) {
    base += ` (${filterHints.join(", ")})`;
  }

  return base;
}

function getTargetDate(question, sales) {
  const q = question.toLowerCase();
  const today = new Date();
if (q.includes("day before yesterday") || q.includes("parso ka din") || q.includes("2 din pehle")) {
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() - 2);
  return formatDate(targetDate);
}
  if (
    q.includes("new sales") ||
    q.includes("latest sales") ||
    q.includes("recent sales")
  ) {
    const dates = sales
      .map((sale) => toDateString(sale.date))
      .filter(Boolean)
      .sort();

    return dates[dates.length - 1] || null;
  }

  const daysAgoMatch = q.match(/(\d+)\s*(din pehle|days ago|day ago)/);

  if (daysAgoMatch) {
    const days = Number(daysAgoMatch[1]);
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - days);
    return formatDate(targetDate);
  }

  if (q.includes("yesterday") || q.includes("kal")) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - 1);
    return formatDate(targetDate);
  }

  if (q.includes("today") || q.includes("aaj")) {
    return formatDate(today);
  }

  const exactDateMatch = q.match(/\d{4}-\d{2}-\d{2}/);

  if (exactDateMatch) {
    return exactDateMatch[0];
  }

  const naturalDate = getSingleNaturalDate(question);

  if (naturalDate) {
    return naturalDate;
  }

  return null;
}


function summarizeSales(sales) {
  const revenueWithoutTips = sales.reduce((sum, sale) => {
    return sum + getRevenueWithoutTips(sale);
  }, 0);

  const totalTips = sales.reduce((sum, sale) => {
    return sum + getTips(sale);
  }, 0);

  const totalRevenue = revenueWithoutTips + totalTips;

  const totalQuantity = sales.reduce((sum, sale) => {
    return sum + getNumber(sale.quantity);
  }, 0);

  return {
    totalRevenue,
    revenueWithoutTips,
    totalTips,
    totalQuantity,
  };
}

function buildItemBreakdown(sales) {
  const itemSummary = {};

  sales.forEach((sale) => {
    const dishName = String(sale.dishName || "Unknown Item").trim();

    if (!itemSummary[dishName]) {
      itemSummary[dishName] = {
        quantity: 0,
        revenueWithoutTips: 0,
        tips: 0,
        revenueWithTips: 0,
      };
    }

    itemSummary[dishName].quantity += getNumber(sale.quantity);
    itemSummary[dishName].revenueWithoutTips += getRevenueWithoutTips(sale);
    itemSummary[dishName].tips += getTips(sale);
    itemSummary[dishName].revenueWithTips += getSaleRevenue(sale);
  });

  return Object.entries(itemSummary).map(([dishName, data], index) => {
    return `${index + 1}. ${dishName}: ${data.quantity} sold, revenue without tips ${data.revenueWithoutTips}, tips ${data.tips}, revenue with tips ${data.revenueWithTips}`;
  });
}

function getMostSoldItemAnswer(title, sales) {
  const itemSummary = {};

  sales.forEach((sale) => {
    const dishName = String(sale.dishName || "Unknown Item").trim();

    if (!itemSummary[dishName]) {
      itemSummary[dishName] = {
        quantity: 0,
        revenueWithoutTips: 0,
        tips: 0,
        revenueWithTips: 0,
      };
    }

    itemSummary[dishName].quantity += getNumber(sale.quantity);
    itemSummary[dishName].revenueWithoutTips += getRevenueWithoutTips(sale);
    itemSummary[dishName].tips += getTips(sale);
    itemSummary[dishName].revenueWithTips += getSaleRevenue(sale);
  });

  const sortedItems = Object.entries(itemSummary)
    .map(([dishName, data]) => ({
      dishName,
      ...data,
    }))
    .sort((a, b) => b.quantity - a.quantity);

  if (sortedItems.length === 0) {
    return "No sales records found.";
  }

  const topItems = sortedItems.slice(0, 5);

  const lines = topItems.map((item, index) => {
    return `${index + 1}. ${item.dishName}
Quantity Sold: ${item.quantity}
Revenue Without Tips: ${item.revenueWithoutTips}
Total Tips: ${item.tips}
Revenue With Tips: ${item.revenueWithTips}`;
  });

  return `${title}:

Top Selling Items:
${lines.join("\n\n")}`;
}

function groupSalesByDate(sales) {
  const dateSummary = {};

  sales.forEach((sale) => {
    const date = toDateString(sale.date);

    if (!dateSummary[date]) {
      dateSummary[date] = [];
    }

    dateSummary[date].push(sale);
  });

  return Object.entries(dateSummary).sort(([dateA], [dateB]) =>
    dateA.localeCompare(dateB)
  );
}

function groupSalesByMonth(sales) {
  const grouped = {};

  sales.forEach((sale) => {
    const saleDate = toDateString(sale.date);
    const monthKey = getMonthKey(saleDate);

    if (!monthKey) return;

    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }

    grouped[monthKey].push(sale);
  });

  return Object.entries(grouped).sort(([monthA], [monthB]) =>
    monthA.localeCompare(monthB)
  );
}


function buildSingleSaleAnswer(sale) {
  const saleId = sale.saleId || "";
  const date = toDateString(sale.date);
  const time = sale.time || "";
  const itemId = sale.itemId || "";
  const dishName = sale.dishName || "";
  const quantity = getNumber(sale.quantity);
  const unitPrice = getNumber(sale.unitPrice);
  const revenueWithoutTips = getRevenueWithoutTips(sale);
  const tips = getTips(sale);
  const total = getSaleRevenue(sale);
  const paymentMethod = sale.paymentMethod || "";

  return `Sales Detail for Sale ID ${saleId}:

Date: ${date}
Time: ${time}
Item ID: ${itemId}
Dish Name: ${dishName}
Quantity: ${quantity}
Unit Price: ${unitPrice}
Revenue Without Tips: ${revenueWithoutTips} 
Tips: ${tips}
Revenue With Tips: ${total}
Payment Method: ${paymentMethod}`;
}

function getSaleIdFromQuestion(question) {
  const q = String(question || "").toLowerCase();

  const match = q.match(
    /\b(?:sale\s*(?:id|number|num|no)?|saleid|transaction\s*(?:id|number|num|no)?)\s*#?\s*(\d+)\b/
  );

  if (!match) {
    return null;
  }

  const saleId = Number(match[1]);

  return Number.isInteger(saleId) && saleId > 0 ? saleId : null;
}

function getSalesAccuracyAnswer(sales) {
  const saleIds = sales
    .map((sale) => Number(sale.saleId))
    .filter((id) => !Number.isNaN(id))
    .sort((a, b) => a - b);

  const totalRecords = sales.length;
  const minSaleId = saleIds[0] || 0;
  const maxSaleId = saleIds[saleIds.length - 1] || 0;

  const duplicateIds = saleIds.filter(
    (id, index) => saleIds.indexOf(id) !== index
  );

  const uniqueDuplicateIds = [...new Set(duplicateIds)];
  const missingIds = [];

  for (let id = minSaleId; id <= maxSaleId; id++) {
    if (!saleIds.includes(id)) {
      missingIds.push(id);
    }
  }

  const { totalRevenue, totalQuantity } = summarizeSales(sales);

  const isAccurate =
    minSaleId === 1 &&
    maxSaleId === totalRecords &&
    missingIds.length === 0 &&
    uniqueDuplicateIds.length === 0;

  return `Sales Accuracy Check:

Total Sale Records: ${totalRecords}
SaleId Range: ${minSaleId} to ${maxSaleId}
Total Quantity Sold: ${totalQuantity}
Total Revenue: ${totalRevenue}

Missing Sale IDs: ${missingIds.length === 0 ? "None" : missingIds.join(", ")}
Duplicate Sale IDs: ${
    uniqueDuplicateIds.length === 0 ? "None" : uniqueDuplicateIds.join(", ")
  }

Result:
${
  isAccurate
    ? `Data looks accurate. There are exactly ${totalRecords} sales records from saleId ${minSaleId} to ${maxSaleId}.`
    : "Data needs checking. Some sale IDs are missing, duplicated, or the saleId range does not match the total record count."
}`;
}

function buildSalesSummaryAnswer(title, sales, includeItems = false) {
  const {
    totalRevenue,
    revenueWithoutTips,
    totalTips,
    totalQuantity,
  } = summarizeSales(sales);

  let answer = `${title}:

Total Sale Records: ${sales.length}
Total Quantity Sold: ${totalQuantity}
Revenue Without Tips: ${revenueWithoutTips}
Total Tips: ${totalTips}
Revenue With Tips: ${totalRevenue}`;

  if (includeItems) {
    answer += `

Items Sold:
${buildItemBreakdown(sales).join("\n")}`;
  }

  return answer;
}

function getCategoryFromQuestion(question) {
  const q = question.toLowerCase();

  if (q.includes("burger")) return "Burger";
  if (q.includes("pizza")) return "Pizza";
  if (q.includes("rice") || q.includes("biryani") || q.includes("pulao")) return "Rice";
  if (q.includes("desi") || q.includes("karahi") || q.includes("handi") || q.includes("qorma")) return "Desi";
  if (q.includes("snacks") || q.includes("fries") || q.includes("nuggets") || q.includes("wings")) return "Snacks";
  if (q.includes("sandwich")) return "Sandwich";
  if (q.includes("drink") || q.includes("shake") || q.includes("tea") || q.includes("coffee")) return "Drinks";
  if (q.includes("hot tea") || q.includes("green tea")) return "Hot Drinks";
  if (q.includes("dessert") || q.includes("ice cream") || q.includes("brownie")) return "Dessert";

  return null;
}

function filterByCategory(sales, category) {
  if (!category) return sales;

  return sales.filter((sale) =>
    normalizeText(sale.dishName).includes(normalizeText(category))
  );
}

function buildDateWiseSalesAnswer(title, sales, includeItems = false) {
  const groupedSales = groupSalesByDate(sales);

  const dateWiseLines = groupedSales.map(([date, dateSales]) => {
    const summary = summarizeSales(dateSales);

     let line = `${date}
Total Quantity Sold: ${summary.totalQuantity}
Revenue Without Tips: ${summary.revenueWithoutTips}
Total Tips: ${summary.totalTips}
Revenue With Tips: ${summary.totalRevenue}`;

    if (includeItems) {
      line += `
Items Sold:
${buildItemBreakdown(dateSales).join("\n")}`;
    }

    return line;
  });

  const overallSummary = summarizeSales(sales);

  return `${title}

${dateWiseLines.join("\n\n")}

Overall Total:
Total Sale Records: ${sales.length}
Total Revenue: ${overallSummary.totalRevenue}
Total Quantity Sold: ${overallSummary.totalQuantity}`;
}

function buildMonthWiseSalesAnswer(title, sales, includeItems = false) {
  const groupedSales = groupSalesByMonth(sales);

  const monthWiseLines = groupedSales.map(([monthKey, monthSales]) => {
    const summary = summarizeSales(monthSales);

    let line = `${getMonthName(monthKey)}
Total Sale Records: ${monthSales.length}
Total Quantity Sold: ${summary.totalQuantity}
Revenue Without Tips: ${summary.revenueWithoutTips}
Total Tips: ${summary.totalTips}
Revenue With Tips: ${summary.totalRevenue}`;

    if (includeItems) {
      line += `

Items Sold:
${buildItemBreakdown(monthSales).join("\n")}`;
    }

    return line;
  });

  const overallSummary = summarizeSales(sales);

  return `${title}

${monthWiseLines.join("\n\n")}

Overall Total:
Total Sale Records: ${sales.length}
Total Revenue: ${overallSummary.totalRevenue}
Total Quantity Sold: ${overallSummary.totalQuantity}`;
}

function buildSalesAnswer(title, sales, options = {}) {
  const { groupBy = "none", includeItems = false } = options;

  if (groupBy === "month") {
    return buildMonthWiseSalesAnswer(title, sales, includeItems);
  }

  if (groupBy === "date") {
    return buildDateWiseSalesAnswer(title, sales, includeItems);
  }

  if (groupBy === "item") {
    return buildSalesSummaryAnswer(title, sales, true);
  }

  return buildSalesSummaryAnswer(title, sales, includeItems);
}

export async function getSalesAnswer(question) {
  question = fixSpelling(question);
  const sales = await getSalesData();

  if (wantsAccuracyCheck(question)) {
    return getSalesAccuracyAnswer(sales);
  }

  const saleId = getSaleIdFromQuestion(question);

  if (saleId) {
    const sale = sales.find((sale) => {
      return Number(sale.saleId) === Number(saleId);
    });

    if (!sale) {
      return `No sales record found for Sale ID ${saleId}.`;
    }

    return buildSingleSaleAnswer(sale);
  }

  const paymentMethod = getPaymentMethod(question);
  const dishName = getDishNameFromQuestion(question, sales);
let category = getCategoryFromQuestion(question);
if (dishName) category = null;

  const dateRange = getDateRange(question);
const multiMonthRange = getMultiMonthRange(question, sales);
const monthRange = getMonthRange(question);
const targetDate = getTargetDate(question, sales);
const relativeMonthRange = getRelativeMonthRange(question);
const relativeDayRange = getRelativeDayRange(question);
// ✅ 👇 YAHAN ADD KARO (IMPORTANT)

// 🔥 MULTI-YEAR SAME MONTH (DETAILED + SEPARATE)
const multiYearMonthMatch = question.toLowerCase().match(
  /(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|september|oct|october|nov|november|dec|december)\s+(20\d{2})\s*(and|&)\s*(?:\1\s*)?(20\d{2})/
);

if (multiYearMonthMatch) {
  const monthName = multiYearMonthMatch[1];
  const year1 = multiYearMonthMatch[2];
  const year2 = multiYearMonthMatch[4];

  const monthNum = getMonthNumber(monthName);

  const sales1 = sales.filter((sale) => {
    return toDateString(sale.date).startsWith(`${year1}-${monthNum}`);
  });

  const sales2 = sales.filter((sale) => {
    return toDateString(sale.date).startsWith(`${year2}-${monthNum}`);
  });

  return (
    buildSalesSummaryAnswer(
      `Sales Record for ${monthName} ${year1}`,
      sales1,
      true
    ) +
    "\n\n" +
    (sales2.length > 0
      ? buildSalesSummaryAnswer(
          `Sales Record for ${monthName} ${year2}`,
          sales2,
          true
        )
      : `Sales Record for ${monthName} ${year2}:\nNo data found.`)
  );
}

  const monthWiseRequired = wantsMonthWise(question);
  const dateWiseRequired = wantsDateWise(question) && !monthWiseRequired;
  const includeItems = wantsDetailed(question);
  const mostSoldRequired = wantsMostSoldItem(question);

  let filteredSales = sales;
  let title = "Total Sales";

  // ✅ TOTAL SALES FIX (IMPORTANT)
const isTotalQuery =
  question.toLowerCase().includes("total") &&
  question.toLowerCase().includes("sales");

const hasYear = /\b20\d{2}\b/.test(question);

if (
  isTotalQuery &&
  !hasYear &&
  !dateRange &&
  !monthRange &&
  !multiMonthRange &&
  !targetDate
) {
  return buildSalesSummaryAnswer("Overall Sales Record", sales, false);
}
   // ✅ YEAR FILTER (IMPORTANT FIX)
const yearMatches = question.match(/\b(20\d{2})\b/g);

if (
  yearMatches &&
  !isTotalQuery &&
  !monthWiseRequired &&
  !mostSoldRequired &&
  !dateRange &&
  !monthRange &&
  !multiMonthRange &&
  !targetDate
) {

  const uniqueYears = [...new Set(yearMatches)];
  let finalAnswer = "";

  for (const year of uniqueYears) {

    const yearSales = sales.filter((sale) => {
      const saleDate = toDateString(sale.date);
      return saleDate.startsWith(`${year}-`);
    });

    if (yearSales.length === 0) {
      finalAnswer += `\n${year}:\nNo sales record found.\n\n`;
      continue;
    }

    const totalRecords = yearSales.length;
    const totalQty = yearSales.reduce((sum, s) => sum + Number(s.quantity), 0);
    const revenueWithoutTips = yearSales.reduce((sum, s) => sum + (Number(s.quantity) * Number(s.unitPrice)), 0);
    const totalTips = yearSales.reduce((sum, s) => sum + Number(s.tip || 0), 0);
    const revenueWithTips = revenueWithoutTips + totalTips;

    finalAnswer += `
${year} Summary:
Total Sale Records: ${totalRecords}
Total Quantity Sold: ${totalQty}
Revenue Without Tips: ${revenueWithoutTips}
Total Tips: ${totalTips}
Revenue With Tips: ${revenueWithTips}

`;
  }

  return finalAnswer.trim();
}
 
  if (dateRange) {
  filteredSales = filteredSales.filter((sale) => {
    const saleDate = toDateString(sale.date);

    return (
      saleDate >= dateRange.startDate &&
      saleDate <= dateRange.endDate
    );
  });

  title = `Sales Record for ${dateRange.label}`;
}
else if (relativeMonthRange) {
  filteredSales = filteredSales.filter((sale) => {
    const saleDate = toDateString(sale.date);

    return (
      saleDate >= relativeMonthRange.startDate &&
      saleDate <= relativeMonthRange.endDate
    );
  });

  title = `Sales Record for ${relativeMonthRange.label}`;
}
else if (relativeDayRange) {
  filteredSales = filteredSales.filter((sale) => {
    const saleDate = toDateString(sale.date);

    return (
      saleDate >= relativeDayRange.startDate &&
      saleDate <= relativeDayRange.endDate
    );
  });
 title = `Sales Record for ${relativeDayRange.label}`;

}
else if (targetDate) {
  filteredSales = filteredSales.filter((sale) => {
    return toDateString(sale.date) === targetDate;
  });

  title = `Sales Details for ${targetDate}`;
} else if (monthRange && !monthWiseRequired) {
  filteredSales = filteredSales.filter((sale) => {
    const saleDate = toDateString(sale.date);
    return saleDate.startsWith(`${monthRange.year}-${monthRange.month}`);
  });

  title = `Sales Record for ${monthRange.label} ${monthRange.year}`;
} else if (monthWiseRequired) {
    const yearMatch = question.match(/\b(20\d{2})\b/);
    const year = yearMatch ? yearMatch[1] : "2026";

    filteredSales = filteredSales.filter((sale) => {
      const saleDate = toDateString(sale.date);
      return saleDate.startsWith(`${year}-`);
    });

    title = `Sales Record for ${year}`;
  }

  filteredSales = filterByPayment(filteredSales, paymentMethod);

if (category) {
  filteredSales = filterByCategory(filteredSales, category);
}

filteredSales = filterByDishName(filteredSales, dishName);

  if (dishName) {
    title = title.replace("Sales Record", `Sales Record for ${dishName}`);
    title = title.replace("Sales Details", `Sales Details for ${dishName}`);
    title = title.replace("Total Sales", `Total Sales for ${dishName}`);
  }

  if (category) {
  title = title.replace("Sales Record", `Sales Record for ${category}`);
  title = title.replace("Sales Details", `Sales Details for ${category}`);
}

  if (paymentMethod) {
    title = `${title} (${paymentMethod})`;
  }

  if (mostSoldRequired) {
  return getMostSoldItemAnswer(title, filteredSales);
}

  if (!filteredSales || filteredSales.length === 0) {
    return `No sales records found${dishName ? ` for ${dishName}` : ""}.`;
  }

  let groupBy = "none";

  if (monthWiseRequired) {
    groupBy = "month";
  } else if (dateWiseRequired) {
    groupBy = "date";
  }

  const mainAnswer = buildSalesAnswer(title, filteredSales, {
  groupBy,
  includeItems,
});

const reasoning = getRandomReasoning({
  salesCount: filteredSales.length,
  filters: {
    dateRange,
    monthRange,
    paymentMethod,
    dishName,
    groupBy,
  },
});
return `${mainAnswer}

${reasoning}`;
}


export async function getSalesContext(question) {
  return await getSalesAnswer(question);
}

export async function getSalesDishNames() {
  const sales = await getSalesData();

  return [
    ...new Set(
      sales
        .map((sale) => sale.dishName)
        .filter(Boolean)
        .map((dishName) => String(dishName).trim())
    ),
  ];
}

function isValidDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(date || ""));
}

function matchExistingDishName(dishName, sales) {
  if (!dishName) return null;

  const normalizedInput = normalizeText(dishName);

  const foundSale = sales.find((sale) => {
    return normalizeText(sale.dishName) === normalizedInput;
  });

  return foundSale ? String(foundSale.dishName).trim() : null;
}

function getParsedDateTitle(startDate, endDate) {
  if (startDate && endDate && startDate !== endDate) {
    return `from ${startDate} to ${endDate}`;
  }

  if (startDate && endDate && startDate === endDate) {
    return `for ${startDate}`;
  }

  return "";
}

export async function getSalesAnswerFromParsedQuery(parsedQuery, originalQuestion = "") {
  const sales = await getSalesData();
  if (parsedQuery.saleId) {
  const sale = sales.find((sale) => {
    return Number(sale.saleId) === Number(parsedQuery.saleId);
  });

  if (!sale) {
    return `No sales record found for Sale ID ${parsedQuery.saleId}.`;
  }

  return buildSingleSaleAnswer(sale);
}

  if (!parsedQuery || parsedQuery.type !== "sales") {
    return null;
  }

  if (parsedQuery.needsDishName && !parsedQuery.dishName) {
    return "Please mention the product/dish name. Example: Chicken Roll sales from 12 jan to 31 march.";
  }

  let dishName = matchExistingDishName(parsedQuery.dishName, sales);
  if (parsedQuery.unknownDish && parsedQuery.requestedDishName) {
  return `No sales records found for ${parsedQuery.requestedDishName}.`;
}

  if (parsedQuery.dishName && !dishName) {
    return `No sales records found for ${parsedQuery.dishName}.`;
  }

  let startDate = parsedQuery.startDate;
  let endDate = parsedQuery.endDate;

  if (startDate && !endDate) {
    endDate = startDate;
  }

  if (!startDate && endDate) {
    startDate = endDate;
  }

  if (startDate && !isValidDate(startDate)) {
    return "Please provide a valid start date. Example: 2026-01-12.";
  }

  if (endDate && !isValidDate(endDate)) {
    return "Please provide a valid end date. Example: 2026-03-31.";
  }

  if (startDate && endDate && startDate > endDate) {
    const tempDate = startDate;
    startDate = endDate;
    endDate = tempDate;
  }

  let filteredSales = sales;

  if (startDate && endDate) {
    filteredSales = filteredSales.filter((sale) => {
      const saleDate = toDateString(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });
  }

  if (dishName) {
    filteredSales = filterByDishName(filteredSales, dishName);
  }

  if (parsedQuery.paymentMethod) {
    filteredSales = filterByPayment(filteredSales, parsedQuery.paymentMethod);
  }

  if (!filteredSales || filteredSales.length === 0) {
    return `No sales records found${dishName ? ` for ${dishName}` : ""}.`;
  }

  const dateTitle = getParsedDateTitle(startDate, endDate);

  let title = "Sales Record";

  if (dishName) {
    title = `Sales Record for ${dishName}`;
  }

  if (dateTitle) {
    title = `${title} ${dateTitle}`;
  }

  if (parsedQuery.paymentMethod) {
    title = `${title} (${parsedQuery.paymentMethod})`;
  }

  return buildSalesAnswer(title, filteredSales, {
    groupBy: parsedQuery.groupBy || (parsedQuery.groupByDate ? "date" : "none"),
    includeItems: Boolean(parsedQuery.includeItems),
  });
  const reasoning = getRandomReasoning({
  salesCount: filteredSales.length,
  filters: {
    paymentMethod: parsedQuery.paymentMethod,
    dishName,
    groupBy: parsedQuery.groupBy,
  },
});
return `${mainAnswer}

${reasoning}`;
}