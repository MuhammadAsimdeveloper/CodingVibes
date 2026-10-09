import test from 'node:test';
import assert from 'node:assert/strict';
import {getToolContract, listToolContracts, runTool} from '../src/tool-fabric/index.js';

const EXPECTED_TOOLS = [
  'calc.percentage',
  'calc.ratio',
  'calc.discount',
  'calc.profit_margin',
  'calc.roi',
  'calc.break_even',
  'calc.compound_interest',
  'calc.loan',
  'convert.units',
  'time.duration',
  'time.age',
  'time.timezone',
  'data.size.convert',
];

test('P1 calculator, converter and date-time tools expose canonical local-only contracts', () => {
  for (const id of EXPECTED_TOOLS) {
    const contract = getToolContract(id);
    assert.ok(contract, 'missing contract: ' + id);
    assert.equal(contract.executionMode, 'local');
    assert.equal(contract.networkRequired, false);
    assert.equal(contract.authRequired, false);
    assert.equal(contract.status, 'READY');
    assert.deepEqual(contract.inputSchema.type, 'object');
    assert.ok(contract.inputSchema.required.length > 0, id + ' must declare required input');
  }
  assert.equal(listToolContracts({category:'Calculators'}).filter(x => x.id.startsWith('calc.')).length, 8);
  assert.equal(listToolContracts({category:'Conversions'}).filter(x => x.id === 'convert.units').length, 1);
  assert.equal(listToolContracts({category:'Date & Time'}).filter(x => x.id.startsWith('time.')).length, 3);
});

test('percentage, ratio, discount, profit margin, ROI and break-even calculations return deterministic outputs', async () => {
  const percentage = await runTool('calc.percentage', {value:200, percentage:15});
  assert.equal(percentage.status, 'COMPLETED');
  assert.equal(percentage.output.amount, 30);

  const ratio = await runTool('calc.ratio', {left:12, right:18});
  assert.equal(ratio.status, 'COMPLETED');
  assert.equal(ratio.output.ratio, '2:3');
  assert.equal(ratio.output.leftSharePercent, 40);
  assert.equal(ratio.output.rightSharePercent, 60);

  const discount = await runTool('calc.discount', {price:100, discountPercent:20, taxPercent:10});
  assert.equal(discount.status, 'COMPLETED');
  assert.deepEqual({
    discountAmount:discount.output.discountAmount,
    discountedPrice:discount.output.discountedPrice,
    taxAmount:discount.output.taxAmount,
    finalPrice:discount.output.finalPrice
  }, {discountAmount:20, discountedPrice:80, taxAmount:8, finalPrice:88});

  const margin = await runTool('calc.profit_margin', {revenue:200, cost:120});
  assert.equal(margin.status, 'COMPLETED');
  assert.equal(margin.output.profit, 80);
  assert.equal(margin.output.marginPercent, 40);

  const roi = await runTool('calc.roi', {initialInvestment:1000, finalValue:1250});
  assert.equal(roi.status, 'COMPLETED');
  assert.equal(roi.output.gain, 250);
  assert.equal(roi.output.roiPercent, 25);

  const breakEven = await runTool('calc.break_even', {fixedCosts:10000, pricePerUnit:50, variableCostPerUnit:30});
  assert.equal(breakEven.status, 'COMPLETED');
  assert.equal(breakEven.output.contributionMargin, 20);
  assert.equal(breakEven.output.exactUnitsToBreakEven, 500);
  assert.equal(breakEven.output.unitsToBreakEven, 500);
});

test('compound interest and loan tools handle positive interest and zero-interest edge cases', async () => {
  const compound = await runTool('calc.compound_interest', {
    principal:1000, annualRatePercent:5, compoundsPerYear:12, years:1
  });
  assert.equal(compound.status, 'COMPLETED');
  assert.equal(compound.output.finalAmount, 1051.16);
  assert.equal(compound.output.interestEarned, 51.16);

  const zeroInterest = await runTool('calc.loan', {principal:12000, annualRatePercent:0, termMonths:12});
  assert.equal(zeroInterest.status, 'COMPLETED');
  assert.equal(zeroInterest.output.monthlyPayment, 1000);
  assert.equal(zeroInterest.output.totalPayments, 12000);
  assert.equal(zeroInterest.output.totalInterest, 0);

  const amortized = await runTool('calc.loan', {principal:12000, annualRatePercent:12, termMonths:12});
  assert.equal(amortized.status, 'COMPLETED');
  assert.equal(amortized.output.monthlyPayment, 1066.19);
  assert.equal(amortized.output.totalPayments, 12794.28);
});

test('unit, duration, age, time-zone and data-size converters respect their units', async () => {
  const length = await runTool('convert.units', {value:1, fromUnit:'mi', toUnit:'km'});
  assert.equal(length.status, 'COMPLETED');
  assert.equal(length.output.value, 1.609344);
  const temperature = await runTool('convert.units', {value:0, fromUnit:'celsius', toUnit:'fahrenheit'});
  assert.equal(temperature.output.value, 32);

  const duration = await runTool('time.duration', {value:1.5, fromUnit:'hours', toUnit:'minutes'});
  assert.equal(duration.status, 'COMPLETED');
  assert.equal(duration.output.value, 90);

  const age = await runTool('time.age', {birthDate:'2000-02-29', asOfDate:'2025-02-28'});
  assert.equal(age.status, 'COMPLETED');
  assert.equal(age.output.years, 25);
  assert.equal(age.output.daysSinceBirthday, 0);

  const timezone = await runTool('time.timezone', {
    datetime:'2026-01-01T00:00:00Z', fromTimeZone:'UTC', toTimeZone:'Asia/Karachi'
  });
  assert.equal(timezone.status, 'COMPLETED');
  assert.equal(timezone.output.fromLocal, '2026-01-01T00:00:00');
  assert.equal(timezone.output.toLocal, '2026-01-01T05:00:00');
  assert.equal(timezone.output.toOffsetMinutes, 300);

  const size = await runTool('data.size.convert', {value:1, fromUnit:'GiB', toUnit:'bytes'});
  assert.equal(size.status, 'COMPLETED');
  assert.equal(size.output.value, 1073741824);
});

test('calculator tools reject invalid domains, impossible dates and unknown units', async () => {
  assert.equal((await runTool('calc.percentage',{value:'200',percentage:15})).status, 'INVALID_INPUT');
  assert.equal((await runTool('calc.ratio',{left:0,right:0})).status, 'INVALID_INPUT');
  assert.equal((await runTool('calc.discount',{price:10,discountPercent:101})).status, 'INVALID_INPUT');
  assert.equal((await runTool('calc.break_even',{fixedCosts:100,pricePerUnit:20,variableCostPerUnit:20})).status, 'INVALID_INPUT');
  assert.equal((await runTool('calc.loan',{principal:100,annualRatePercent:10,termMonths:0})).status, 'INVALID_INPUT');
  assert.equal((await runTool('convert.units',{value:1,fromUnit:'meters',toUnit:'kilograms'})).status, 'INVALID_INPUT');
  assert.equal((await runTool('time.age',{birthDate:'2025-02-30',asOfDate:'2026-01-01'})).status, 'INVALID_INPUT');
  assert.equal((await runTool('time.age',{birthDate:'2026-01-01',asOfDate:'2025-01-01'})).status, 'INVALID_INPUT');
  assert.equal((await runTool('time.timezone',{datetime:'not-a-date',fromTimeZone:'UTC',toTimeZone:'UTC'})).status, 'INVALID_INPUT');
  assert.equal((await runTool('time.timezone',{datetime:'2026-01-01T00:00:00Z',fromTimeZone:'Not/ATimeZone',toTimeZone:'UTC'})).status, 'INVALID_INPUT');
  assert.equal((await runTool('data.size.convert',{value:1,fromUnit:'GB',toUnit:'parsecs'})).status, 'INVALID_INPUT');
  for (const id of EXPECTED_TOOLS) {
    const result = await runTool(id, {});
    assert.notEqual(result.status, 'COMPLETED', id + ' must validate its required input');
    assert.equal(result.networkUsed, false, id + ' must remain local-only');
  }
});
