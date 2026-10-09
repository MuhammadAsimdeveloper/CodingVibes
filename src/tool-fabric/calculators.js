const MAX_MAGNITUDE = 1e12;
const DAY_MS = 86_400_000;

function invalid(message) {
  const error = new Error(message);
  error.status = 'INVALID_INPUT';
  throw error;
}

function number(input, key, options = {}) {
  const value = input[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) invalid(key + ' must be a finite number.');
  const min = options.min ?? -MAX_MAGNITUDE;
  const max = options.max ?? MAX_MAGNITUDE;
  if (value < min || value > max) invalid(key + ' is outside the supported range.');
  if (options.integer && !Number.isInteger(value)) invalid(key + ' must be an integer.');
  return value;
}

function requiredText(input, key, maxLength = 120) {
  if (typeof input[key] !== 'string' || !input[key].trim() || input[key].length > maxLength) {
    invalid(key + ' must be a non-empty string of at most ' + maxLength + ' characters.');
  }
  return input[key].trim();
}

function rounded(value, digits = 6) {
  if (!Number.isFinite(value)) invalid('Calculation exceeded the supported numeric range.');
  const factor = 10 ** digits;
  const result = Math.round((value + Math.sign(value) * Number.EPSILON) * factor) / factor;
  return Object.is(result, -0) ? 0 : result;
}
const money = value => rounded(value, 2);

function percentage(input) {
  const value = number(input, 'value', {max:1e9,min:-1e9});
  const percent = number(input, 'percentage', {max:100000,min:-100000});
  return {value, percentage:percent, amount:money(value * percent / 100)};
}

function gcd(left, right) {
  let a = Math.abs(left), b = Math.abs(right);
  while (b) { const next = a % b; a = b; b = next; }
  return a || 1;
}

function ratio(input) {
  const left = number(input, 'left', {min:Number.MIN_VALUE,max:1e8});
  const right = number(input, 'right', {min:Number.MIN_VALUE,max:1e8});
  const scale = 1_000_000;
  const leftScaled = Math.round(left * scale);
  const rightScaled = Math.round(right * scale);
  if (!leftScaled || !rightScaled || !Number.isSafeInteger(leftScaled) || !Number.isSafeInteger(rightScaled)) {
    invalid('Ratio values must be positive and distinguishable to six decimal places.');
  }
  const divisor = gcd(leftScaled, rightScaled);
  const leftPart = leftScaled / divisor;
  const rightPart = rightScaled / divisor;
  const total = left + right;
  return {
    left, right, ratio:leftPart + ':' + rightPart, leftPart, rightPart,
    leftSharePercent:rounded(left / total * 100, 6),
    rightSharePercent:rounded(right / total * 100, 6),
  };
}

function discount(input) {
  const price = number(input, 'price', {min:0,max:1e12});
  const discountPercent = number(input, 'discountPercent', {min:0,max:100});
  const taxPercent = input.taxPercent === undefined ? 0 : number(input, 'taxPercent', {min:0,max:100});
  const discountAmount = money(price * discountPercent / 100);
  const discountedPrice = money(price - discountAmount);
  const taxAmount = money(discountedPrice * taxPercent / 100);
  return {price,discountPercent,taxPercent,discountAmount,discountedPrice,taxAmount,finalPrice:money(discountedPrice + taxAmount)};
}

function profitMargin(input) {
  const revenue = number(input, 'revenue', {min:Number.MIN_VALUE,max:1e12});
  const cost = number(input, 'cost', {min:0,max:1e12});
  const profit = money(revenue - cost);
  return {revenue,cost,profit,marginPercent:rounded(profit / revenue * 100, 6),isProfitable:profit >= 0};
}

function roi(input) {
  const initialInvestment = number(input, 'initialInvestment', {min:Number.MIN_VALUE,max:1e12});
  const finalValue = number(input, 'finalValue', {min:0,max:1e12});
  const gain = money(finalValue - initialInvestment);
  return {initialInvestment,finalValue,gain,roiPercent:rounded(gain / initialInvestment * 100, 6),isProfitable:gain >= 0};
}

function breakEven(input) {
  const fixedCosts = number(input, 'fixedCosts', {min:0,max:1e12});
  const pricePerUnit = number(input, 'pricePerUnit', {min:0,max:1e9});
  const variableCostPerUnit = number(input, 'variableCostPerUnit', {min:0,max:1e9});
  if (pricePerUnit <= variableCostPerUnit) invalid('Price per unit must be greater than variable cost per unit.');
  const contributionMargin = money(pricePerUnit - variableCostPerUnit);
  const exactUnitsToBreakEven = rounded(fixedCosts / contributionMargin, 6);
  return {fixedCosts,pricePerUnit,variableCostPerUnit,contributionMargin,exactUnitsToBreakEven,unitsToBreakEven:Math.ceil(exactUnitsToBreakEven - 1e-12)};
}

function compoundInterest(input) {
  const principal = number(input, 'principal', {min:0,max:1e12});
  const annualRatePercent = number(input, 'annualRatePercent', {min:0,max:1000});
  const compoundsPerYear = number(input, 'compoundsPerYear', {min:1,max:365,integer:true});
  const years = number(input, 'years', {min:0,max:100});
  const ratePerPeriod = annualRatePercent / 100 / compoundsPerYear;
  const periods = compoundsPerYear * years;
  const finalAmount = principal * (ratePerPeriod === 0 ? 1 : (1 + ratePerPeriod) ** periods);
  if (!Number.isFinite(finalAmount)) invalid('Compound interest result exceeds the supported numeric range.');
  return {principal,annualRatePercent,compoundsPerYear,years,finalAmount:money(finalAmount),interestEarned:money(finalAmount-principal)};
}

function loan(input) {
  const principal = number(input, 'principal', {min:Number.MIN_VALUE,max:1e12});
  const annualRatePercent = number(input, 'annualRatePercent', {min:0,max:1000});
  const termMonths = number(input, 'termMonths', {min:1,max:600,integer:true});
  const monthlyRate = annualRatePercent / 100 / 12;
  const rawPayment = monthlyRate === 0 ? principal / termMonths :
    principal * monthlyRate / (1 - (1 + monthlyRate) ** (-termMonths));
  if (!Number.isFinite(rawPayment)) invalid('Loan payment exceeds the supported numeric range.');
  const monthlyPayment = money(rawPayment);
  const totalPayments = money(monthlyPayment * termMonths);
  return {principal,annualRatePercent,termMonths,monthlyPayment,totalPayments,totalInterest:money(totalPayments-principal)};
}

function normalizeUnit(raw) {
  return String(raw ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '');
}
const UNITS = new Map();
function defineUnit(canonical, category, factor, aliases = []) {
  for (const alias of [canonical,...aliases]) UNITS.set(normalizeUnit(alias),{unit:canonical,category,factor});
}
defineUnit('m','length',1,['meter','meters','metre','metres']);
defineUnit('km','length',1000,['kilometer','kilometers','kilometre','kilometres']);
defineUnit('cm','length',0.01,['centimeter','centimeters','centimetre','centimetres']);
defineUnit('mm','length',0.001,['millimeter','millimeters','millimetre','millimetres']);
defineUnit('in','length',0.0254,['inch','inches']);
defineUnit('ft','length',0.3048,['foot','feet']);
defineUnit('yd','length',0.9144,['yard','yards']);
defineUnit('mi','length',1609.344,['mile','miles']);
defineUnit('kg','mass',1,['kilogram','kilograms']);
defineUnit('g','mass',0.001,['gram','grams']);
defineUnit('mg','mass',0.000001,['milligram','milligrams']);
defineUnit('lb','mass',0.45359237,['lbs','pound','pounds']);
defineUnit('oz','mass',0.028349523125,['ounce','ounces']);
defineUnit('t','mass',1000,['tonne','tonnes','metricton','metrictonne']);
defineUnit('l','volume',1,['liter','liters','litre','litres']);
defineUnit('ml','volume',0.001,['milliliter','milliliters','millilitre','millilitres']);
defineUnit('m3','volume',1000,['cubicmeter','cubicmeters','cubicmetre','cubicmetres']);
defineUnit('gal','volume',3.785411784,['gallon','gallons','usgal','usgallon','usgallons']);
defineUnit('cup','volume',0.2365882365,['cups','uscup','uscups']);
defineUnit('s','time',1,['sec','secs','second','seconds']);
defineUnit('ms','time',0.001,['millisecond','milliseconds']);
defineUnit('min','time',60,['minute','minutes','mins']);
defineUnit('h','time',3600,['hr','hrs','hour','hours']);
defineUnit('day','time',86400,['days']);
defineUnit('week','time',604800,['weeks']);
defineUnit('c','temperature',1,['celsius','centigrade','°c']);
defineUnit('f','temperature',1,['fahrenheit','°f']);
defineUnit('k','temperature',1,['kelvin','°k']);

function toCelsius(value, unit) {
  if (unit === 'c') return value;
  if (unit === 'f') return (value - 32) * 5 / 9;
  return value - 273.15;
}
function fromCelsius(value, unit) {
  if (unit === 'c') return value;
  if (unit === 'f') return value * 9 / 5 + 32;
  return value + 273.15;
}
function units(input) {
  const value = number(input, 'value', {max:1e12,min:-1e12});
  const from = UNITS.get(normalizeUnit(requiredText(input,'fromUnit')));
  const to = UNITS.get(normalizeUnit(requiredText(input,'toUnit')));
  if (!from || !to) invalid('Unsupported unit. Choose a supported length, mass, volume, time or temperature unit.');
  if (from.category !== to.category) invalid('Units must belong to the same measurement category.');
  let converted;
  if (from.category === 'temperature') converted = fromCelsius(toCelsius(value,from.unit),to.unit);
  else converted = value * from.factor / to.factor;
  return {value:rounded(converted,9),fromUnit:from.unit,toUnit:to.unit,category:from.category};
}

function duration(input) {
  const value = number(input, 'value', {max:1e12,min:-1e12});
  const from = UNITS.get(normalizeUnit(requiredText(input,'fromUnit')));
  const to = UNITS.get(normalizeUnit(requiredText(input,'toUnit')));
  if (!from || !to || from.category !== 'time' || to.category !== 'time') {
    invalid('Duration conversion supports only time units: ms, s, min, h, day and week.');
  }
  return {value:rounded(value * from.factor / to.factor,9),fromUnit:from.unit,toUnit:to.unit};
}

function parseDate(raw, name) {
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) invalid(name + ' must use YYYY-MM-DD.');
  const [year,month,day] = raw.split('-').map(Number);
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) invalid(name + ' is not a valid calendar date.');
  const timestamp = Date.UTC(year,month-1,day);
  const date = new Date(timestamp);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month-1 || date.getUTCDate() !== day) invalid(name + ' is not a valid calendar date.');
  return {year,month,day,timestamp};
}
function birthdayInYear(birth, year) {
  const day = Math.min(birth.day,new Date(Date.UTC(year,birth.month,0)).getUTCDate());
  return Date.UTC(year,birth.month-1,day);
}
function age(input) {
  const birth = parseDate(requiredText(input,'birthDate',10),'birthDate');
  const asOf = parseDate(input.asOfDate === undefined ? new Date().toISOString().slice(0,10) : requiredText(input,'asOfDate',10),'asOfDate');
  if (asOf.timestamp < birth.timestamp) invalid('asOfDate cannot be earlier than birthDate.');
  let years = asOf.year - birth.year;
  let lastBirthday = birthdayInYear(birth,asOf.year);
  if (asOf.timestamp < lastBirthday) {
    years--;
    lastBirthday = birthdayInYear(birth,asOf.year-1);
  }
  return {birthDate:input.birthDate,asOfDate:input.asOfDate ?? new Date(asOf.timestamp).toISOString().slice(0,10),years,daysSinceBirthday:Math.floor((asOf.timestamp-lastBirthday)/DAY_MS),totalDays:Math.floor((asOf.timestamp-birth.timestamp)/DAY_MS)};
}

function timezoneLocalParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA',{
    timeZone,year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type,part.value]));
  return parts.year + '-' + parts.month + '-' + parts.day + 'T' + parts.hour + ':' + parts.minute + ':' + parts.second;
}
function zoneOffsetMinutes(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US',{timeZone,timeZoneName:'longOffset',hour:'2-digit',hourCycle:'h23'});
  const value = formatter.formatToParts(date).find(part => part.type === 'timeZoneName')?.value || 'GMT';
  if (value === 'GMT' || value === 'UTC') return 0;
  const match = value.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) invalid('Could not resolve the time-zone offset.');
  const minutes = Number(match[2]) * 60 + Number(match[3] || 0);
  return match[1] === '-' ? -minutes : minutes;
}
function timezone(input) {
  const rawDateTime = requiredText(input,'datetime',64);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(rawDateTime)) {
    invalid('datetime must be ISO 8601 and include Z or an explicit UTC offset.');
  }
  const date = new Date(rawDateTime);
  if (!Number.isFinite(date.getTime())) invalid('datetime is not a valid timestamp.');
  const fromTimeZone = requiredText(input,'fromTimeZone',100);
  const toTimeZone = requiredText(input,'toTimeZone',100);
  try {
    return {
      instantUtc:date.toISOString(),
      fromTimeZone,
      toTimeZone,
      fromLocal:timezoneLocalParts(date,fromTimeZone),
      toLocal:timezoneLocalParts(date,toTimeZone),
      fromOffsetMinutes:zoneOffsetMinutes(date,fromTimeZone),
      toOffsetMinutes:zoneOffsetMinutes(date,toTimeZone),
    };
  } catch (error) {
    if (error.status) throw error;
    invalid('fromTimeZone and toTimeZone must be valid IANA time-zone identifiers.');
  }
}

const SIZE_UNITS = new Map();
function defineSize(unit, factor, aliases = []) {
  for (const alias of [unit,...aliases]) SIZE_UNITS.set(normalizeUnit(alias),{unit,factor});
}
defineSize('B',1,['byte','bytes']);
defineSize('KB',1e3,['kilobyte','kilobytes']);
defineSize('MB',1e6,['megabyte','megabytes']);
defineSize('GB',1e9,['gigabyte','gigabytes']);
defineSize('TB',1e12,['terabyte','terabytes']);
defineSize('PB',1e15,['petabyte','petabytes']);
defineSize('KiB',1024,['kibibyte','kibibytes']);
defineSize('MiB',1024**2,['mebibyte','mebibytes']);
defineSize('GiB',1024**3,['gibibyte','gibibytes']);
defineSize('TiB',1024**4,['tebibyte','tebibytes']);
defineSize('PiB',1024**5,['pebibyte','pebibytes']);
function dataSize(input) {
  const value = number(input,'value',{min:0,max:9_007_199_254_740_991});
  const from = SIZE_UNITS.get(normalizeUnit(requiredText(input,'fromUnit')));
  const to = SIZE_UNITS.get(normalizeUnit(requiredText(input,'toUnit')));
  if (!from || !to) invalid('Unsupported data-size unit. Use B/KB/MB/GB/TB/PB or KiB/MiB/GiB/TiB/PiB.');
  const bytes = value * from.factor;
  if (!Number.isFinite(bytes) || bytes > Number.MAX_SAFE_INTEGER) invalid('Converted byte count exceeds the exact integer range.');
  return {value:rounded(bytes / to.factor,9),fromUnit:from.unit,toUnit:to.unit,bytes:rounded(bytes,0)};
}

export function runCalculatorTool(id, input = {}) {
  switch (id) {
    case 'calc.percentage': return percentage(input);
    case 'calc.ratio': return ratio(input);
    case 'calc.discount': return discount(input);
    case 'calc.profit_margin': return profitMargin(input);
    case 'calc.roi': return roi(input);
    case 'calc.break_even': return breakEven(input);
    case 'calc.compound_interest': return compoundInterest(input);
    case 'calc.loan': return loan(input);
    case 'convert.units': return units(input);
    case 'time.duration': return duration(input);
    case 'time.age': return age(input);
    case 'time.timezone': return timezone(input);
    case 'data.size.convert': return dataSize(input);
    default: invalid('No calculator/converter executor is registered for this id.');
  }
}
