export interface MonthlyBusinessCycleIndicatorPoint {
  year: number; // 西元年
  month: number; // 1-12
  leadingIndexComposite: number | null; // 領先指標綜合指數
  leadingIndexDetrended: number | null; // 領先指標不含趨勢指數
  coincidentIndexComposite: number | null; // 同時指標綜合指數
  coincidentIndexDetrended: number | null; // 同時指標不含趨勢指數
  laggingIndexComposite: number | null; // 落後指標綜合指數
  laggingIndexDetrended: number | null; // 落後指標不含趨勢指數
  signalScore: number | null; // 景氣對策信號綜合分數
  signalLight: string | null; // 景氣對策信號燈號文字原文，例如 "紅"/"黃紅"/"綠"/"黃藍"/"藍"
}
