export type StructureType = 'wood' | 'lightSteel' | 'heavySteel' | 'rc';
export type HoldingType = 'short' | 'long';
export type PropertyType = 'detached' | 'apartmentWhole' | 'mansionUnit';
export type FilingType = 'blue65' | 'blue10' | 'white';

export interface SimInput {
  propertyType: PropertyType;
  propertyPrice: number;
  equity: number;
  interestRate: number;
  loanYears: number;
  grossYield: number;
  vacancyRate: number;
  rentDeclineRate: number;       // 家賃下落率（%/年）
  // 経費内訳
  managementFeeRate: number;     // 管理委託費率（%）
  propertyTax: number;           // 固定資産税・都市計画税（万円/年）
  insurance: number;             // 火災保険料（万円/年）
  otherExpenseRate: number;      // その他経費率（%）
  // 修繕
  monthlyRepairReserve: number;  // 修繕積立金（万円/月）
  // 取得・売却費用
  acquisitionExpenseRate: number; // 取得諸費用率（%）
  saleExpenseRate: number;        // 売却時諸費用率（%）
  // 税・申告
  annualIncome: number;
  filingType: FilingType;         // 申告種別
  buildingRatio: number;
  buildingAge: number;
  structureType: StructureType;
  sellYear: number;
}

export interface MonthlyResult {
  loanAmount: number;
  monthlyPayment: number;
  effectiveRent: number;
  variableExpense: number;    // 管理費・その他（effectiveRent × rate）
  fixedExpense: number;       // 固定資産税・保険（月割）
  operatingExpense: number;   // variableExpense + fixedExpense（税控除対象合計）
  monthlyCF: number;          // effectiveRent - operatingExpense - payment - reserve
}

export interface TaxSavingResult {
  legalUsefulLife: number;
  remainingUsefulLife: number;
  annualDepreciation: number;
  annualInterest: number;
  realEstateIncome: number;   // 申告控除前の不動産所得
  filingDeduction: number;    // 青色申告特別控除額（65万/10万/0）
  marginalTaxRate: number;
  annualTaxEffect: number;    // 節税額(正) または 税負担増(負)
}

export interface YearlyResult {
  year: number;
  annualCF: number;
  cumulativeCF: number;
  taxEffect: number;           // 当年の節税(正)/税負担増(負)
  repairCost: number;          // 修繕総額
  repairType: string;          // 修繕種別名（修繕なし年は空文字）
  repairOutOfPocket: number;   // 積立で賄えなかった自己負担分
  reserveBalance: number;      // 年末時点の積立残高
  cumulativeRepair: number;    // 累積自己負担修繕費
  netCumulativeCF: number;
  remainingLoan: number;       // 年末時点のローン残高
}

export interface ExitResult {
  sellYear: number;
  holdingType: HoldingType;
  capitalGainsTaxRate: number;     // 39 or 20
  estimatedSalePrice: number;
  remainingLoan: number;
  acquisitionExpense: number;      // 取得時諸費用
  saleExpense: number;             // 売却時諸費用
  accumulatedDepreciation: number; // 減価償却累計額（取得費控除）
  adjustedAcquisitionCost: number; // 減価償却控除後の取得費
  capitalGain: number;
  capitalGainsTax: number;
  reserveAtSale: number;           // 売却時点の積立残高（回収）
  netSaleProceeds: number;
  cumulativeCF: number;
  totalReturn: number;             // 自己資金＋取得諸費用 対比
  irr: number | null;              // 内部収益率（%）
}

export interface SimResult {
  monthly: MonthlyResult;
  taxSaving: TaxSavingResult;
  yearly: YearlyResult[];
  exit: ExitResult;
}
