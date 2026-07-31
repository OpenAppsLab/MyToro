const curatedSymbols = [
  'AAPL','ACN','ADBE','ADSK','AMD','AMAT','AMGN','AMZN','AVGO','AXP','BAC','BLK','BMY','BRK-B',
  'C','CAT','CMCSA','COST','CRM','CSCO','CVS','CVX','DIS','DOW','EOG','FIS','FISV','FTNT','GOOGL',
  'GS','HD','HON','IBM','INTC','INTU','KLAC','KO','LLY','LRCX','MCD','META','MRK','MS','MSFT','MU',
  'NVDA','NKE','NOW','ORCL','PANW','PEP','PFE','PG','PLTR','PM','PNC','QCOM','REGN','RF','SCHW',
  'SLB','SNOW','SPGI','STT','SYK','TFC','TMO','TXN','UBER','USB','V','VLO','VRTX','WFC','WMT','XOM'
];

function getCuratedSymbolSet() {
  return [...curatedSymbols];
}

module.exports = { curatedSymbols, getCuratedSymbolSet };
