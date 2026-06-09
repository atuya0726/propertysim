import { Hono } from "hono";
import { html, raw } from "hono/html";
import { simulate } from "./core/calculator";
import type { SimInput, SimResult, PropertyType, FilingType } from "./core/types";

const app = new Hono();

const DEFAULT_INPUT: SimInput = {
  propertyType: 'detached' as PropertyType,
  propertyPrice: 2500,
  equity: 500,
  interestRate: 2.0,
  loanYears: 25,
  grossYield: 7.0,
  vacancyRate: 10,
  rentDeclineRate: 1.0,
  managementFeeRate: 5,
  propertyTax: 10,
  insurance: 3,
  otherExpenseRate: 3,
  monthlyRepairReserve: 1.5,
  acquisitionExpenseRate: 7,
  saleExpenseRate: 4,
  annualIncome: 700,
  filingType: 'blue10' as FilingType,
  buildingRatio: 60,
  buildingAge: 15,
  structureType: 'wood',
  sellYear: 10,
};

app.get("/", (c) => {
  const input: SimInput = { ...DEFAULT_INPUT };
  const q = c.req.query();

  for (const key of [
    'propertyPrice', 'equity', 'interestRate', 'loanYears', 'grossYield',
    'vacancyRate', 'rentDeclineRate', 'managementFeeRate', 'propertyTax', 'insurance',
    'otherExpenseRate', 'monthlyRepairReserve', 'acquisitionExpenseRate', 'saleExpenseRate',
    'annualIncome', 'buildingRatio', 'buildingAge', 'sellYear',
  ] as const) {
    const raw = q[key];
    if (raw !== undefined) {
      const v = Number(raw);
      if (!isNaN(v)) input[key] = v;
    }
  }
  if (q.propertyType === 'detached' || q.propertyType === 'apartmentWhole' || q.propertyType === 'mansionUnit') {
    input.propertyType = q.propertyType;
  }
  if (q.filingType === 'blue65' || q.filingType === 'blue10' || q.filingType === 'white') {
    input.filingType = q.filingType;
  }
  if (q.structureType === 'wood' || q.structureType === 'lightSteel' || q.structureType === 'heavySteel' || q.structureType === 'rc') {
    input.structureType = q.structureType;
  }

  const result: SimResult = simulate(input);

  const defaultJson = JSON.stringify(DEFAULT_INPUT);
  const inputJson = JSON.stringify(input);
  const resultJson = JSON.stringify(result);

  return c.html(html`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>不動産投資シミュレーター｜収支・節税・売却を無料で試算</title>
  <meta name="description" content="物件価格・金利・利回り・築年数などを入力するだけで、月次キャッシュフロー・節税効果・売却時の譲渡税まで即時にシミュレーション。不動産投資の収支計画を無料で試算できます。" />
  <meta name="keywords" content="不動産投資,シミュレーション,シミュレーター,収支計算,キャッシュフロー,節税,減価償却,利回り,投資用不動産,アパート経営" />
  <meta property="og:title" content="不動産投資シミュレーター｜収支・節税・売却を無料で試算" />
  <meta property="og:description" content="物件価格・金利・利回りを入力するだけで月次CF・節税額・IRRを即時試算。不動産投資の収支計画を無料でシミュレーション。" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="不動産投資シミュレーター" />
  <meta name="twitter:description" content="月次CF・節税・売却まで無料で試算できる不動産投資シミュレーター。" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://cdn.jsdelivr.net" />
  <link rel="stylesheet" href="/assets/style.css" />
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "不動産投資シミュレーター",
    "description": "物件価格・金利・利回り・築年数などを入力するだけで、月次キャッシュフロー・節税効果・売却時の譲渡税まで即時にシミュレーションできる無料ツールです。",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "All",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
    "inLanguage": "ja"
  }
  </script>
  <script defer src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
  <script defer src="/assets/client.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3/dist/cdn.min.js"></script>
  <style>
    [x-cloak] { display: none !important; }
    * { font-variant-numeric: tabular-nums; }
    body {
      background: #f8fafc;
      color: #0f172a;
      font-family: system-ui, -apple-system, 'Helvetica Neue', sans-serif;
    }

    input[type=range] {
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      height: 3px;
      background: #e2e8f0;
      border-radius: 999px;
      outline: none;
      cursor: pointer;
    }
    input[type=range]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 15px; height: 15px;
      border-radius: 50%;
      background: #1e293b;
      cursor: pointer;
      transition: transform 0.1s, box-shadow 0.1s;
    }
    input[type=range]::-webkit-slider-thumb:hover {
      transform: scale(1.2);
      box-shadow: 0 0 0 4px rgba(30,41,59,0.12);
    }
    input[type=range]::-moz-range-thumb {
      width: 15px; height: 15px;
      border-radius: 50%;
      background: #1e293b;
      border: none;
      cursor: pointer;
    }

    .ni {
      width: 5rem; text-align: right;
      font-size: 0.8125rem; font-weight: 600; color: #0f172a;
      background: transparent;
      border: none; border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 2px; outline: none;
      transition: border-color 0.15s;
    }
    .ni:focus { border-color: #1e293b; }
    .ni-lg { width: 6rem; }

    .sel {
      width: 100%; padding: 0.45rem 0.75rem;
      background: #fff; color: #0f172a;
      border: 1px solid #e2e8f0; border-radius: 0.5rem;
      font-size: 0.8125rem; outline: none; cursor: pointer;
      transition: border-color 0.15s;
    }
    .sel:focus { border-color: #1e293b; }

    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button { opacity: 0.3; }

    .badge-ok {
      display: inline-block; padding: 1px 8px; border-radius: 999px;
      font-size: 0.625rem; font-weight: 600; letter-spacing: 0.03em;
      background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46;
    }
    .badge-warn {
      display: inline-block; padding: 1px 8px; border-radius: 999px;
      font-size: 0.625rem; font-weight: 600; letter-spacing: 0.03em;
      background: #fff1f2; border: 1px solid #fecdd3; color: #be123c;
    }
  </style>
</head>
<body x-data="simApp()">

<main class="max-w-7xl mx-auto px-6 py-10">

  <div class="mb-8">
    <h1 class="text-xl font-bold tracking-tight text-slate-900">不動産投資シミュレーター</h1>
    <p class="text-sm text-slate-500 mt-1">数値を調整すると結果がリアルタイムに更新されます</p>
    <p class="text-xs text-slate-500 mt-1.5">表示される数値はすべて概算です。実際の収支・税額は物件・税制・市場環境により異なります。投資判断は専門家にご確認ください。</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

    <!-- ════ 入力パネル ════ -->
    <div class="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">

      <div class="flex items-center gap-3">
        <span class="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-500 whitespace-nowrap">物件・ローン条件</span>
        <div class="flex-1 h-px bg-slate-100" aria-hidden="true"></div>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="propertyPrice" class="text-xs text-slate-500">物件価格</label>
          <div class="flex items-center gap-1.5">
            <input id="propertyPrice" type="number" step="100" x-model.number="inp.propertyPrice" @change="update()" class="ni ni-lg" />
            <span class="text-xs text-slate-500 w-6">万円</span>
          </div>
        </div>
        <input type="range" min="500" max="10000" step="100" x-model.number="inp.propertyPrice" @input="update()" aria-label="物件価格" />
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="equity" class="text-xs text-slate-500">自己資金（頭金）</label>
          <div class="flex items-center gap-1.5">
            <input id="equity" type="number" step="50" x-model.number="inp.equity" @change="update()" class="ni ni-lg" />
            <span class="text-xs text-slate-500 w-6">万円</span>
          </div>
        </div>
        <input type="range" min="0" max="3000" step="50" x-model.number="inp.equity" @input="update()" aria-label="自己資金（頭金）" />
        <p class="text-[11px] text-slate-500 text-right">初期投資総額 <span class="font-semibold text-slate-600" x-text="(inp.equity + inp.propertyPrice * inp.acquisitionExpenseRate / 100).toFixed(0)"></span> 万円</p>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="acquisitionExpenseRate" class="text-xs text-slate-500">取得諸費用率</label>
          <div class="flex items-center gap-1.5">
            <input id="acquisitionExpenseRate" type="number" step="0.5" min="0" x-model.number="inp.acquisitionExpenseRate" @change="update()" class="ni" />
            <span class="text-xs text-slate-500 w-4">%</span>
          </div>
        </div>
        <input type="range" min="3" max="12" step="0.5" x-model.number="inp.acquisitionExpenseRate" @input="update()" aria-label="取得諸費用率" />
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="interestRate" class="text-xs text-slate-500">金利</label>
          <div class="flex items-center gap-1.5">
            <input id="interestRate" type="number" step="0.05" min="0.1" max="10" x-model.number="inp.interestRate" @change="update()" class="ni" />
            <span class="text-xs text-slate-500 w-4">%</span>
          </div>
        </div>
        <input type="range" min="0.1" max="5.0" step="0.05" x-model.number="inp.interestRate" @input="update()" aria-label="金利" />
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="loanYears" class="text-xs text-slate-500">借入期間</label>
          <div class="flex items-center gap-1.5">
            <input id="loanYears" type="number" step="1" min="1" max="50" x-model.number="inp.loanYears" @change="update()" class="ni" />
            <span class="text-xs text-slate-500 w-4">年</span>
          </div>
        </div>
        <input type="range" min="1" max="35" step="1" x-model.number="inp.loanYears" @input="update()" aria-label="借入期間" />
      </div>

      <div class="flex items-center gap-3 pt-1">
        <span class="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-500 whitespace-nowrap">賃料・収支条件</span>
        <div class="flex-1 h-px bg-slate-100" aria-hidden="true"></div>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="grossYield" class="text-xs text-slate-500">表面利回り</label>
          <div class="flex items-center gap-1.5">
            <input id="grossYield" type="number" step="0.1" min="0.1" max="50" x-model.number="inp.grossYield" @change="update()" class="ni" />
            <span class="text-xs text-slate-500 w-4">%</span>
          </div>
        </div>
        <input type="range" min="1" max="20" step="0.1" x-model.number="inp.grossYield" @input="update()" aria-label="表面利回り" />
        <p class="text-[11px] text-slate-500 text-right">月額家賃 <span class="font-semibold text-slate-600" x-text="(inp.propertyPrice * inp.grossYield / 100 / 12).toFixed(2)"></span> 万円</p>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="vacancyRate" class="text-xs text-slate-500">空室率</label>
          <div class="flex items-center gap-1.5">
            <input id="vacancyRate" type="number" step="1" min="0" max="100" x-model.number="inp.vacancyRate" @change="update()" class="ni" />
            <span class="text-xs text-slate-500 w-4">%</span>
          </div>
        </div>
        <input type="range" min="0" max="30" step="1" x-model.number="inp.vacancyRate" @input="update()" aria-label="空室率" />
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="rentDeclineRate" class="text-xs text-slate-500">家賃下落率</label>
          <div class="flex items-center gap-1.5">
            <input id="rentDeclineRate" type="number" step="0.1" min="0" max="10" x-model.number="inp.rentDeclineRate" @change="update()" class="ni" />
            <span class="text-xs text-slate-500 w-8">%/年</span>
          </div>
        </div>
        <input type="range" min="0" max="3" step="0.1" x-model.number="inp.rentDeclineRate" @input="update()" aria-label="家賃下落率" />
        <p class="text-[11px] text-slate-500 text-right">
          <span x-text="inp.sellYear"></span>年後 <span class="font-semibold text-slate-600" x-text="(inp.propertyPrice * inp.grossYield / 100 / 12 * (1 - inp.vacancyRate / 100) * Math.pow(1 - inp.rentDeclineRate / 100, inp.sellYear)).toFixed(2)"></span> 万円/月
        </p>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="managementFeeRate" class="text-xs text-slate-500">管理委託費率</label>
          <div class="flex items-center gap-1.5">
            <input id="managementFeeRate" type="number" step="0.5" min="0" max="30" x-model.number="inp.managementFeeRate" @change="update()" class="ni" />
            <span class="text-xs text-slate-500 w-4">%</span>
          </div>
        </div>
        <input type="range" min="0" max="15" step="0.5" x-model.number="inp.managementFeeRate" @input="update()" aria-label="管理委託費率" />
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="propertyTax" class="text-xs text-slate-500">固定資産税・都市計画税</label>
          <div class="flex items-center gap-1.5">
            <input id="propertyTax" type="number" step="1" min="0" x-model.number="inp.propertyTax" @change="update()" class="ni" />
            <span class="text-xs text-slate-500 w-8">万/年</span>
          </div>
        </div>
        <input type="range" min="0" max="50" step="1" x-model.number="inp.propertyTax" @input="update()" aria-label="固定資産税・都市計画税" />
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="insurance" class="text-xs text-slate-500">火災保険料</label>
          <div class="flex items-center gap-1.5">
            <input id="insurance" type="number" step="0.5" min="0" x-model.number="inp.insurance" @change="update()" class="ni" />
            <span class="text-xs text-slate-500 w-8">万/年</span>
          </div>
        </div>
        <input type="range" min="0" max="20" step="0.5" x-model.number="inp.insurance" @input="update()" aria-label="火災保険料" />
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="otherExpenseRate" class="text-xs text-slate-500">その他経費率</label>
          <div class="flex items-center gap-1.5">
            <input id="otherExpenseRate" type="number" step="0.5" min="0" max="30" x-model.number="inp.otherExpenseRate" @change="update()" class="ni" />
            <span class="text-xs text-slate-500 w-4">%</span>
          </div>
        </div>
        <input type="range" min="0" max="15" step="0.5" x-model.number="inp.otherExpenseRate" @input="update()" aria-label="その他経費率" />
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="monthlyRepairReserve" class="text-xs text-slate-500">修繕積立金</label>
          <div class="flex items-center gap-1.5">
            <input id="monthlyRepairReserve" type="number" step="0.1" min="0" max="20" x-model.number="inp.monthlyRepairReserve" @change="update()" class="ni" />
            <span class="text-xs text-slate-500 w-8">万/月</span>
          </div>
        </div>
        <input type="range" min="0" max="5" step="0.1" x-model.number="inp.monthlyRepairReserve" @input="update()" aria-label="修繕積立金" />
        <p class="text-[11px] text-slate-500 text-right">修繕発生時に積立残高から充当（税控除対象外）</p>
      </div>

      <div class="flex items-center gap-3 pt-1">
        <span class="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-500 whitespace-nowrap">税・申告・出口条件</span>
        <div class="flex-1 h-px bg-slate-100" aria-hidden="true"></div>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="annualIncome" class="text-xs text-slate-500">年収（給与所得者）</label>
          <div class="flex items-center gap-1.5">
            <input id="annualIncome" type="number" step="100" min="100" x-model.number="inp.annualIncome" @change="update()" class="ni ni-lg" />
            <span class="text-xs text-slate-500 w-6">万円</span>
          </div>
        </div>
        <input type="range" min="200" max="3000" step="100" x-model.number="inp.annualIncome" @input="update()" aria-label="年収（給与所得者）" />
        <p class="text-[11px] text-slate-500 text-right">
          限界税率 <span class="font-semibold text-slate-600" x-text="res.taxSaving.marginalTaxRate"></span>%
          <span class="text-slate-400 mx-1">·</span>所得税 <span x-text="res.taxSaving.marginalTaxRate - 10"></span>% + 住民税 10%
        </p>
      </div>

      <div class="space-y-2">
        <label for="filingType" class="text-xs text-slate-500 block">申告種別</label>
        <select id="filingType" x-model="inp.filingType" @change="update()" class="sel">
          <option value="blue65">青色申告（65万円控除）</option>
          <option value="blue10">青色申告（10万円控除）</option>
          <option value="white">白色申告</option>
        </select>
        <p x-show="inp.filingType === 'blue65'" class="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          e-Tax 電子申告、または事業的規模（5棟10室以上）が要件
        </p>
        <p x-show="inp.filingType === 'blue10'" class="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          青色申告承認申請書を事前に提出していることが要件
        </p>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="buildingRatio" class="text-xs text-slate-500">建物割合（減価償却用）</label>
          <div class="flex items-center gap-1.5">
            <input id="buildingRatio" type="number" step="5" min="0" max="100" x-model.number="inp.buildingRatio" @change="update()" class="ni" />
            <span class="text-xs text-slate-500 w-4">%</span>
          </div>
        </div>
        <input type="range" min="20" max="90" step="5" x-model.number="inp.buildingRatio" @input="update()" aria-label="建物割合（減価償却用）" />
      </div>

      <div class="space-y-2">
        <label for="propertyType" class="text-xs text-slate-500 block">物件種別</label>
        <select id="propertyType" x-model="inp.propertyType" @change="update()" class="sel">
          <option value="detached">戸建て</option>
          <option value="apartmentWhole">一棟アパート・マンション</option>
          <option value="mansionUnit">区分マンション</option>
        </select>
        <p x-show="inp.propertyType === 'mansionUnit'" class="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          建物外部修繕は管理組合負担のため、室内・設備交換のみを計上
        </p>
      </div>

      <div class="space-y-2">
        <label for="structureType" class="text-xs text-slate-500 block">構造種別</label>
        <select id="structureType" x-model="inp.structureType" @change="update()" class="sel">
          <option value="wood">木造（法定22年）</option>
          <option value="lightSteel">軽量鉄骨造（法定27年）</option>
          <option value="heavySteel">重量鉄骨造（法定34年）</option>
          <option value="rc">RC・SRC造（法定47年）</option>
        </select>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="buildingAge" class="text-xs text-slate-500">築年数（購入時）</label>
          <div class="flex items-center gap-1.5">
            <input id="buildingAge" type="number" step="1" min="0" max="100" x-model.number="inp.buildingAge" @change="update()" class="ni" />
            <span class="text-xs text-slate-500 w-4">年</span>
          </div>
        </div>
        <input type="range" min="0" max="50" step="1" x-model.number="inp.buildingAge" @input="update()" aria-label="築年数（購入時）" />
        <p class="text-[11px] text-slate-500 text-right">残存耐用年数 <span class="font-semibold text-slate-600" x-text="res.taxSaving.remainingUsefulLife"></span> 年</p>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="sellYear" class="text-xs text-slate-500">売却想定年</label>
          <div class="flex items-center gap-1.5">
            <input id="sellYear" type="number" step="1" min="1" max="50" x-model.number="inp.sellYear" @change="update()" class="ni" />
            <span class="text-xs text-slate-500 w-8">年後</span>
          </div>
        </div>
        <input type="range" min="1" max="30" step="1" x-model.number="inp.sellYear" @input="update()" aria-label="売却想定年" />
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label for="saleExpenseRate" class="text-xs text-slate-500">売却時諸費用率</label>
          <div class="flex items-center gap-1.5">
            <input id="saleExpenseRate" type="number" step="0.5" min="0" x-model.number="inp.saleExpenseRate" @change="update()" class="ni" />
            <span class="text-xs text-slate-500 w-4">%</span>
          </div>
        </div>
        <input type="range" min="2" max="8" step="0.5" x-model.number="inp.saleExpenseRate" @input="update()" aria-label="売却時諸費用率" />
        <p class="text-[11px] text-slate-500 text-right">仲介手数料3%+消費税+諸費用の目安</p>
      </div>

    </div>
    <!-- /入力パネル -->

    <!-- ════ 結果パネル ════ -->
    <div class="lg:col-span-2 space-y-4">

      <!-- KPI 5枚 -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div class="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">月次CF</div>
          <div class="text-2xl font-bold leading-none" :class="res.monthly.monthlyCF >= 0 ? 'text-emerald-700' : 'text-rose-600'">
            <span x-text="(res.monthly.monthlyCF >= 0 ? '+' : '') + res.monthly.monthlyCF.toFixed(2)"></span>
          </div>
          <div class="text-[11px] text-slate-500 mt-2">万円 / 初年度</div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div class="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3" x-text="res.taxSaving.annualTaxEffect >= 0 ? '年間節税額' : '年間税負担増'"></div>
          <div class="text-2xl font-bold leading-none" :class="res.taxSaving.annualTaxEffect >= 0 ? 'text-sky-700' : 'text-amber-700'">
            <span x-text="(res.taxSaving.annualTaxEffect >= 0 ? '+' : '') + res.taxSaving.annualTaxEffect.toFixed(1)"></span>
          </div>
          <div class="text-[11px] text-slate-500 mt-2">万円 / 初年度</div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div class="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">実質利回り</div>
          <div class="text-2xl font-bold leading-none text-slate-800">
            <span x-text="(inp.propertyPrice > 0 ? ((res.monthly.effectiveRent - res.monthly.operatingExpense) * 12 / inp.propertyPrice * 100).toFixed(2) : '0.00')"></span>
          </div>
          <div class="text-[11px] text-slate-500 mt-2">% / 初年度</div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div class="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3"><span x-text="inp.sellYear + '年後'"></span> 総収益</div>
          <div class="text-2xl font-bold leading-none" :class="res.exit.totalReturn >= 0 ? 'text-emerald-700' : 'text-rose-600'">
            <span x-text="(res.exit.totalReturn >= 0 ? '+' : '') + res.exit.totalReturn.toFixed(1)"></span>
          </div>
          <div class="text-[11px] text-slate-500 mt-2">万円 累積CF＋売却手残</div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div class="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">IRR</div>
          <div class="text-2xl font-bold leading-none" :class="res.exit.irr === null ? 'text-slate-300' : res.exit.irr >= 0 ? 'text-emerald-700' : 'text-rose-600'">
            <span x-text="res.exit.irr === null ? '−' : (res.exit.irr >= 0 ? '+' : '') + res.exit.irr.toFixed(1) + '%'"></span>
          </div>
          <div class="text-[11px] text-slate-500 mt-2">内部収益率</div>
        </div>

      </div>

      <!-- ブレークダウン 3列 -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        <!-- 月次収支内訳 -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div class="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-4">月次収支内訳（初年度）</div>

          <div class="text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase mb-1.5">収入</div>
          <dl class="space-y-1.5 text-sm mb-3">
            <div class="flex justify-between items-baseline">
              <dt class="text-slate-500">表面家賃収入</dt>
              <dd class="font-semibold text-slate-600">+<span x-text="(inp.propertyPrice * inp.grossYield / 100 / 12).toFixed(2)"></span> 万円</dd>
            </div>
            <div class="flex justify-between items-baseline pl-3">
              <dt class="text-xs text-slate-500">└ 空室控除（<span x-text="inp.vacancyRate"></span>%）</dt>
              <dd class="text-xs text-rose-600">−<span x-text="(inp.propertyPrice * inp.grossYield / 100 / 12 * inp.vacancyRate / 100).toFixed(2)"></span> 万円</dd>
            </div>
            <div class="flex justify-between items-baseline border-t border-slate-50 pt-1.5">
              <dt class="text-slate-600 font-medium">実質家賃収入</dt>
              <dd class="font-semibold text-emerald-700">+<span x-text="res.monthly.effectiveRent.toFixed(2)"></span> 万円</dd>
            </div>
          </dl>

          <div class="text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase mb-1.5">支出</div>
          <dl class="space-y-1.5 text-sm mb-3">
            <div class="flex justify-between items-baseline">
              <dt class="text-slate-500">ローン返済</dt>
              <dd class="font-semibold text-rose-600">−<span x-text="res.monthly.monthlyPayment.toFixed(2)"></span> 万円</dd>
            </div>
            <div class="flex justify-between items-baseline">
              <dt class="text-slate-500">管理費・その他</dt>
              <dd class="font-semibold text-rose-600">−<span x-text="res.monthly.variableExpense.toFixed(2)"></span> 万円</dd>
            </div>
            <div class="flex justify-between items-baseline">
              <dt class="text-slate-500">固定資産税・保険</dt>
              <dd class="font-semibold text-rose-600">−<span x-text="res.monthly.fixedExpense.toFixed(2)"></span> 万円</dd>
            </div>
            <div class="flex justify-between items-baseline">
              <dt class="text-slate-500">修繕積立金</dt>
              <dd class="font-semibold text-rose-600">−<span x-text="inp.monthlyRepairReserve.toFixed(2)"></span> 万円</dd>
            </div>
          </dl>

          <div class="flex justify-between items-baseline border-t border-slate-200 pt-3">
            <span class="font-semibold text-slate-700">月次CF</span>
            <span class="font-bold text-base" :class="res.monthly.monthlyCF >= 0 ? 'text-emerald-700' : 'text-rose-600'">
              <span x-text="(res.monthly.monthlyCF >= 0 ? '+' : '') + res.monthly.monthlyCF.toFixed(2)"></span> 万円
            </span>
          </div>
          <p class="text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-50">借入額 <span class="font-semibold text-slate-600" x-text="res.monthly.loanAmount.toLocaleString()"></span> 万円</p>
        </div>

        <!-- 節税内訳 -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div class="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-4">節税内訳（初年度）</div>
          <dl class="space-y-2.5 text-sm">
            <div class="flex justify-between items-baseline">
              <dt class="text-slate-500">法定 / 残存耐用年数</dt>
              <dd class="font-semibold text-slate-700"><span x-text="res.taxSaving.legalUsefulLife"></span> 年 / <span class="text-sky-700" x-text="res.taxSaving.remainingUsefulLife"></span> 年</dd>
            </div>
            <div class="flex justify-between items-baseline">
              <dt class="text-slate-500">年間減価償却費</dt>
              <dd class="font-semibold text-slate-700"><span x-text="res.taxSaving.annualDepreciation.toFixed(1)"></span> 万円</dd>
            </div>
            <div class="flex justify-between items-baseline">
              <dt class="text-slate-500">年間利息（初年）</dt>
              <dd class="font-semibold text-slate-700"><span x-text="res.taxSaving.annualInterest.toFixed(1)"></span> 万円</dd>
            </div>
            <div class="flex justify-between items-baseline">
              <dt class="text-slate-500">不動産所得（初年）</dt>
              <dd class="font-semibold" :class="res.taxSaving.realEstateIncome < 0 ? 'text-emerald-700' : 'text-slate-700'">
                <span x-text="res.taxSaving.realEstateIncome.toFixed(1)"></span> 万円
              </dd>
            </div>
            <div class="flex justify-between items-baseline pl-3" x-show="res.taxSaving.filingDeduction > 0">
              <dt class="text-xs text-slate-500">└ 申告特別控除</dt>
              <dd class="text-xs text-sky-700">−<span x-text="res.taxSaving.filingDeduction"></span> 万円</dd>
            </div>
            <div class="flex justify-between items-baseline border-t border-slate-100 pt-2.5">
              <dt class="font-semibold text-slate-700" x-text="res.taxSaving.annualTaxEffect >= 0 ? '年間節税額（初年）' : '年間税負担増（初年）'"></dt>
              <dd class="font-bold" :class="res.taxSaving.annualTaxEffect >= 0 ? 'text-sky-700' : 'text-amber-700'">
                <span x-text="(res.taxSaving.annualTaxEffect >= 0 ? '+' : '') + res.taxSaving.annualTaxEffect.toFixed(1)"></span> 万円
              </dd>
            </div>
          </dl>
        </div>

        <!-- 売却内訳 -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div class="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-4" x-text="inp.sellYear + '年後 売却内訳'"></div>
          <dl class="space-y-2.5 text-sm">
            <div class="flex justify-between items-baseline">
              <dt class="text-slate-500" x-text="inp.sellYear + '年後 売却価格'"></dt>
              <dd class="font-semibold text-slate-700"><span x-text="res.exit.estimatedSalePrice.toFixed(0)"></span> 万円</dd>
            </div>
            <div class="flex justify-between items-baseline">
              <dt class="text-slate-500">残債</dt>
              <dd class="font-semibold text-slate-500">−<span x-text="res.exit.remainingLoan.toFixed(0)"></span> 万円</dd>
            </div>
            <div class="flex justify-between items-baseline" x-show="res.exit.reserveAtSale > 0">
              <dt class="text-slate-500">積立残高（回収）</dt>
              <dd class="font-semibold text-emerald-700">+<span x-text="res.exit.reserveAtSale.toFixed(0)"></span> 万円</dd>
            </div>
            <div class="flex justify-between items-baseline">
              <dt class="text-slate-500">取得費（減価償却後）</dt>
              <dd class="font-semibold text-slate-700"><span x-text="res.exit.adjustedAcquisitionCost.toFixed(0)"></span> 万円</dd>
            </div>
            <div class="flex justify-between items-baseline pl-3">
              <dt class="text-xs text-slate-500">└ 減価償却累計（控除）</dt>
              <dd class="text-xs text-amber-700">−<span x-text="res.exit.accumulatedDepreciation.toFixed(0)"></span> 万円</dd>
            </div>
            <div class="flex justify-between items-baseline">
              <dt class="text-slate-500">譲渡益</dt>
              <dd class="font-semibold" :class="res.exit.capitalGain >= 0 ? 'text-emerald-700' : 'text-slate-500'">
                <span x-text="res.exit.capitalGain.toFixed(0)"></span> 万円
              </dd>
            </div>
            <div class="flex justify-between items-baseline">
              <dt class="text-slate-500"><span x-text="res.exit.holdingType === 'long' ? '長期譲渡税(' + res.exit.capitalGainsTaxRate + '%)' : '短期譲渡税(' + res.exit.capitalGainsTaxRate + '%)'"></span></dt>
              <dd class="font-semibold text-rose-600">−<span x-text="res.exit.capitalGainsTax.toFixed(0)"></span> 万円</dd>
            </div>
            <div class="flex justify-between items-baseline border-t border-slate-100 pt-2.5">
              <dt class="font-semibold text-slate-700">売却手残り</dt>
              <dd class="font-bold text-base" :class="res.exit.netSaleProceeds >= 0 ? 'text-emerald-700' : 'text-rose-600'">
                <span x-text="res.exit.netSaleProceeds.toFixed(0)"></span> 万円
              </dd>
            </div>
          </dl>
        </div>

      </div>

      <!-- グラフ -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div class="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-4">30年間の推移</div>
        <canvas id="mainChart" height="210"></canvas>
      </div>

      <!-- 修繕スケジュール -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <div class="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-500">修繕スケジュール（30年間）</div>
          <span class="text-[11px] text-slate-500">築年数・構造種別から自動算出。高築年ほどコスト増（最大1.6倍）</span>
        </div>
        <template x-if="res.yearly.filter(y => y.repairCost > 0).length === 0">
          <p class="text-xs text-slate-500 text-center py-4">30年以内に修繕予定なし</p>
        </template>
        <div class="overflow-x-auto" x-show="res.yearly.filter(y => y.repairCost > 0).length > 0">
          <table class="w-full text-xs text-right">
            <thead>
              <tr class="text-slate-500 border-b border-slate-100">
                <th class="text-left pb-2.5 font-medium">時期</th>
                <th class="pb-2.5 font-medium">修繕種別</th>
                <th class="pb-2.5 font-medium">予定費用</th>
                <th class="pb-2.5 font-medium">積立残高(当時)</th>
                <th class="pb-2.5 font-medium">不足額</th>
                <th class="pb-2.5 font-medium text-center">充足状況</th>
              </tr>
            </thead>
            <tbody>
              <template x-for="y in res.yearly.filter(y => y.repairCost > 0)" :key="y.year">
                <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td class="py-2 text-left font-semibold text-slate-700" x-text="y.year + '年後'"></td>
                  <td class="py-2 font-medium text-slate-600" x-text="y.repairType"></td>
                  <td class="py-2 text-slate-600" x-text="y.repairCost.toFixed(0) + '万円'"></td>
                  <td class="py-2 text-sky-700" x-text="(y.reserveBalance + (y.repairCost - y.repairOutOfPocket)).toFixed(0) + '万円'"></td>
                  <td class="py-2" :class="y.repairOutOfPocket > 0 ? 'text-rose-600 font-semibold' : 'text-slate-300'"
                    x-text="y.repairOutOfPocket > 0 ? '−' + y.repairOutOfPocket.toFixed(0) + '万円' : '−'"></td>
                  <td class="py-2 text-center">
                    <span x-show="y.repairOutOfPocket === 0" class="badge-ok">積立で充当</span>
                    <span x-show="y.repairOutOfPocket > 0" class="badge-warn">要自己負担</span>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 年次テーブル -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5 overflow-x-auto">
        <div class="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-4">年次詳細</div>
        <table class="w-full text-xs text-right">
          <thead>
            <tr class="text-slate-500 border-b border-slate-100">
              <th class="text-left pb-2.5 font-medium">年</th>
              <th class="pb-2.5 font-medium">年次CF</th>
              <th class="pb-2.5 font-medium">税効果</th>
              <th class="pb-2.5 font-medium">積立残高</th>
              <th class="pb-2.5 font-medium">修繕内容</th>
              <th class="pb-2.5 font-medium">純累積CF</th>
              <th class="pb-2.5 font-medium">売却時総収益</th>
            </tr>
          </thead>
          <tbody>
            <template x-for="(y, i) in res.yearly" :key="y.year">
              <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                :class="y.year === inp.sellYear ? 'bg-emerald-50/60' : ''">
                <td class="py-2 text-left font-bold text-slate-700" x-text="y.year + '年'"></td>
                <td class="py-2 font-semibold" :class="y.annualCF >= 0 ? 'text-emerald-700' : 'text-rose-600'"
                  x-text="(y.annualCF >= 0 ? '+' : '') + y.annualCF.toFixed(1)"></td>
                <td class="py-2" :class="y.taxEffect >= 0 ? 'text-sky-700' : 'text-amber-700'"
                  x-text="(y.taxEffect >= 0 ? '+' : '') + y.taxEffect.toFixed(1)"></td>
                <td class="py-2 text-slate-500" x-text="y.reserveBalance.toFixed(1)"></td>
                <td class="py-2 text-center">
                  <template x-if="y.repairCost === 0"><span class="text-slate-300">−</span></template>
                  <template x-if="y.repairCost > 0">
                    <div>
                      <span class="font-semibold" :class="y.repairOutOfPocket > 0 ? 'text-rose-600' : 'text-slate-600'" x-text="y.repairType"></span>
                      <span class="block text-[10px] text-slate-500"
                        x-text="y.repairOutOfPocket > 0 ? '不足 −' + y.repairOutOfPocket.toFixed(0) + '万' : '積立内(' + y.repairCost.toFixed(0) + '万)'"></span>
                    </div>
                  </template>
                </td>
                <td class="py-2 font-semibold" :class="y.netCumulativeCF >= 0 ? 'text-emerald-700' : 'text-rose-600'"
                  x-text="y.netCumulativeCF.toFixed(1)"></td>
                <td class="py-2 font-semibold" x-text="calcExitForYear(y.year).toFixed(1)"
                  :class="calcExitForYear(y.year) >= 0 ? 'text-emerald-700' : 'text-rose-600'"></td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</main>

<script>
  let _chart = null;
  const DEFAULTS = ${raw(defaultJson)};

  function simApp() {
    const initialInput = ${raw(inputJson)};
    const initialResult = ${raw(resultJson)};

    return {
      inp: { ...initialInput },
      res: initialResult,

      init() {
        this.$nextTick(() => this._initChart());
      },

      update() {
        this.res = window.simulate(this.inp);
        this._syncUrl();
        this._updateChart();
      },

      _syncUrl() {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(this.inp)) {
          if (v !== DEFAULTS[k]) params.set(k, String(v));
        }
        const qs = params.toString();
        history.replaceState(null, '', qs ? '?' + qs : location.pathname);
      },

      calcExitForYear(year) {
        const r = window.simulate({ ...this.inp, sellYear: year });
        return r.exit.totalReturn;
      },

      _initChart() {
        const ctx = document.getElementById('mainChart').getContext('2d');
        _chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: this.res.yearly.map(y => y.year + '年'),
            datasets: [
              {
                label: '純累積CF',
                data: this.res.yearly.map(y => y.netCumulativeCF),
                borderColor: '#059669',
                backgroundColor: 'rgba(5,150,105,0.06)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                yAxisID: 'y',
                pointRadius: 2,
                pointHoverRadius: 5,
                pointBackgroundColor: '#059669',
              },
              {
                label: 'トータルリターン',
                data: this.res.yearly.map(y => {
                  const r = window.simulate({ ...this.inp, sellYear: y.year });
                  return r.exit.totalReturn;
                }),
                borderColor: '#0284c7',
                backgroundColor: 'rgba(2,132,199,0.05)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                yAxisID: 'y',
                pointRadius: 2,
                pointHoverRadius: 5,
                pointBackgroundColor: '#0284c7',
              },
              {
                label: 'ローン残高',
                data: this.res.yearly.map(y => y.remainingLoan),
                borderColor: '#cbd5e1',
                borderDash: [6, 3],
                borderWidth: 1.5,
                tension: 0.2,
                fill: false,
                yAxisID: 'y1',
                pointRadius: 0,
                pointHoverRadius: 4,
                pointBackgroundColor: '#94a3b8',
              }
            ]
          },
          options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  color: '#94a3b8',
                  font: { size: 11 },
                  usePointStyle: true,
                  pointStyleWidth: 14,
                  padding: 16,
                }
              },
              tooltip: {
                backgroundColor: '#fff',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                titleColor: '#0f172a',
                bodyColor: '#64748b',
                padding: 12,
                callbacks: {
                  label: ctx => {
                    const v = ctx.parsed.y;
                    const sign = v >= 0 ? '+' : '';
                    return '  ' + ctx.dataset.label + ': ' + sign + v.toLocaleString(undefined, {maximumFractionDigits:1}) + ' 万円';
                  }
                }
              }
            },
            scales: {
              y: {
                position: 'left',
                grid: { color: 'rgba(15,23,42,0.05)', drawBorder: false },
                border: { display: false },
                ticks: { font: { size: 10 }, color: '#94a3b8', callback: v => v.toLocaleString() },
                title: { display: true, text: 'CF / リターン（万円）', font: { size: 10 }, color: '#94a3b8' },
              },
              y1: {
                position: 'right',
                grid: { drawOnChartArea: false, display: false },
                border: { display: false },
                ticks: { font: { size: 10 }, color: '#cbd5e1', callback: v => v.toLocaleString() },
                title: { display: true, text: 'ローン残高（万円）', font: { size: 10 }, color: '#cbd5e1' },
              },
              x: {
                grid: { color: 'rgba(15,23,42,0.04)', drawBorder: false },
                border: { display: false },
                ticks: { font: { size: 10 }, color: '#94a3b8' }
              }
            }
          }
        });
      },

      _updateChart() {
        if (!_chart) return;
        _chart.data.datasets[0].data = this.res.yearly.map(y => y.netCumulativeCF);
        _chart.data.datasets[1].data = this.res.yearly.map(y => {
          const r = window.simulate({ ...this.inp, sellYear: y.year });
          return r.exit.totalReturn;
        });
        _chart.data.datasets[2].data = this.res.yearly.map(y => y.remainingLoan);
        _chart.update('none');
      }
    };
  }
</script>
</body>
</html>`);
});

export default app;
