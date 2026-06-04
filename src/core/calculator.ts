import type { SimInput, MonthlyResult, TaxSavingResult, YearlyResult, ExitResult, SimResult, StructureType, PropertyType } from "./types";

// 法定耐用年数（国税庁 別表第一）
const LEGAL_USEFUL_LIFE: Record<StructureType, number> = {
  wood: 22,
  lightSteel: 27,
  heavySteel: 34,
  rc: 47,
};

// 物件種別×構造種別の修繕イベント定義
interface RepairEvent {
  type: string;
  cycle: number;      // 修繕サイクル（年）
  costRate: number;   // 物件価格に対する費用率
}

// 区分マンションは建物外部を管理組合が担うため室内・設備のみ
const _mansionUnitEvents: RepairEvent[] = [
  { type: '内装リフォーム', cycle: 10, costRate: 0.020 },
  { type: '設備交換',       cycle: 15, costRate: 0.015 },
];

const REPAIR_EVENTS: Record<PropertyType, Record<StructureType, RepairEvent[]>> = {
  detached: {
    wood: [
      { type: 'シロアリ防除', cycle: 5,  costRate: 0.005 },
      { type: '外壁塗装',     cycle: 10, costRate: 0.035 },
      { type: '屋根修繕',     cycle: 15, costRate: 0.025 },
      { type: '設備更新',     cycle: 20, costRate: 0.025 },
    ],
    lightSteel: [
      { type: '外壁塗装', cycle: 12, costRate: 0.035 },
      { type: '屋根修繕', cycle: 15, costRate: 0.020 },
      { type: '設備更新', cycle: 20, costRate: 0.025 },
    ],
    heavySteel: [
      { type: '外壁塗装', cycle: 15, costRate: 0.030 },
      { type: '設備更新', cycle: 25, costRate: 0.030 },
    ],
    rc: [
      { type: '外壁防水',   cycle: 15, costRate: 0.040 },
      { type: '大規模修繕', cycle: 30, costRate: 0.070 },
    ],
  },
  apartmentWhole: {
    wood: [
      { type: '外壁塗装',       cycle: 10, costRate: 0.040 },
      { type: '屋根・共用修繕', cycle: 15, costRate: 0.035 },
      { type: '設備更新',       cycle: 20, costRate: 0.030 },
    ],
    lightSteel: [
      { type: '外壁塗装', cycle: 12, costRate: 0.040 },
      { type: '設備更新', cycle: 20, costRate: 0.035 },
    ],
    heavySteel: [
      { type: '外壁塗装', cycle: 15, costRate: 0.035 },
      { type: '設備更新', cycle: 25, costRate: 0.040 },
    ],
    rc: [
      { type: '大規模修繕', cycle: 12, costRate: 0.050 },
      { type: '設備更新',   cycle: 25, costRate: 0.035 },
    ],
  },
  // 区分マンション：構造に関わらず室内・設備のみ（外部は管理組合負担）
  mansionUnit: {
    wood:       _mansionUnitEvents,
    lightSteel: _mansionUnitEvents,
    heavySteel: _mansionUnitEvents,
    rc:         _mansionUnitEvents,
  },
};

// 築年数・物件種別・構造から30年分の修繕スケジュールを生成
// 初回修繕タイミングは築年数でオフセット。高築年ほどコスト増（最大1.6倍）
function buildRepairSchedule(input: SimInput): Map<number, { cost: number; type: string }> {
  const { propertyPrice, buildingAge, structureType, propertyType } = input;
  const events = REPAIR_EVENTS[propertyType]?.[structureType] ?? REPAIR_EVENTS.detached.wood;
  const ageFactor = 1 + Math.min(buildingAge, 30) / 30 * 0.6;
  const schedule = new Map<number, { cost: number; type: string }>();

  for (const event of events) {
    const phase = buildingAge % event.cycle;
    const firstYear = phase === 0 ? event.cycle : event.cycle - phase;
    for (let y = firstYear; y <= 30; y += event.cycle) {
      const cost = propertyPrice * event.costRate * ageFactor;
      const existing = schedule.get(y);
      if (existing) {
        schedule.set(y, { cost: existing.cost + cost, type: existing.type + '・' + event.type });
      } else {
        schedule.set(y, { cost, type: event.type });
      }
    }
  }
  return schedule;
}

// 年収（万円）から所得税＋住民税の限界税率（%整数）を概算する
// 給与所得者前提。給与所得控除・社会保険料控除・基礎控除を考慮した簡易計算。
export function calcMarginalTaxRate(annualIncome: number): number {
  let employmentDeduction: number;
  if (annualIncome <= 180) {
    employmentDeduction = Math.max(55, annualIncome * 0.4);
  } else if (annualIncome <= 360) {
    employmentDeduction = annualIncome * 0.3 + 18;
  } else if (annualIncome <= 660) {
    employmentDeduction = annualIncome * 0.2 + 54;
  } else if (annualIncome <= 850) {
    employmentDeduction = annualIncome * 0.1 + 120;
  } else {
    employmentDeduction = 195;
  }
  const employmentIncome = annualIncome - employmentDeduction;
  const socialInsurance = Math.min(150, annualIncome * 0.15);
  const basicDeduction = annualIncome <= 2400 ? 48 : annualIncome <= 2450 ? 32 : annualIncome <= 2500 ? 16 : 0;
  const taxableIncome = Math.max(0, employmentIncome - socialInsurance - basicDeduction);

  let incomeTaxRate: number;
  if (taxableIncome <= 195) incomeTaxRate = 5;
  else if (taxableIncome <= 330) incomeTaxRate = 10;
  else if (taxableIncome <= 695) incomeTaxRate = 20;
  else if (taxableIncome <= 900) incomeTaxRate = 23;
  else if (taxableIncome <= 1800) incomeTaxRate = 33;
  else if (taxableIncome <= 4000) incomeTaxRate = 40;
  else incomeTaxRate = 45;

  return incomeTaxRate + 10; // 住民税10%
}

// 申告種別ごとの青色申告特別控除額
function getFilingDeduction(filingType: SimInput['filingType']): number {
  if (filingType === 'blue65') return 65;
  if (filingType === 'blue10') return 10;
  return 0;
}

// 中古建物の残存耐用年数（簡便法）
function calcRemainingUsefulLife(legalLife: number, buildingAge: number): number {
  const remaining = buildingAge >= legalLife
    ? Math.floor(legalLife * 0.2)
    : Math.floor((legalLife - buildingAge) + buildingAge * 0.2);
  return Math.max(2, remaining);
}

function calcMonthly(input: SimInput): MonthlyResult {
  const {
    propertyPrice, equity, interestRate, loanYears, grossYield, vacancyRate,
    managementFeeRate, propertyTax, insurance, otherExpenseRate, monthlyRepairReserve,
  } = input;

  const loanAmount = propertyPrice - equity;
  const monthlyRate = interestRate / 100 / 12;
  const n = loanYears * 12;

  let monthlyPayment = 0;
  if (loanAmount > 0 && monthlyRate > 0) {
    monthlyPayment = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
  } else if (loanAmount > 0) {
    monthlyPayment = loanAmount / n;
  }

  const monthlyRent = propertyPrice * (grossYield / 100) / 12;
  const effectiveRent = monthlyRent * (1 - vacancyRate / 100);

  const variableExpense = effectiveRent * (managementFeeRate + otherExpenseRate) / 100;
  const fixedExpense = (propertyTax + insurance) / 12;
  const operatingExpense = variableExpense + fixedExpense;

  // 修繕積立金は現金支出だが税控除対象外（実際に修繕した年に控除）
  const monthlyCF = effectiveRent - operatingExpense - monthlyPayment - monthlyRepairReserve;

  return { loanAmount, monthlyPayment, effectiveRent, variableExpense, fixedExpense, operatingExpense, monthlyCF };
}

function calcAnnualInterest(input: SimInput, year: number): number {
  const { propertyPrice, equity, interestRate, loanYears } = input;
  const loanAmount = propertyPrice - equity;
  if (loanAmount <= 0) return 0;
  const monthlyRate = interestRate / 100 / 12;
  const n = loanYears * 12;
  if (monthlyRate === 0) return 0;

  const monthlyPayment = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
  const startMonth = (year - 1) * 12;

  let annualInterest = 0;
  let balance = loanAmount * Math.pow(1 + monthlyRate, startMonth)
    - monthlyPayment * (Math.pow(1 + monthlyRate, startMonth) - 1) / monthlyRate;

  for (let m = 0; m < 12; m++) {
    const interest = balance * monthlyRate;
    annualInterest += interest;
    balance = balance - (monthlyPayment - interest);
    if (balance < 0) break;
  }
  return annualInterest;
}

function calcRemainingLoan(input: SimInput, afterYears: number): number {
  const { propertyPrice, equity, interestRate, loanYears } = input;
  const loanAmount = propertyPrice - equity;
  if (loanAmount <= 0 || afterYears >= loanYears) return 0;
  const monthlyRate = interestRate / 100 / 12;
  const n = loanYears * 12;
  const k = afterYears * 12;
  if (monthlyRate === 0) return loanAmount * (1 - k / n);
  const monthlyPayment = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
  return Math.max(0, monthlyPayment * (1 - Math.pow(1 + monthlyRate, -(n - k))) / monthlyRate);
}

function calcTaxSaving(input: SimInput, monthly: MonthlyResult): TaxSavingResult {
  const { propertyPrice, buildingRatio, buildingAge, structureType, annualIncome, filingType } = input;
  const buildingValue = propertyPrice * (buildingRatio / 100);
  const legalUsefulLife = LEGAL_USEFUL_LIFE[structureType] ?? 22;
  const remainingUsefulLife = calcRemainingUsefulLife(legalUsefulLife, buildingAge);
  const annualDepreciation = buildingValue / remainingUsefulLife;
  const annualInterest = calcAnnualInterest(input, 1);
  const marginalTaxRate = calcMarginalTaxRate(annualIncome);
  const filingDeduction = getFilingDeduction(filingType);

  const annualEffectiveRent = monthly.effectiveRent * 12;
  const annualOperating = monthly.operatingExpense * 12;
  // realEstateIncome は申告控除前の不動産所得
  const realEstateIncome = annualEffectiveRent - annualOperating - annualInterest - annualDepreciation;
  // 申告控除適用後で税効果を計算（マイナス=損失→節税、プラス=利益→税負担増）
  const taxableIncome = realEstateIncome - filingDeduction;
  const annualTaxEffect = -(taxableIncome * marginalTaxRate / 100);

  return { legalUsefulLife, remainingUsefulLife, annualDepreciation, annualInterest, realEstateIncome, filingDeduction, marginalTaxRate, annualTaxEffect };
}

function calcYearly(input: SimInput, monthly: MonthlyResult, taxSaving: TaxSavingResult): YearlyResult[] {
  const { remainingUsefulLife, annualDepreciation } = taxSaving;
  const { rentDeclineRate, filingType, monthlyRepairReserve } = input;
  const repairSchedule = buildRepairSchedule(input);
  const filingDeduction = getFilingDeduction(filingType);
  const marginalTaxRate = calcMarginalTaxRate(input.annualIncome);

  const results: YearlyResult[] = [];
  let cumulativeCF = 0;
  let cumulativeRepair = 0;
  let reserveBalance = 0;

  for (let year = 1; year <= 30; year++) {
    const annualInterest = calcAnnualInterest(input, year);

    // 家賃下落：変動費（管理費等）は賃料連動で下落、固定費（固定資産税等）は変化なし
    const rentMultiplier = Math.pow(1 - rentDeclineRate / 100, year - 1);
    const annualEffectiveRent = monthly.effectiveRent * 12 * rentMultiplier;
    const annualVariableExpense = monthly.variableExpense * 12 * rentMultiplier;
    const annualFixedExpense = monthly.fixedExpense * 12;
    const annualOperating = annualVariableExpense + annualFixedExpense;

    // 減価償却は耐用年数内のみ
    const yearlyDepreciation = year <= remainingUsefulLife ? annualDepreciation : 0;

    // 不動産所得（申告控除前）→ 申告控除適用後で税効果を計算
    const realEstateIncome = annualEffectiveRent - annualOperating - annualInterest - yearlyDepreciation;
    const taxableIncome = realEstateIncome - filingDeduction;
    // 損失(taxableIncome<0)→節税(正)、利益(taxableIncome>0)→税負担増(負)
    const taxEffect = -(taxableIncome * marginalTaxRate / 100);

    // 年次CF = 家賃収入 - 経費 - 返済 - 積立 + 税効果
    const annualCF = annualEffectiveRent - annualOperating
      - monthly.monthlyPayment * 12 - monthlyRepairReserve * 12
      + taxEffect;

    cumulativeCF += annualCF;
    reserveBalance += monthlyRepairReserve * 12;

    // 構造・築年数ベースの修繕スケジュールから費用を取得
    const repairInfo = repairSchedule.get(year);
    let repairCost = 0;
    let repairType = '';
    let repairOutOfPocket = 0;
    if (repairInfo) {
      repairCost = repairInfo.cost;
      repairType = repairInfo.type;
      const drawn = Math.min(reserveBalance, repairCost);
      repairOutOfPocket = repairCost - drawn;
      reserveBalance -= drawn;
    }

    cumulativeRepair += repairOutOfPocket;
    const netCumulativeCF = cumulativeCF - cumulativeRepair;
    const remainingLoan = calcRemainingLoan(input, year);
    results.push({ year, annualCF, cumulativeCF, taxEffect, repairCost, repairType, repairOutOfPocket, reserveBalance, cumulativeRepair, netCumulativeCF, remainingLoan });
  }
  return results;
}

function calcIRR(cashFlows: number[]): number | null {
  const npv = (rate: number) =>
    cashFlows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + rate, t), 0);
  let lo = -0.99, hi = 10.0;
  if (npv(lo) * npv(hi) > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (Math.abs(hi - lo) < 1e-10) return mid * 100;
    if (npv(mid) * npv(lo) <= 0) hi = mid; else lo = mid;
  }
  return ((lo + hi) / 2) * 100;
}

function calcExit(input: SimInput, yearly: YearlyResult[], taxSaving: TaxSavingResult): ExitResult {
  const { propertyPrice, equity, sellYear, acquisitionExpenseRate, saleExpenseRate } = input;
  const { annualDepreciation, remainingUsefulLife } = taxSaving;

  const acquisitionExpense = propertyPrice * acquisitionExpenseRate / 100;
  const estimatedSalePrice = propertyPrice * Math.pow(1 - 0.02, sellYear);
  const saleExpense = estimatedSalePrice * saleExpenseRate / 100;
  const remainingLoan = calcRemainingLoan(input, sellYear);

  // 減価償却累計額：耐用年数内の年数分だけ建物取得費を圧縮する
  const accumulatedDepreciation = annualDepreciation * Math.min(sellYear, remainingUsefulLife);
  // 取得費 = (物件価格 + 取得諸費用) - 減価償却累計額
  const adjustedAcquisitionCost = propertyPrice + acquisitionExpense - accumulatedDepreciation;
  // 譲渡所得 = 売却価格 - 売却費用 - 取得費（減価償却後）
  const capitalGain = estimatedSalePrice - saleExpense - adjustedAcquisitionCost;

  // 短期（5年以下）: 39%、長期（5年超）: 20%
  const holdingType = sellYear > 5 ? 'long' : 'short';
  const capitalGainsTaxRate = holdingType === 'long' ? 20 : 39;
  const capitalGainsTax = capitalGain > 0 ? capitalGain * capitalGainsTaxRate / 100 : 0;

  const yearData = yearly[sellYear - 1] ?? yearly[yearly.length - 1];
  const cumulativeCF = yearData?.netCumulativeCF ?? 0;
  const reserveAtSale = yearData?.reserveBalance ?? 0;

  // 売却手残り＋積立残高回収
  const netSaleProceeds = estimatedSalePrice - remainingLoan - capitalGainsTax - saleExpense + reserveAtSale;

  // トータルリターン = 累積CF + 売却手残り - 初期投資（自己資金 + 取得諸費用）
  const totalReturn = cumulativeCF + netSaleProceeds - equity - acquisitionExpense;

  // IRR: CF[0]=初期投資(負), CF[1..sellYear]=各年の実質CF, CF[sellYear]に売却手残りを加算
  const irrCFs: number[] = [-(equity + acquisitionExpense)];
  for (let yr = 1; yr <= sellYear; yr++) {
    const y = yearly[yr - 1];
    const yearCF = (y.annualCF - y.repairOutOfPocket) + (yr === sellYear ? netSaleProceeds : 0);
    irrCFs.push(yearCF);
  }
  const irr = calcIRR(irrCFs);

  return { sellYear, holdingType, capitalGainsTaxRate, estimatedSalePrice, remainingLoan, acquisitionExpense, saleExpense, accumulatedDepreciation, adjustedAcquisitionCost, capitalGain, capitalGainsTax, reserveAtSale, netSaleProceeds, cumulativeCF, totalReturn, irr };
}

export function simulate(input: SimInput): SimResult {
  const monthly = calcMonthly(input);
  const taxSaving = calcTaxSaving(input, monthly);
  const yearly = calcYearly(input, monthly, taxSaving);
  const exit = calcExit(input, yearly, taxSaving);
  return { monthly, taxSaving, yearly, exit };
}
