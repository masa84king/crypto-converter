import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ArrowDownUp, Search, X, Share2, Clock, History, Check, RefreshCw, TrendingUp, Loader2, Pin, PinOff } from "lucide-react";


// ─────────────────────────────────────────
// fawazahmed0 Currency API (jsDelivr CDN)
//   ・300+通貨(法定通貨+全仮想通貨)
//   ・無料・無認証・レート制限なし・CORS完全対応
//   ・毎日更新
// ─────────────────────────────────────────
const API_PRIMARY  = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1";
const API_FALLBACK = "https://latest.currency-api.pages.dev/v1";

// ─────────────────────────────────────────
// CoinGecko API(仮想通貨のリアルタイムレート用)
//   ・5分ごとにキャッシュ更新
//   ・無料・APIキー不要
//   ・主要な仮想通貨をカバー
// ─────────────────────────────────────────
const COINGECKO_API = "https://api.coingecko.com/api/v3";

// 通貨コード → CoinGecko ID のマッピング
// (CoinGeckoは独自のIDを使うため、変換が必要)
const COINGECKO_IDS = {
  btc: "bitcoin",
  eth: "ethereum",
  usdt: "tether",
  usdc: "usd-coin",
  bnb: "binancecoin",
  xrp: "ripple",
  ada: "cardano",
  sol: "solana",
  doge: "dogecoin",
  dot: "polkadot",
  matic: "matic-network",
  ltc: "litecoin",
  trx: "tron",
  shib: "shiba-inu",
  avax: "avalanche-2",
  link: "chainlink",
  atom: "cosmos",
  uni: "uniswap",
  xlm: "stellar",
  near: "near",
  algo: "algorand",
  vet: "vechain",
  fil: "filecoin",
  icp: "internet-computer",
  hbar: "hedera-hashgraph",
  apt: "aptos",
  arb: "arbitrum",
  op: "optimism",
  mkr: "maker",
  inj: "injective-protocol",
  aave: "aave",
  pepe: "pepe",
  bch: "bitcoin-cash",
  etc: "ethereum-classic",
  ftm: "fantom",
  sand: "the-sandbox",
  mana: "decentraland",
  xmr: "monero",
  flow: "flow",
  egld: "elrond-erd-2",
  theta: "theta-token",
  axs: "axie-infinity",
  cake: "pancakeswap-token",
  rune: "thorchain",
  kas: "kaspa",
  sui: "sui",
  tia: "celestia",
  sei: "sei-network",
  jto: "jito-governance-token",
  jup: "jupiter-exchange-solana",
};

// CoinGeckoでサポートされる法定通貨(vs_currencies)
const COINGECKO_FIATS = new Set([
  "usd", "eur", "jpy", "gbp", "aud", "cad", "chf", "cny", "hkd",
  "krw", "sgd", "twd", "thb", "idr", "inr", "rub", "brl", "mxn",
  "zar", "try", "nzd", "sek", "nok", "dkk", "pln", "huf", "czk",
  "ils", "php", "myr", "vnd", "ars", "clp", "aed", "sar",
]);

// 通貨コード → 国旗/アイコン情報
// 主要法定通貨の国コード(国旗絵文字用)
const FIAT_FLAGS = {
  usd: "🇺🇸", eur: "🇪🇺", jpy: "🇯🇵", gbp: "🇬🇧", cny: "🇨🇳", krw: "🇰🇷",
  aud: "🇦🇺", cad: "🇨🇦", chf: "🇨🇭", hkd: "🇭🇰", sgd: "🇸🇬", twd: "🇹🇼",
  inr: "🇮🇳", thb: "🇹🇭", idr: "🇮🇩", php: "🇵🇭", vnd: "🇻🇳", myr: "🇲🇾",
  nzd: "🇳🇿", sek: "🇸🇪", nok: "🇳🇴", dkk: "🇩🇰", pln: "🇵🇱", czk: "🇨🇿",
  huf: "🇭🇺", rub: "🇷🇺", try: "🇹🇷", brl: "🇧🇷", mxn: "🇲🇽", zar: "🇿🇦",
  aed: "🇦🇪", sar: "🇸🇦", ils: "🇮🇱", ars: "🇦🇷", clp: "🇨🇱", cop: "🇨🇴",
  pen: "🇵🇪", egp: "🇪🇬", ngn: "🇳🇬", ken: "🇰🇪", isk: "🇮🇸", bgn: "🇧🇬",
  ron: "🇷🇴", hrk: "🇭🇷", uah: "🇺🇦", bdt: "🇧🇩", pkr: "🇵🇰", lkr: "🇱🇰",
  qar: "🇶🇦", kwd: "🇰🇼", bhd: "🇧🇭", omr: "🇴🇲", jod: "🇯🇴", mad: "🇲🇦",
  tnd: "🇹🇳", dzd: "🇩🇿", iqd: "🇮🇶", irr: "🇮🇷", yer: "🇾🇪", lbp: "🇱🇧",
  syp: "🇸🇾", afn: "🇦🇫", kzt: "🇰🇿", uzs: "🇺🇿", tjs: "🇹🇯", mnt: "🇲🇳",
  mmk: "🇲🇲", khr: "🇰🇭", lak: "🇱🇦", npr: "🇳🇵", btc: "₿", eth: "Ξ",
};

// よく使われる通貨(優先表示)
const PRIORITY = ["jpy", "usd", "eur", "gbp", "cny", "krw", "btc", "eth", "usdt", "bnb", "sol", "xrp", "usdc", "ada", "doge", "aud", "cad", "chf", "hkd", "sgd"];

// 既知の法定通貨コード(ISO 4217) - これ以外はすべて仮想通貨扱い
const FIAT_CODES = new Set(["aed","afn","all","amd","ang","aoa","ars","aud","awg","azn","bam","bbd","bdt","bgn","bhd","bif","bmd","bnd","bob","brl","bsd","btn","bwp","byn","bzd","cad","cdf","chf","clp","cny","cop","crc","cup","cve","czk","djf","dkk","dop","dzd","egp","ern","etb","eur","fjd","fkp","fok","gbp","gel","ggp","ghs","gip","gmd","gnf","gtq","gyd","hkd","hnl","hrk","htg","huf","idr","ils","imp","inr","iqd","irr","isk","jep","jmd","jod","jpy","kes","kgs","khr","kid","kmf","krw","kwd","kyd","kzt","lak","lbp","lkr","lrd","lsl","lyd","mad","mdl","mga","mkd","mmk","mnt","mop","mru","mur","mvr","mwk","mxn","myr","mzn","nad","ngn","nio","nok","npr","nzd","omr","pab","pen","pgk","php","pkr","pln","pyg","qar","ron","rsd","rub","rwf","sar","sbd","scr","sdg","sek","sgd","shp","sle","sll","sos","srd","ssp","stn","syp","szl","thb","tjs","tmt","tnd","top","try","ttd","tvd","twd","tzs","uah","ugx","usd","uyu","uzs","ves","vnd","vuv","wst","xaf","xcd","xdr","xof","xpf","yer","zar","zmw","zwl"]);

// ─────────────────────────────────────────
// 通貨ごとの小数点以下の桁数(ISO 4217 + 慣習)
//   ・3桁 = ディナール系(クウェート・バーレーン等)
//   ・0桁 = 円・韓国ウォン・ベトナムドンなど(下位単位がない通貨)
//   ・2桁 = 一般的な法定通貨(USD・EUR等)
//   ・記載なし = デフォルト2桁
// ─────────────────────────────────────────
const CURRENCY_DECIMALS = {
  // 0桁(下位単位がない/普段使わない)
  jpy: 0, krw: 0, vnd: 0, idr: 0, clp: 0, isk: 0, huf: 0,
  pyg: 0, rwf: 0, ugx: 0, xaf: 0, xof: 0, xpf: 0, kmf: 0,
  bif: 0, djf: 0, gnf: 0, vuv: 0, mga: 0,
  // 3桁(ディナール系)
  bhd: 3, iqd: 3, jod: 3, kwd: 3, lyd: 3, omr: 3, tnd: 3,
  // 4桁(超低額)
  clf: 4,
  // 仮想通貨(デフォルト)
  // ここは type === "crypto" で別処理
};

// 通貨に応じた桁数を取得(小文字code想定)
function getDecimals(code, type) {
  if (type === "crypto") return null; // crypto は別ロジック
  const c = (code || "").toLowerCase();
  return CURRENCY_DECIMALS[c] ?? 2; // デフォルト2桁
}

// 通貨記号
const SYMBOLS = {
  jpy: "¥", usd: "$", eur: "€", gbp: "£", cny: "¥", krw: "₩", inr: "₹",
  thb: "฿", vnd: "₫", php: "₱", try: "₺", ils: "₪", rub: "₽", aud: "A$",
  cad: "C$", nzd: "NZ$", sgd: "S$", hkd: "HK$", twd: "NT$", chf: "Fr",
  brl: "R$", mxn: "Mex$", zar: "R", sek: "kr", nok: "kr", dkk: "kr",
  pln: "zł", czk: "Kč", huf: "Ft", idr: "Rp", myr: "RM", aed: "د.إ",
  sar: "﷼", btc: "₿", eth: "Ξ",
};

// 日本語名
const JP_NAMES = {
  jpy: "日本円", usd: "米ドル", eur: "ユーロ", gbp: "英ポンド", cny: "中国人民元",
  krw: "韓国ウォン", aud: "豪ドル", cad: "加ドル", chf: "スイスフラン",
  hkd: "香港ドル", sgd: "シンガポールドル", twd: "台湾ドル", inr: "インドルピー",
  thb: "タイバーツ", idr: "インドネシアルピア", php: "フィリピンペソ",
  vnd: "ベトナムドン", myr: "マレーシアリンギット", nzd: "NZドル",
  sek: "スウェーデンクローナ", nok: "ノルウェークローネ", dkk: "デンマーククローネ",
  pln: "ポーランドズウォティ", czk: "チェココルナ", huf: "ハンガリーフォリント",
  rub: "ロシアルーブル", try: "トルコリラ", brl: "ブラジルレアル",
  mxn: "メキシコペソ", zar: "南アフリカランド", aed: "UAEディルハム",
  sar: "サウジリヤル", ils: "イスラエルシェケル", btc: "ビットコイン",
  eth: "イーサリアム", usdt: "テザー", bnb: "BNB", sol: "ソラナ",
  xrp: "リップル", usdc: "USDコイン", ada: "カルダノ", doge: "ドージコイン",
  avax: "アバランチ", trx: "トロン", dot: "ポルカドット",
  link: "チェーンリンク", matic: "ポリゴン", ltc: "ライトコイン",
  shib: "シバイヌ", uni: "ユニスワップ", atom: "コスモス",
  xlm: "ステラルーメン", xmr: "モネロ", near: "ニア", apt: "アプトス",
  arb: "アービトラム", op: "オプティミズム", fil: "ファイルコイン",
  bch: "ビットコインキャッシュ", etc: "イーサリアムクラシック",
  algo: "アルゴランド", vet: "ヴィチェーン", icp: "インターネットコンピューター",
};

// ─────────────────────────────────────────
// 仮想通貨アイコンのキャッシュ(メモリ内)
// 一度取得したURLは再利用してリクエスト削減
// ─────────────────────────────────────────
const iconUrlCache = new Map(); // code → resolved URL
const iconFailedSet = new Set(); // code → 全部失敗した記録

// 通貨コード→ハッシュ→ブランドカラー(フォールバック表示用)
function getBrandColor(code) {
  // よくある通貨は手動マッピング
  const brand = {
    btc: "#f7931a", eth: "#627eea", usdt: "#26a17b", usdc: "#2775ca",
    bnb: "#f3ba2f", xrp: "#23292f", ada: "#0033ad", sol: "#9945ff",
    doge: "#c3a634", dot: "#e6007a", matic: "#8247e5", ltc: "#345d9d",
    trx: "#ff060a", shib: "#ff6c39", avax: "#e84142", link: "#2a5ada",
    atom: "#5064fb", uni: "#ff007a", xlm: "#7d00ff", near: "#000000",
    algo: "#000000", fil: "#0090ff", icp: "#3b00b9", apt: "#000000",
    arb: "#28a0f0", op: "#ff0420", aave: "#b6509e", pepe: "#479e00",
    bch: "#8dc351", etc: "#328332", ftm: "#13b5ec", sand: "#00aaff",
    mana: "#ff2d55", xmr: "#ff6600", flow: "#00ef8b", theta: "#2ab8e6",
    sui: "#4ca2ff", tia: "#7b2bf9", sei: "#9e1f63", jup: "#fba03c",
    inj: "#00f2fe", kas: "#70c7ba", rune: "#33ff99", cake: "#d1884f",
    axs: "#0055d5", egld: "#1b46c2", hbar: "#000000", mkr: "#1aab9b",
  };
  if (brand[code]) return brand[code];
  // ハッシュベースのカラー(暗めのHSL)
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 45%)`;
}

// 仮想通貨の公式アイコン(cryptocurrency-icons CDN経由・SVG)
function coinIconUrl(code) {
  return `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/${code.toLowerCase()}.svg`;
}

// CoinGeckoからアイコンURLを取得(thumb サイズ:小さくて高速)
async function fetchCoingeckoIconUrl(code) {
  const id = COINGECKO_IDS[code.toLowerCase()];
  if (!id) return null;
  try {
    const r = await fetch(`${COINGECKO_API}/coins/${id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`);
    if (!r.ok) return null;
    const data = await r.json();
    return data?.image?.small || data?.image?.thumb || null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────
async function fetchJson(path) {
  try {
    const r = await fetch(`${API_PRIMARY}${path}`);
    if (r.ok) return await r.json();
  } catch {}
  const r2 = await fetch(`${API_FALLBACK}${path}`);
  if (!r2.ok) throw new Error(`API error ${r2.status}`);
  return await r2.json();
}

// CoinGeckoから仮想通貨の価格を取得(5分単位の最新データ)
async function fetchCoingeckoPrice(cryptoCode, fiatCode) {
  const id = COINGECKO_IDS[cryptoCode.toLowerCase()];
  if (!id) return null;

  const fiat = fiatCode.toLowerCase();
  if (!COINGECKO_FIATS.has(fiat)) return null;

  try {
    const url = `${COINGECKO_API}/simple/price?ids=${id}&vs_currencies=${fiat}`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    const price = data?.[id]?.[fiat];
    return (price && isFinite(price) && price > 0) ? price : null;
  } catch {
    return null;
  }
}

// CoinGeckoで両側が仮想通貨の場合(BTC→ETHなど)
async function fetchCoingeckoCryptoToCrypto(fromCode, toCode) {
  const fromId = COINGECKO_IDS[fromCode.toLowerCase()];
  const toId = COINGECKO_IDS[toCode.toLowerCase()];
  if (!fromId || !toId) return null;

  try {
    // どちらもUSD建てで取得して比率を計算
    const url = `${COINGECKO_API}/simple/price?ids=${fromId},${toId}&vs_currencies=usd`;
    const r = await fetch(url);
    if (!r.ok) return null;
    const data = await r.json();
    const fromUsd = data?.[fromId]?.usd;
    const toUsd = data?.[toId]?.usd;
    if (!fromUsd || !toUsd) return null;
    return fromUsd / toUsd;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────
export default function CryptoConverter() {
  const [now, setNow] = useState(new Date());
  const [amount, setAmount] = useState("1");       // FROM側の入力値
  const [amountTo, setAmountTo] = useState("");     // TO側の入力値
  const [editSide, setEditSide] = useState("from"); // "from" or "to" - どちらを直接編集したか
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [fee, setFee] = useState("0");
  const [feeCurrency, setFeeCurrency] = useState("to"); // "from" | "to"
  const [mode, setMode] = useState("calc"); // "calc"=自動計算 / "reverse"=手数料逆算
  const [rate, setRate] = useState(null);
  const [prevRate, setPrevRate] = useState(null); // 前回のレート(変動表示用)
  const [rateTimestamp, setRateTimestamp] = useState(null);
  const [rateSource, setRateSource] = useState(null); // "coingecko" | "fawazahmed0"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(null);
  const [history, setHistory] = useState([]);
  const [pinned, setPinned] = useState([]); // ピン留め通貨コード配列
  const [currencies, setCurrencies] = useState({}); // { code: name }
  const [initLoading, setInitLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareMenu, setShareMenu] = useState(false);
  const [flipping, setFlipping] = useState(false);

  // 時計
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // 履歴のロード(localStorage優先)
  useEffect(() => {
    (async () => {
      try {
        if (typeof localStorage !== "undefined") {
          const raw = localStorage.getItem("conv-hist-v4");
          if (raw) {
            setHistory(JSON.parse(raw));
            return;
          }
        }
        const r = await window.storage.get("conv-hist-v4");
        if (r?.value) setHistory(JSON.parse(r.value));
      } catch (e) {
        console.warn("履歴の読み込みに失敗:", e);
      }
    })();
  }, []);

  // ピン留めのロード(localStorage優先、失敗時にwindow.storageフォールバック)
  useEffect(() => {
    (async () => {
      try {
        // まずlocalStorageから直接試す(PWAで最速)
        if (typeof localStorage !== "undefined") {
          const raw = localStorage.getItem("pinned-v1");
          if (raw) {
            setPinned(JSON.parse(raw));
            return;
          }
        }
        // フォールバック:window.storage経由
        const r = await window.storage.get("pinned-v1");
        if (r?.value) setPinned(JSON.parse(r.value));
      } catch (e) {
        console.warn("ピン留めの読み込みに失敗:", e);
      }
    })();
  }, []);

  // ピン留めトグル(localStorageとwindow.storageの両方に保存)
  const togglePin = useCallback((code) => {
    setPinned(prev => {
      const next = prev.includes(code)
        ? prev.filter(c => c !== code)
        : [code, ...prev];
      const serialized = JSON.stringify(next);
      // localStorage直接保存(即時・同期)
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("pinned-v1", serialized);
        }
      } catch (e) {
        console.warn("localStorage保存失敗:", e);
      }
      // window.storage経由でも保存(Claude Artifact互換)
      if (window.storage && window.storage.set) {
        window.storage.set("pinned-v1", serialized).catch(() => {});
      }
      return next;
    });
  }, []);

  // 初期ロード:通貨一覧取得
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJson("/currencies.min.json");
        setCurrencies(data);
        // デフォルト選択
        setFrom({ code: "btc", name: data.btc || "Bitcoin", type: "crypto" });
        setTo({   code: "jpy", name: data.jpy || "Japanese yen", type: "fiat" });
      } catch (e) {
        setError("通貨リスト取得失敗");
      } finally {
        setInitLoading(false);
      }
    })();
  }, []);

  // レート取得(ハイブリッド方式)
  // 仮想通貨が絡む場合 → CoinGecko(5分単位の最新)
  // 法定通貨同士     → fawazahmed0(日次)
  const fetchRate = useCallback(async (f, t, isAutoRefresh = false) => {
    if (!f || !t) return;
    if (f.code === t.code) {
      setRate(1);
      setRateTimestamp(new Date());
      setRateSource(null);
      setError(null);
      return;
    }

    // 自動更新の場合はローディング表示しない(チラつき防止)
    if (!isAutoRefresh) setLoading(true);
    setError(null);

    try {
      let newRate = null;
      let source = null;

      // ケース1:仮想通貨 → 法定通貨(BTC → JPY 等)
      if (f.type === "crypto" && t.type === "fiat") {
        newRate = await fetchCoingeckoPrice(f.code, t.code);
        if (newRate) source = "coingecko";
      }
      // ケース2:法定通貨 → 仮想通貨(JPY → BTC 等)
      else if (f.type === "fiat" && t.type === "crypto") {
        const inverse = await fetchCoingeckoPrice(t.code, f.code);
        if (inverse && inverse > 0) {
          newRate = 1 / inverse;
          source = "coingecko";
        }
      }
      // ケース3:仮想通貨 → 仮想通貨(BTC → ETH 等)
      else if (f.type === "crypto" && t.type === "crypto") {
        newRate = await fetchCoingeckoCryptoToCrypto(f.code, t.code);
        if (newRate) source = "coingecko";
      }

      // CoinGeckoで取得できなかった場合、fawazahmed0にフォールバック
      if (!newRate) {
        const data = await fetchJson(`/currencies/${f.code}.min.json`);
        const rateMap = data[f.code];
        const r = rateMap?.[t.code];
        if (!r || !isFinite(r) || r <= 0) throw new Error("レート取得失敗");
        newRate = r;
        source = "fawazahmed0";
      }

      // 前回のレートを保存(変動矢印表示用)
      setPrevRate(prev => {
        // 同じ通貨ペアの場合のみ前回値を保持
        return rate;
      });
      setRate(newRate);
      setRateTimestamp(new Date());
      setRateSource(source);
    } catch (e) {
      setError(e.message || "通信エラー");
      if (!isAutoRefresh) setRate(null);
    } finally {
      setLoading(false);
    }
  }, [rate]);

  useEffect(() => {
    if (!from || !to) return;
    // 通貨ペアが変わったら、prevRateをリセット
    setPrevRate(null);
    const timer = setTimeout(() => fetchRate(from, to, false), 400);
    return () => clearTimeout(timer);
  }, [from, to]);

  // 自動更新:5分ごとに最新レートを取得(同じ通貨ペアの場合のみ)
  useEffect(() => {
    if (!from || !to) return;
    if (from.code === to.code) return;

    // 仮想通貨絡みなら5分、法定のみなら30分(fawazahmedは日次更新なので無駄打ちしない)
    const intervalMs = (from.type === "crypto" || to.type === "crypto")
      ? 5 * 60 * 1000   // 5分
      : 30 * 60 * 1000; // 30分

    const interval = setInterval(() => {
      fetchRate(from, to, true);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [from, to, fetchRate]);

  // 履歴保存
  const saveToHistory = useCallback((f, t) => {
    const key = `${f.type}:${f.code}→${t.type}:${t.code}`;
    const entry = { fromCode: f.code, fromType: f.type, toCode: t.code, toType: t.type, ts: Date.now() };
    setHistory(prev => {
      const filtered = prev.filter(h => `${h.fromType}:${h.fromCode}→${h.toType}:${h.toCode}` !== key);
      const next = [entry, ...filtered].slice(0, 20);
      const serialized = JSON.stringify(next);
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("conv-hist-v4", serialized);
        }
      } catch {}
      if (window.storage && window.storage.set) {
        window.storage.set("conv-hist-v4", serialized).catch(() => {});
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (rate && !error && from && to) {
      const id = setTimeout(() => saveToHistory(from, to), 1200);
      return () => clearTimeout(id);
    }
  }, [rate, error, from, to, saveToHistory]);

  const swap = () => {
    setFlipping(true);
    setTimeout(() => setFlipping(false), 350);
    setFrom(to);
    setTo(from);
    setAmount(amountTo || String(net || ""));
    setAmountTo(amount);
    setEditSide(editSide === "from" ? "to" : "from");
  };

  const clearHistory = async () => {
    setHistory([]);
    try {
      if (typeof localStorage !== "undefined") localStorage.removeItem("conv-hist-v4");
    } catch {}
    try { await window.storage.delete("conv-hist-v4"); } catch {}
  };

  // データのバックアップ(JSONをクリップボード/共有)
  const exportData = async () => {
    const data = {
      pinned,
      history,
      exportedAt: new Date().toISOString(),
      version: 1,
    };
    const json = JSON.stringify(data, null, 2);
    // Web Share APIが使えるならファイル共有、なければクリップボード
    if (navigator.share) {
      try {
        await navigator.share({
          title: "通貨換算ツール バックアップ",
          text: json,
        });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(json);
      alert("バックアップをクリップボードにコピーしました。\nメモアプリ等に貼り付けて保存してください。");
    } catch {
      // フォールバック:ダウンロード
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `currency-converter-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // データの復元(JSONを貼り付けて取り込む)
  const importData = async () => {
    const json = prompt("バックアップのJSONを貼り付けてください:");
    if (!json) return;
    try {
      const data = JSON.parse(json);
      if (Array.isArray(data.pinned)) {
        setPinned(data.pinned);
        try {
          localStorage.setItem("pinned-v1", JSON.stringify(data.pinned));
        } catch {}
      }
      if (Array.isArray(data.history)) {
        setHistory(data.history);
        try {
          localStorage.setItem("conv-hist-v4", JSON.stringify(data.history));
        } catch {}
      }
      alert(`復元しました。\nピン留め: ${data.pinned?.length || 0}件\n履歴: ${data.history?.length || 0}件`);
    } catch (e) {
      alert("JSONの読み取りに失敗しました。形式が正しいか確認してください。");
    }
  };

  // ─────────────────────────────────────────
  // 計算ロジック
  // mode = "calc"   :片方の入力 → もう片方+手数料で自動計算(従来)
  // mode = "reverse":両方の入力 → 手数料%を逆算(新機能)
  // ─────────────────────────────────────────
  let feeP, amt, net, computedFeeP;

  if (mode === "reverse") {
    // 逆算モード: 入力されたamount(FROM)とamountTo(TO)から手数料を計算
    amt = parseFloat(amount) || 0;
    net = parseFloat(amountTo) || 0;
    if (rate && amt > 0 && net > 0) {
      // gross = amt × rate(レートでの理論受取額)
      // fee% = (1 - net / gross) × 100
      const gross_ = amt * rate;
      computedFeeP = gross_ > 0 ? Math.max(0, (1 - net / gross_) * 100) : 0;
      feeP = computedFeeP;
    } else {
      feeP = 0;
      computedFeeP = 0;
    }
  } else {
    // 自動計算モード(従来通り)
    feeP = Math.max(0, Math.min(100, parseFloat(fee) || 0));
    const feeFactor = 1 - feeP / 100;
    if (editSide === "from") {
      amt = parseFloat(amount) || 0;
      net = rate ? amt * rate * feeFactor : 0;
    } else {
      net = parseFloat(amountTo) || 0;
      amt = rate && feeFactor > 0 ? net / (rate * feeFactor) : 0;
    }
  }

  const gross = rate ? amt * rate : 0; // 手数料差引き前の受取額
  // 手数料額:To通貨建て と From通貨建ての両方を計算
  const feeAmountTo = gross - net;                    // To通貨での手数料
  const feeAmountFrom = amt * (feeP / 100);           // From通貨での手数料
  const feeAmountDisplay = feeCurrency === "from" ? feeAmountFrom : feeAmountTo;
  const feeCurrencyObj = feeCurrency === "from" ? from : to;

  // 通貨に応じた桁数で整形
  // 第3引数codeが渡された場合、通貨別の桁数を採用
  const fmt = (n, type, code) => {
    if (!isFinite(n) || n === null || n === undefined) return "—";

    if (type === "crypto") {
      if (n === 0) return "0";
      if (Math.abs(n) < 0.00001) return n.toExponential(4);
      // 仮想通貨は小さい値なら最大8桁、大きい値なら最大8桁(末尾0除去)
      if (Math.abs(n) < 1) return n.toFixed(8).replace(/0+$/, "").replace(/\.$/, "");
      return n.toLocaleString("ja-JP", { maximumFractionDigits: 8 });
    }

    // 法定通貨:codeが指定されていればそれに応じた桁数、なければ2桁デフォルト
    const decimals = code ? getDecimals(code, type) : 2;
    return n.toLocaleString("ja-JP", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    });
  };

  // ─────────────────────────────────────────
  // 入力値をカンマ区切り表示するフォーマッタ
  // "1234567.89" → "1,234,567.89"
  // "1234567."   → "1,234,567."  (小数点入力中も保持)
  // ─────────────────────────────────────────
  const formatInput = (s) => {
    if (!s) return "";
    const [int, dec] = s.split(".");
    const formattedInt = int ? Number(int).toLocaleString("en-US") : "";
    if (s.includes(".")) return formattedInt + "." + (dec || "");
    return formattedInt;
  };
  // カンマを除去して数値文字列にする
  const unformatInput = (s) => (s || "").replace(/,/g, "");

  // 通貨に応じた桁数で数値を丸めて文字列化(入力欄表示用)
  // 仮想通貨は最大8桁(末尾0除去)、法定は通貨別桁数
  const roundForCurrency = (n, type, code) => {
    if (!isFinite(n) || n === null || n === undefined || n === 0) return "";
    if (type === "crypto") {
      // 仮想通貨は最大8桁、末尾の0を除去
      return String(Number(n.toFixed(8))).replace(/\.?0+$/, "");
    }
    // 法定通貨は通貨ごとの桁数
    const decimals = code ? getDecimals(code, type) : 2;
    const fixed = n.toFixed(decimals);
    // 末尾が0だけの場合は除去せず、桁数に従う
    return fixed;
  };

  const shareText = () => {
    if (!from || !to) return "";
    const dt = now.toLocaleString("ja-JP");
    return `💱 ${fmt(amt, from.type, from.code)} ${from.code.toUpperCase()} → ${fmt(net, to.type, to.code)} ${to.code.toUpperCase()}\nレート: 1 ${from.code.toUpperCase()} = ${fmt(rate, to.type, to.code)} ${to.code.toUpperCase()}\n手数料前: ${fmt(gross, to.type, to.code)} ${to.code.toUpperCase()}\n手数料: ${feeP}% (-${fmt(feeAmountDisplay, feeCurrencyObj?.type, feeCurrencyObj?.code)} ${feeCurrencyObj?.code.toUpperCase()})\n(${dt})`;
  };

  const doShare = async () => {
    const text = shareText();
    if (navigator.share) {
      try { await navigator.share({ title: "変換レート", text }); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const shareX = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText())}`, "_blank");
  const shareLine = () => window.open(`https://line.me/R/msg/text/?${encodeURIComponent(shareText())}`, "_blank");
  const shareWA = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareText())}`, "_blank");

  const dateStr = now.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" });
  const timeStr = now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  if (initLoading) {
    return (
      <div className="min-h-screen bg-white text-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
          <div className="text-sm text-zinc-400">通貨リストを取得中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900" style={{ fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-cyan-300/20 blur-3xl" />
      </div>

      <div className="relative max-w-md mx-auto px-5 pt-6 pb-32">
        <header className="mb-6">
          <div className="flex items-start justify-between mb-1">
            <div className="flex items-start gap-3">
              <img
                src="data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20512%20512%22%3E%0A%20%20%3Cdefs%3E%0A%20%20%20%20%3ClinearGradient%20id%3D%22bg%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%2334d399%22/%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23059669%22/%3E%0A%20%20%20%20%3C/linearGradient%3E%0A%20%20%20%20%3ClinearGradient%20id%3D%22gold%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fde68a%22/%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23f59e0b%22/%3E%0A%20%20%20%20%3C/linearGradient%3E%0A%20%20%20%20%3ClinearGradient%20id%3D%22silver%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23ffffff%22/%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23d4d4d8%22/%3E%0A%20%20%20%20%3C/linearGradient%3E%0A%20%20%20%20%3ClinearGradient%20id%3D%22bronze%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fdba74%22/%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23c2410c%22/%3E%0A%20%20%20%20%3C/linearGradient%3E%0A%20%20%20%20%3ClinearGradient%20id%3D%22btcGrad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23fbbf24%22/%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%23b45309%22/%3E%0A%20%20%20%20%3C/linearGradient%3E%0A%20%20%20%20%3ClinearGradient%20id%3D%22ethGrad%22%20x1%3D%220%25%22%20y1%3D%220%25%22%20x2%3D%22100%25%22%20y2%3D%22100%25%22%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%220%25%22%20stop-color%3D%22%23a78bfa%22/%3E%0A%20%20%20%20%20%20%3Cstop%20offset%3D%22100%25%22%20stop-color%3D%22%234c1d95%22/%3E%0A%20%20%20%20%3C/linearGradient%3E%0A%20%20%3C/defs%3E%0A%20%20%3Crect%20width%3D%22512%22%20height%3D%22512%22%20rx%3D%22112%22%20fill%3D%22url%28%23bg%29%22/%3E%0A%20%20%3Ccircle%20cx%3D%22256%22%20cy%3D%22256%22%20r%3D%22200%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%222%22%20opacity%3D%220.08%22/%3E%0A%20%20%3Ccircle%20cx%3D%22256%22%20cy%3D%22256%22%20r%3D%22160%22%20fill%3D%22none%22%20stroke%3D%22white%22%20stroke-width%3D%221.5%22%20opacity%3D%220.1%22/%3E%0A%20%20%3Ccircle%20cx%3D%2280%22%20cy%3D%22120%22%20r%3D%224%22%20fill%3D%22white%22%20opacity%3D%220.4%22/%3E%0A%20%20%3Ccircle%20cx%3D%22440%22%20cy%3D%22100%22%20r%3D%223%22%20fill%3D%22white%22%20opacity%3D%220.4%22/%3E%0A%20%20%3Ccircle%20cx%3D%22460%22%20cy%3D%22400%22%20r%3D%223%22%20fill%3D%22white%22%20opacity%3D%220.35%22/%3E%0A%20%20%3Ccircle%20cx%3D%2270%22%20cy%3D%22390%22%20r%3D%224%22%20fill%3D%22white%22%20opacity%3D%220.35%22/%3E%0A%20%20%3Ccircle%20cx%3D%22150%22%20cy%3D%2270%22%20r%3D%222.5%22%20fill%3D%22white%22%20opacity%3D%220.5%22/%3E%0A%20%20%3Ccircle%20cx%3D%22400%22%20cy%3D%22450%22%20r%3D%222.5%22%20fill%3D%22white%22%20opacity%3D%220.4%22/%3E%0A%20%20%3Cg%20transform%3D%22translate%28256%2C%20256%29%22%3E%0A%20%20%20%20%3Cellipse%20cx%3D%220%22%20cy%3D%22120%22%20rx%3D%22110%22%20ry%3D%2214%22%20fill%3D%22black%22%20opacity%3D%220.15%22/%3E%0A%20%20%20%20%3Ccircle%20cx%3D%220%22%20cy%3D%220%22%20r%3D%22115%22%20fill%3D%22url%28%23btcGrad%29%22%20stroke%3D%22%2392400e%22%20stroke-width%3D%224%22/%3E%0A%20%20%20%20%3Ccircle%20cx%3D%220%22%20cy%3D%220%22%20r%3D%22100%22%20fill%3D%22none%22%20stroke%3D%22%23fef3c7%22%20stroke-width%3D%222%22%20opacity%3D%220.5%22/%3E%0A%20%20%20%20%3Cellipse%20cx%3D%22-30%22%20cy%3D%22-40%22%20rx%3D%2245%22%20ry%3D%2230%22%20fill%3D%22white%22%20opacity%3D%220.25%22/%3E%0A%20%20%20%20%3Ctext%20x%3D%220%22%20y%3D%2245%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%22165%22%20font-weight%3D%22900%22%20fill%3D%22white%22%3E%E2%82%BF%3C/text%3E%0A%20%20%3C/g%3E%0A%20%20%3Cg%20transform%3D%22translate%28110%2C%20130%29%20rotate%28-12%29%22%3E%0A%20%20%20%20%3Cellipse%20cx%3D%220%22%20cy%3D%2255%22%20rx%3D%2252%22%20ry%3D%227%22%20fill%3D%22black%22%20opacity%3D%220.12%22/%3E%0A%20%20%20%20%3Ccircle%20cx%3D%220%22%20cy%3D%220%22%20r%3D%2255%22%20fill%3D%22url%28%23silver%29%22%20stroke%3D%22%2371717a%22%20stroke-width%3D%223%22/%3E%0A%20%20%20%20%3Ccircle%20cx%3D%220%22%20cy%3D%220%22%20r%3D%2247%22%20fill%3D%22none%22%20stroke%3D%22%23e4e4e7%22%20stroke-width%3D%221.5%22%20opacity%3D%220.7%22/%3E%0A%20%20%20%20%3Cellipse%20cx%3D%22-15%22%20cy%3D%22-20%22%20rx%3D%2222%22%20ry%3D%2214%22%20fill%3D%22white%22%20opacity%3D%220.6%22/%3E%0A%20%20%20%20%3Ctext%20x%3D%220%22%20y%3D%2222%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2275%22%20font-weight%3D%22900%22%20fill%3D%22%233f3f46%22%3E%C2%A5%3C/text%3E%0A%20%20%3C/g%3E%0A%20%20%3Cg%20transform%3D%22translate%28410%2C%20120%29%20rotate%2815%29%22%3E%0A%20%20%20%20%3Cellipse%20cx%3D%220%22%20cy%3D%2250%22%20rx%3D%2248%22%20ry%3D%226%22%20fill%3D%22black%22%20opacity%3D%220.12%22/%3E%0A%20%20%20%20%3Ccircle%20cx%3D%220%22%20cy%3D%220%22%20r%3D%2250%22%20fill%3D%22url%28%23gold%29%22%20stroke%3D%22%23a16207%22%20stroke-width%3D%223%22/%3E%0A%20%20%20%20%3Ccircle%20cx%3D%220%22%20cy%3D%220%22%20r%3D%2243%22%20fill%3D%22none%22%20stroke%3D%22%23fef3c7%22%20stroke-width%3D%221.5%22%20opacity%3D%220.6%22/%3E%0A%20%20%20%20%3Cellipse%20cx%3D%22-12%22%20cy%3D%22-18%22%20rx%3D%2220%22%20ry%3D%2212%22%20fill%3D%22white%22%20opacity%3D%220.5%22/%3E%0A%20%20%20%20%3Ctext%20x%3D%220%22%20y%3D%2220%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2268%22%20font-weight%3D%22900%22%20fill%3D%22%2378350f%22%3E%24%3C/text%3E%0A%20%20%3C/g%3E%0A%20%20%3Cg%20transform%3D%22translate%28420%2C%20400%29%20rotate%28-10%29%22%3E%0A%20%20%20%20%3Cellipse%20cx%3D%220%22%20cy%3D%2245%22%20rx%3D%2242%22%20ry%3D%225%22%20fill%3D%22black%22%20opacity%3D%220.12%22/%3E%0A%20%20%20%20%3Ccircle%20cx%3D%220%22%20cy%3D%220%22%20r%3D%2245%22%20fill%3D%22url%28%23ethGrad%29%22%20stroke%3D%22%233b0764%22%20stroke-width%3D%223%22/%3E%0A%20%20%20%20%3Ccircle%20cx%3D%220%22%20cy%3D%220%22%20r%3D%2238%22%20fill%3D%22none%22%20stroke%3D%22%23ddd6fe%22%20stroke-width%3D%221.5%22%20opacity%3D%220.6%22/%3E%0A%20%20%20%20%3Cellipse%20cx%3D%22-10%22%20cy%3D%22-15%22%20rx%3D%2218%22%20ry%3D%2210%22%20fill%3D%22white%22%20opacity%3D%220.4%22/%3E%0A%20%20%20%20%3Cg%20fill%3D%22white%22%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%22M%200%20-22%20L%2015%203%20L%200%2012%20L%20-15%203%20Z%22%20opacity%3D%220.95%22/%3E%0A%20%20%20%20%20%20%3Cpath%20d%3D%22M%200%2016%20L%2015%207%20L%200%2030%20L%20-15%207%20Z%22%20opacity%3D%220.8%22/%3E%0A%20%20%20%20%3C/g%3E%0A%20%20%3C/g%3E%0A%20%20%3Cg%20transform%3D%22translate%2895%2C%20395%29%20rotate%2812%29%22%3E%0A%20%20%20%20%3Cellipse%20cx%3D%220%22%20cy%3D%2248%22%20rx%3D%2246%22%20ry%3D%226%22%20fill%3D%22black%22%20opacity%3D%220.12%22/%3E%0A%20%20%20%20%3Ccircle%20cx%3D%220%22%20cy%3D%220%22%20r%3D%2248%22%20fill%3D%22url%28%23bronze%29%22%20stroke%3D%22%237c2d12%22%20stroke-width%3D%223%22/%3E%0A%20%20%20%20%3Ccircle%20cx%3D%220%22%20cy%3D%220%22%20r%3D%2241%22%20fill%3D%22none%22%20stroke%3D%22%23fed7aa%22%20stroke-width%3D%221.5%22%20opacity%3D%220.6%22/%3E%0A%20%20%20%20%3Cellipse%20cx%3D%22-12%22%20cy%3D%22-16%22%20rx%3D%2219%22%20ry%3D%2211%22%20fill%3D%22white%22%20opacity%3D%220.45%22/%3E%0A%20%20%20%20%3Ctext%20x%3D%220%22%20y%3D%2220%22%20text-anchor%3D%22middle%22%20font-family%3D%22Arial%2C%20sans-serif%22%20font-size%3D%2265%22%20font-weight%3D%22900%22%20fill%3D%22%23431407%22%3E%E2%82%AC%3C/text%3E%0A%20%20%3C/g%3E%0A%20%20%3Cg%20fill%3D%22white%22%3E%0A%20%20%20%20%3Cpath%20d%3D%22M%20180%2090%20L%20184%20100%20L%20194%20104%20L%20184%20108%20L%20180%20118%20L%20176%20108%20L%20166%20104%20L%20176%20100%20Z%22%20opacity%3D%220.85%22/%3E%0A%20%20%20%20%3Cpath%20d%3D%22M%20340%20420%20L%20343%20428%20L%20351%20431%20L%20343%20434%20L%20340%20442%20L%20337%20434%20L%20329%20431%20L%20337%20428%20Z%22%20opacity%3D%220.8%22/%3E%0A%20%20%20%20%3Cpath%20d%3D%22M%2060%20260%20L%2062%20266%20L%2068%20268%20L%2062%20270%20L%2060%20276%20L%2058%20270%20L%2052%20268%20L%2058%20266%20Z%22%20opacity%3D%220.7%22/%3E%0A%20%20%3C/g%3E%0A%3C/svg%3E%0A"
                alt="通貨換算ツール"
                className="w-12 h-12 rounded-2xl shadow-md shrink-0"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-emerald-600/90 mb-1">
                  CURRENCY EXCHANGE TOOL
                </div>
                <h1 className="text-2xl font-black tracking-tight leading-none">
                  通貨換算ツール<span className="text-emerald-600">.</span>
                </h1>
                <div className="text-[10px] text-zinc-500 mt-1">
                  {Object.keys(currencies).length}種の通貨対応
                </div>
              </div>
            </div>
            <div className="text-right" style={{ fontFamily: "'JetBrains Mono', 'SF Mono', monospace" }}>
              <div className="flex items-center justify-end gap-1 text-[11px] text-zinc-500">
                <Clock className="w-3 h-3" /> LIVE
              </div>
              <div className="text-xs text-zinc-500">{dateStr}</div>
              <div className="text-lg tabular-nums text-emerald-600 font-bold">{timeStr}</div>
            </div>
          </div>
        </header>

        <div className={`bg-white border border-zinc-200 rounded-3xl p-5 shadow-xl shadow-zinc-200/60 transition-transform duration-300 ${flipping ? "scale-[0.98]" : ""}`}>
          {/* モード切り替え */}
          <div className="mb-4 flex gap-1 p-1 bg-zinc-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMode("calc")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                mode === "calc" ? "bg-white shadow text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              💱 自動計算
            </button>
            <button
              type="button"
              onClick={() => setMode("reverse")}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
                mode === "reverse" ? "bg-white shadow text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              🔍 手数料逆算
            </button>
          </div>

          {mode === "reverse" && (
            <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
              💡 <strong>逆算モード</strong>:両方の金額を入力すると、自動的に手数料を計算します
            </div>
          )}

          {/* FROM */}
          <CurrencyRow
            label="支払う (FROM)"
            currency={from}
            onPick={() => setPickerOpen("from")}
            rightContent={
              <>
                <input
                  type="text"
                  inputMode="decimal"
                  value={
                    mode === "reverse"
                      ? formatInput(amount)
                      : (editSide === "from"
                        ? formatInput(amount)
                        : (amt > 0 ? formatInput(roundForCurrency(amt, from?.type, from?.code)) : ""))
                  }
                  onFocus={(e) => {
                    if (mode === "calc" && editSide !== "from") {
                      setAmount(amt > 0 ? roundForCurrency(amt, from?.type, from?.code) : "");
                      setEditSide("from");
                    }
                    setTimeout(() => e.target.select(), 0);
                  }}
                  onChange={e => {
                    if (mode === "calc") setEditSide("from");
                    setAmount(unformatInput(e.target.value).replace(/[^0-9.]/g, ""));
                  }}
                  className={`flex-1 bg-transparent text-right text-2xl font-bold outline-none tabular-nums w-0 min-w-0 ${mode === "reverse" || editSide === "from" ? "text-zinc-900" : "text-emerald-600"}`}
                  placeholder="0"
                />
                {((editSide === "from" && amount) || (editSide !== "from" && amt > 0)) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAmount("");
                      setAmountTo("");
                      setEditSide("from");
                    }}
                    className="shrink-0 p-1 rounded-full hover:bg-zinc-200 active:bg-zinc-300 transition"
                    aria-label="クリア"
                  >
                    <X className="w-4 h-4 text-zinc-400" />
                  </button>
                )}
              </>
            }
          />

          <div className="flex justify-center -my-1 relative z-10">
            <button
              type="button"
              onClick={swap}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-90 transition text-white p-2.5 rounded-full shadow-lg shadow-emerald-600/30"
              aria-label="入れ替え"
            >
              <ArrowDownUp className="w-4 h-4" />
            </button>
          </div>

          {/* TO */}
          <CurrencyRow
            label="受け取る (TO)"
            currency={to}
            onPick={() => setPickerOpen("to")}
            rightContent={
              loading ? (
                <div className="flex-1 text-right">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-400 ml-auto inline-block" />
                </div>
              ) : error ? (
                <div className="flex-1 text-right">
                  <button type="button" onClick={() => fetchRate(from, to)} className="text-red-600 text-sm inline-flex items-center gap-1 hover:text-red-500">
                    <RefreshCw className="w-4 h-4" /> 再試行
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={
                      mode === "reverse"
                        ? formatInput(amountTo)
                        : (editSide === "to"
                          ? formatInput(amountTo)
                          : (net > 0 ? formatInput(roundForCurrency(net, to?.type, to?.code)) : ""))
                    }
                    onFocus={(e) => {
                      if (mode === "calc" && editSide !== "to") {
                        setAmountTo(net > 0 ? roundForCurrency(net, to?.type, to?.code) : "");
                        setEditSide("to");
                      }
                      setTimeout(() => e.target.select(), 0);
                    }}
                    onChange={e => {
                      if (mode === "calc") setEditSide("to");
                      setAmountTo(unformatInput(e.target.value).replace(/[^0-9.]/g, ""));
                    }}
                    className={`flex-1 bg-transparent text-right text-2xl font-bold outline-none tabular-nums w-0 min-w-0 ${mode === "reverse" || editSide === "to" ? "text-zinc-900" : "text-emerald-600"}`}
                    placeholder="0"
                  />
                  {((editSide === "to" && amountTo) || (editSide !== "to" && net > 0)) && (
                    <button
                      type="button"
                      onClick={() => {
                        setAmount("");
                        setAmountTo("");
                        setEditSide("to");
                      }}
                      className="shrink-0 p-1 rounded-full hover:bg-zinc-200 active:bg-zinc-300 transition"
                      aria-label="クリア"
                    >
                      <X className="w-4 h-4 text-zinc-400" />
                    </button>
                  )}
                </>
              )
            }
          />

          {/* 手数料 */}
          <div className={`mt-4 border rounded-2xl p-4 ${mode === "reverse" ? "bg-amber-50 border-amber-200" : "bg-zinc-50 border-zinc-200"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                {mode === "reverse" ? "計算された手数料 FEE" : "手数料 FEE"}
              </span>
              <span className="text-[11px] text-zinc-500 tabular-nums truncate ml-2">
                -{fmt(feeAmountDisplay, feeCurrencyObj?.type, feeCurrencyObj?.code)} {feeCurrencyObj?.code.toUpperCase()}
              </span>
            </div>

            {mode === "reverse" ? (
              // 逆算モード:スライダー無効・大きく結果表示
              <div className="flex items-baseline justify-center gap-2 py-2">
                <span className="text-4xl font-black tabular-nums text-amber-700">
                  {feeP > 0 ? feeP.toFixed(2) : "—"}
                </span>
                <span className="text-2xl font-bold text-amber-600">%</span>
              </div>
            ) : (
              // 自動計算モード:スライダー操作可能
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0" max="10" step="0.1"
                  value={fee}
                  onChange={e => setFee(e.target.value)}
                  className="flex-1 accent-emerald-600"
                />
                <div className="flex items-center bg-zinc-100 rounded-lg px-2 py-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={fee}
                    onChange={e => setFee(e.target.value.replace(/[^0-9.]/g, ""))}
                    className="bg-transparent w-12 text-right text-sm font-bold outline-none tabular-nums"
                  />
                  <span className="text-zinc-500 text-sm">%</span>
                </div>
              </div>
            )}

            {/* 手数料の表示通貨トグル */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-200">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">表示通貨</span>
              <div className="flex gap-1 p-0.5 bg-zinc-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFeeCurrency("from")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition ${
                    feeCurrency === "from"
                      ? "bg-emerald-600 text-white"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {from && <CurrencyIcon code={from.code} type={from.type} size={14} />}
                  {from?.code.toUpperCase()}
                </button>
                <button
                  type="button"
                  onClick={() => setFeeCurrency("to")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition ${
                    feeCurrency === "to"
                      ? "bg-emerald-600 text-white"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {to && <CurrencyIcon code={to.code} type={to.type} size={14} />}
                  {to?.code.toUpperCase()}
                </button>
              </div>
            </div>

            {/* 計算の内訳:手数料前 → 手数料 → 手数料後 */}
            {rate && !error && gross > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-200 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">手数料前</span>
                  <span className="tabular-nums text-zinc-700 font-semibold">
                    {fmt(feeCurrency === "from" ? amt : gross, feeCurrencyObj?.type, feeCurrencyObj?.code)} {feeCurrencyObj?.code.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">手数料 ({feeP}%)</span>
                  <span className="tabular-nums text-red-600 font-semibold">
                    -{fmt(feeAmountDisplay, feeCurrencyObj?.type, feeCurrencyObj?.code)} {feeCurrencyObj?.code.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-dashed border-zinc-300">
                  <span className="text-zinc-500 font-semibold">手数料後</span>
                  <span className="tabular-nums text-emerald-600 font-bold">
                    {fmt(feeCurrency === "from" ? amt - feeAmountFrom : net, feeCurrencyObj?.type, feeCurrencyObj?.code)} {feeCurrencyObj?.code.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between px-1 text-[11px]">
            <span className="flex items-center gap-1 text-zinc-500">
              <TrendingUp className="w-3 h-3" /> レート
            </span>
            <span className="tabular-nums text-zinc-700 truncate ml-2 flex items-center gap-1">
              {loading ? "取得中..." : error ? (
                <span className="text-red-600">{error}</span>
              ) : rate && from && to ? (
                <>
                  1 {from.code.toUpperCase()} = <span className="text-emerald-600 font-semibold">{fmt(rate, to.type, to.code)}</span> {to.code.toUpperCase()}
                  {/* 変動矢印(前回レートとの比較) */}
                  {prevRate && prevRate !== rate && (
                    <span className={`ml-1 text-[10px] font-bold ${rate > prevRate ? "text-emerald-600" : "text-red-500"}`}>
                      {rate > prevRate ? "▲" : "▼"}
                      {Math.abs(((rate - prevRate) / prevRate) * 100).toFixed(2)}%
                    </span>
                  )}
                </>
              ) : "—"}
            </span>
          </div>
          {rateTimestamp && !loading && !error && (
            <div className="flex items-center justify-between mt-1 px-1 text-[10px] text-zinc-400 tabular-nums">
              <span className="flex items-center gap-1.5">
                {/* データソースバッジ */}
                {rateSource === "coingecko" && (
                  <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                    🔴 LIVE
                  </span>
                )}
                {rateSource === "fawazahmed0" && (
                  <span className="bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-semibold border border-zinc-200">
                    日次
                  </span>
                )}
              </span>
              <span className="flex items-center gap-2">
                <span>更新: {rateTimestamp.toLocaleTimeString("ja-JP")}</span>
                <button
                  type="button"
                  onClick={() => fetchRate(from, to, false)}
                  disabled={loading}
                  className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition"
                  aria-label="今すぐ更新"
                  title="今すぐ更新"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                </button>
              </span>
            </div>
          )}
        </div>

        {/* ワンタップピン留めボタン */}
        {from && to && from.code !== to.code && (
          <div className="mt-3 flex gap-2">
            {/* FROM側のピン留め */}
            <button
              type="button"
              onClick={() => togglePin(from.code)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-xs transition border ${
                pinned.includes(from.code)
                  ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                  : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-amber-200"
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${pinned.includes(from.code) ? "fill-amber-500 text-amber-500" : ""}`} />
              <CurrencyIcon code={from.code} type={from.type} size={16} />
              <span>{from.code.toUpperCase()}</span>
              <span className="text-[10px] text-zinc-400">
                {pinned.includes(from.code) ? "ピン留め済み" : "ピン留め"}
              </span>
            </button>
            {/* TO側のピン留め */}
            <button
              type="button"
              onClick={() => togglePin(to.code)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-xs transition border ${
                pinned.includes(to.code)
                  ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
                  : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-amber-200"
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${pinned.includes(to.code) ? "fill-amber-500 text-amber-500" : ""}`} />
              <CurrencyIcon code={to.code} type={to.type} size={16} />
              <span>{to.code.toUpperCase()}</span>
              <span className="text-[10px] text-zinc-400">
                {pinned.includes(to.code) ? "ピン留め済み" : "ピン留め"}
              </span>
            </button>
          </div>
        )}

        {/* 共有 */}
        <div className="mt-5 relative">
          <button
            type="button"
            onClick={() => setShareMenu(s => !s)}
            disabled={!rate}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-200 disabled:text-zinc-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
          >
            {copied ? <><Check className="w-5 h-5" /> コピーしました</> : <><Share2 className="w-5 h-5" /> 結果を共有</>}
          </button>
          {shareMenu && rate && (
            <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-zinc-200 rounded-2xl p-2 shadow-2xl z-20 grid grid-cols-4 gap-2">
              <button type="button" onClick={() => { doShare(); setShareMenu(false); }} className="flex flex-col items-center gap-1 p-2 hover:bg-zinc-100 rounded-xl">
                <Share2 className="w-5 h-5" /><span className="text-[10px]">共有</span>
              </button>
              <button type="button" onClick={() => { shareX(); setShareMenu(false); }} className="flex flex-col items-center gap-1 p-2 hover:bg-zinc-100 rounded-xl">
                <span className="w-5 h-5 font-black text-sm flex items-center justify-center">𝕏</span><span className="text-[10px]">X</span>
              </button>
              <button type="button" onClick={() => { shareLine(); setShareMenu(false); }} className="flex flex-col items-center gap-1 p-2 hover:bg-zinc-100 rounded-xl">
                <span className="w-5 h-5 font-black text-[10px] flex items-center justify-center bg-green-500 text-white rounded">LINE</span><span className="text-[10px]">LINE</span>
              </button>
              <button type="button" onClick={() => { shareWA(); setShareMenu(false); }} className="flex flex-col items-center gap-1 p-2 hover:bg-zinc-100 rounded-xl">
                <span className="w-5 h-5 font-black text-[10px] flex items-center justify-center bg-emerald-600 text-white rounded">WA</span><span className="text-[10px]">WhatsApp</span>
              </button>
            </div>
          )}
        </div>

        {/* 履歴 */}
        {history.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center gap-2 mb-3 px-1">
              <History className="w-4 h-4 text-zinc-500" />
              <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">履歴</h2>
              <span className="ml-auto text-[10px] text-zinc-400">{history.length}件</span>
              <button type="button" onClick={clearHistory} className="text-[10px] text-zinc-500 hover:text-red-600 underline">消去</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {history.map(h => {
                const name = currencies[h.fromCode];
                const name2 = currencies[h.toCode];
                if (!name || !name2) return null;
                const f = { code: h.fromCode, name, type: h.fromType };
                const t = { code: h.toCode, name: name2, type: h.toType };
                return (
                  <button
                    type="button"
                    key={`${h.fromCode}-${h.toCode}-${h.ts}`}
                    onClick={() => { setFrom(f); setTo(t); }}
                    className="bg-white hover:bg-zinc-50 active:bg-zinc-100 border border-zinc-200 shadow-sm px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition"
                  >
                    <CurrencyIcon code={h.fromCode} type={h.fromType} size={16} />
                    <span className="font-bold">{h.fromCode.toUpperCase()}</span>
                    <span className="text-zinc-500">→</span>
                    <CurrencyIcon code={h.toCode} type={h.toType} size={16} />
                    <span className="font-bold text-emerald-600">{h.toCode.toUpperCase()}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ピン留め状況の表示&バックアップ */}
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
              保存済みデータ
            </h2>
          </div>
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">ピン留め</span>
              <span className="font-bold text-zinc-900 tabular-nums">{pinned.length} 件</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">変換履歴</span>
              <span className="font-bold text-zinc-900 tabular-nums">{history.length} 件</span>
            </div>
            {pinned.length > 0 && (
              <div className="pt-2 border-t border-zinc-100">
                <div className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1.5">ピン留め中</div>
                <div className="flex flex-wrap gap-1.5">
                  {pinned.slice(0, 20).map(code => (
                    <div key={code} className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg text-[11px]">
                      <CurrencyIcon
                        code={code}
                        type={FIAT_CODES.has(code) ? "fiat" : "crypto"}
                        size={14}
                      />
                      <span className="font-bold">{code.toUpperCase()}</span>
                      <button
                        type="button"
                        onClick={() => togglePin(code)}
                        className="text-amber-600 hover:text-red-500 ml-0.5"
                        aria-label="ピン留めを外す"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-2 border-t border-zinc-100 flex gap-2">
              <button
                type="button"
                onClick={exportData}
                className="flex-1 text-[11px] text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 py-2 rounded-lg font-semibold transition"
              >
                📥 バックアップ
              </button>
              <button
                type="button"
                onClick={importData}
                className="flex-1 text-[11px] text-cyan-700 hover:text-cyan-800 bg-cyan-50 hover:bg-cyan-100 py-2 rounded-lg font-semibold transition"
              >
                📤 復元
              </button>
            </div>
            <div className="text-[10px] text-zinc-400 text-center pt-1">
              スマホのホーム画面に追加した後もデータは保持されます
            </div>
          </div>
        </section>

        <footer className="mt-10 text-center text-[10px] text-zinc-400 space-y-1">
          <div>Data: fawazahmed0 Currency API (jsDelivr CDN)</div>
          <div>Icons: cryptocurrency-icons · 参考値</div>
          <div className="tabular-nums pt-1">
            {now.toISOString().replace("T", " ").slice(0, 19)} UTC
          </div>
        </footer>
      </div>

      {pickerOpen && (
        <CurrencyPicker
          currencies={currencies}
          pinned={pinned}
          togglePin={togglePin}
          onClose={() => setPickerOpen(null)}
          onPick={(c) => {
            if (pickerOpen === "from") setFrom(c); else setTo(c);
            setPickerOpen(null);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────
function CurrencyIcon({ code, type, size = 24 }) {
  const lower = code.toLowerCase();
  const [stage, setStage] = useState(() => {
    // キャッシュ済みなら最終解決URLから開始
    if (iconUrlCache.has(lower)) return "resolved";
    if (iconFailedSet.has(lower)) return "fallback";
    return "primary"; // cryptocurrency-icons CDN
  });
  const [coingeckoUrl, setCoingeckoUrl] = useState(null);

  if (type === "fiat") {
    // 国旗絵文字
    const flag = FIAT_FLAGS[lower];
    if (flag) {
      return (
        <span style={{ fontSize: size * 0.9, lineHeight: 1 }} className="inline-flex items-center justify-center">
          {flag}
        </span>
      );
    }
    // フォールバック:コード文字
    return (
      <div
        className="rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {code.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  // ─── 仮想通貨:多段フォールバック ───
  // 1. cryptocurrency-icons CDN(高速・主要通貨)
  // 2. CoinGecko API(マイナー通貨)
  // 3. ブランドカラーの丸 + 文字(最終)

  const handlePrimaryError = async () => {
    // CoinGeckoから取得を試みる(非同期)
    const url = await fetchCoingeckoIconUrl(lower);
    if (url) {
      iconUrlCache.set(lower, url);
      setCoingeckoUrl(url);
      setStage("coingecko");
    } else {
      iconFailedSet.add(lower);
      setStage("fallback");
    }
  };

  // ステージごとにレンダリング
  if (stage === "primary") {
    return (
      <img
        src={coinIconUrl(lower)}
        alt={code}
        width={size}
        height={size}
        className="rounded-full"
        onError={handlePrimaryError}
      />
    );
  }

  if (stage === "resolved") {
    // キャッシュから取得済みURLを使用
    return (
      <img
        src={iconUrlCache.get(lower)}
        alt={code}
        width={size}
        height={size}
        className="rounded-full"
        onError={() => {
          iconUrlCache.delete(lower);
          iconFailedSet.add(lower);
          setStage("fallback");
        }}
      />
    );
  }

  if (stage === "coingecko" && coingeckoUrl) {
    return (
      <img
        src={coingeckoUrl}
        alt={code}
        width={size}
        height={size}
        className="rounded-full"
        onError={() => {
          iconFailedSet.add(lower);
          setStage("fallback");
        }}
      />
    );
  }

  // 最終フォールバック:ブランドカラー丸 + 文字
  const color = getBrandColor(lower);
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        backgroundColor: color,
      }}
    >
      {code.slice(0, code.length <= 4 ? code.length : 3).toUpperCase()}
    </div>
  );
}

// ─────────────────────────────────────────
function CurrencyRow({ label, currency, onPick, rightContent }) {
  if (!currency) return null;
  const displayName = JP_NAMES[currency.code] || currency.name;
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</span>
        <span className={`text-[10px] ${currency.type === "crypto" ? "text-emerald-600" : "text-cyan-600"}`}>
          ● {currency.type === "crypto" ? "CRYPTO" : "FIAT"}
        </span>
      </div>
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onPick}
          className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-zinc-900 px-2.5 py-2 rounded-xl transition shrink-0"
        >
          <CurrencyIcon code={currency.code} type={currency.type} size={22} />
          <span className="font-bold text-sm">{currency.code.toUpperCase()}</span>
          <span className="text-zinc-500 text-xs">▾</span>
        </button>
        {rightContent}
      </div>
      <div className="text-right mt-1 px-1 text-[11px] text-zinc-500 truncate">{displayName}</div>
    </div>
  );
}

// ─────────────────────────────────────────
function CurrencyPicker({ currencies, pinned = [], togglePin, onClose, onPick }) {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  const pinnedSet = useMemo(() => new Set(pinned), [pinned]);
  // ピン留めした順番を保持したMap
  const pinnedOrder = useMemo(() => {
    const m = new Map();
    pinned.forEach((code, i) => m.set(code, i));
    return m;
  }, [pinned]);

  // 全通貨を配列化
  const allItems = useMemo(() => {
    const items = Object.entries(currencies).map(([code, name]) => ({
      code,
      name,
      jpName: JP_NAMES[code],
      type: FIAT_CODES.has(code) ? "fiat" : "crypto",
    }));
    // ソート優先順位: 1.ピン留め(登録順) 2.PRIORITY 3.アルファベット
    items.sort((a, b) => {
      const ap = pinnedOrder.has(a.code);
      const bp = pinnedOrder.has(b.code);
      if (ap && bp) return pinnedOrder.get(a.code) - pinnedOrder.get(b.code);
      if (ap) return -1;
      if (bp) return 1;
      const ai = PRIORITY.indexOf(a.code);
      const bi = PRIORITY.indexOf(b.code);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.code.localeCompare(b.code);
    });
    return items;
  }, [currencies, pinnedOrder]);

  const fiats = useMemo(() => allItems.filter(x => x.type === "fiat"), [allItems]);
  const cryptos = useMemo(() => allItems.filter(x => x.type === "crypto"), [allItems]);

  const pool = tab === "fiat" ? fiats : tab === "crypto" ? cryptos : allItems;
  const query = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!query) return pool.slice(0, 300);
    return pool.filter(c =>
      c.code.includes(query) ||
      (c.name || "").toLowerCase().includes(query) ||
      (c.jpName || "").toLowerCase().includes(query)
    ).slice(0, 300);
  }, [pool, query]);

  // ピン留めセクションとその他で区切って表示するための分割
  const pinnedItems = filtered.filter(c => pinnedSet.has(c.code));
  const otherItems = filtered.filter(c => !pinnedSet.has(c.code));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-900/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white border-t border-zinc-200 rounded-t-3xl shadow-2xl w-full max-w-md flex flex-col"
        style={{ height: "90vh" }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold">通貨を選択 <span className="text-xs text-zinc-500 font-normal">({allItems.length}種)</span></h3>
            <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-900 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 bg-zinc-50 rounded-xl px-3 py-3 border border-zinc-200 focus-within:border-emerald-600 transition mb-3">
            <Search className="w-5 h-5 text-emerald-600" />
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="BTC, ビットコイン, 円, yen..."
              className="flex-1 bg-transparent outline-none text-base"
              autoComplete="off"
            />
            {q && (
              <button type="button" onClick={() => setQ("")} className="text-zinc-500 hover:text-zinc-900">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl">
            <TabBtn active={tab === "all"}    onClick={() => setTab("all")}>すべて ({allItems.length})</TabBtn>
            <TabBtn active={tab === "crypto"} onClick={() => setTab("crypto")}>仮想 ({cryptos.length})</TabBtn>
            <TabBtn active={tab === "fiat"}   onClick={() => setTab("fiat")}>法定 ({fiats.length})</TabBtn>
          </div>

          {pinned.length > 0 && !query && (
            <div className="mt-2 text-[10px] text-zinc-500 flex items-center gap-1">
              <Pin className="w-3 h-3 text-amber-500 fill-amber-500" />
              ピン留め {pinned.length}件 を上位表示中
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center text-zinc-500 py-8 text-sm">
              「{q}」に一致する通貨がありません
            </div>
          ) : (
            <>
              {/* ピン留めセクション */}
              {pinnedItems.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-amber-50/70 border-b border-amber-100 text-[10px] uppercase tracking-widest text-amber-700 font-bold flex items-center gap-1.5">
                    <Pin className="w-3 h-3 fill-amber-600 text-amber-600" />
                    ピン留め
                  </div>
                  {pinnedItems.map(c => (
                    <PickerItem
                      key={`pin-${c.code}`}
                      item={c}
                      pinned={true}
                      onPick={onPick}
                      onTogglePin={togglePin}
                    />
                  ))}
                </>
              )}

              {/* その他セクション */}
              {otherItems.length > 0 && (
                <>
                  {pinnedItems.length > 0 && (
                    <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-100 text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                      すべての通貨
                    </div>
                  )}
                  {otherItems.map(c => (
                    <PickerItem
                      key={c.code}
                      item={c}
                      pinned={false}
                      onPick={onPick}
                      onTogglePin={togglePin}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ピッカーの各行コンポーネント
function PickerItem({ item: c, pinned, onPick, onTogglePin }) {
  const jp = JP_NAMES[c.code];
  const sym = SYMBOLS[c.code];
  return (
    <div className={`flex items-center border-b border-zinc-100 transition ${pinned ? "bg-amber-50/30" : "hover:bg-zinc-50"}`}>
      <button
        type="button"
        onClick={() => onPick(c)}
        className="flex-1 px-4 py-3 flex items-center gap-3 text-left min-w-0 active:bg-zinc-100"
      >
        <div className="shrink-0">
          <CurrencyIcon code={c.code} type={c.type} size={32} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">{c.code.toUpperCase()}</span>
            {sym && <span className="text-xs text-zinc-500">{sym}</span>}
            <span className={`text-[9px] px-1.5 py-0.5 rounded ${c.type === "crypto" ? "bg-emerald-100 text-emerald-700" : "bg-cyan-100 text-cyan-700"}`}>
              {c.type === "crypto" ? "CRYPTO" : "FIAT"}
            </span>
          </div>
          <div className="text-xs text-zinc-500 truncate mt-0.5">
            {jp || c.name}
            {jp && c.name && jp !== c.name ? <span className="text-zinc-400"> · {c.name}</span> : null}
          </div>
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onTogglePin(c.code); }}
        className={`shrink-0 p-3 mr-1 rounded-full transition ${
          pinned
            ? "text-amber-500 hover:bg-amber-100"
            : "text-zinc-300 hover:text-amber-500 hover:bg-amber-50"
        }`}
        aria-label={pinned ? "ピン留めを外す" : "ピン留め"}
      >
        <Pin className={`w-5 h-5 ${pinned ? "fill-amber-500" : ""}`} />
      </button>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${active ? "bg-emerald-600 text-white" : "text-zinc-500 hover:text-zinc-900"}`}
    >
      {children}
    </button>
  );
}
