const curatedSymbols = [
  'AAPL','ACN','ADBE','ADSK','AMD','AMAT','AMGN','AMZN','AVGO','AXP','BAC','BLK','BMY','BRK-B',
  'C','CAT','CMCSA','COST','CRM','CSCO','CVS','CVX','DIS','DOW','EOG','FIS','FISV','FTNT','GOOGL',
  'GS','HD','HON','IBM','INTC','INTU','KLAC','KO','LLY','LRCX','MCD','META','MRK','MS','MSFT','MU',
  'NVDA','NKE','NOW','ORCL','PANW','PEP','PFE','PG','PLTR','PM','PNC','QCOM','REGN','RF','SCHW',
  'SLB','SNOW','SPGI','STT','SYK','TFC','TMO','TXN','UBER','USB','V','VLO','VRTX','WFC','WMT','XOM',
  'MMM','AOS','ABT','ABBV','AES','AFL','A','APD','ABNB','AKAM','ALB','ARE','ALGN','ALLE','LNT','ALL','GOOG','MO','AMCR','AEE','AEP','AIG','AMT','AWK','AMP','AME','APH','ADI','AON','APA','APO','APP','APTV','ACGL','ADM','ARES','ANET','AJG','AIZ','T','ATO','ADP','AZO','AVB','AVY','AXON','BKR','BALL','BAX','BDX','BRK.B','BBY','TECH','BIIB','BX','XYZ','BNY','BA','BKNG','BSX','BR','BRO','BF.B','BLDR','BG','BXP','CHRW','CDNS','CPT','COF','CAH','CCL','CARR','CVNA','CASY','CBOE','CBRE','CDW','COR','CNC','CNP','CF','CRL','CHTR','CMG','CB','CHD','CIEN','CI','CINF','CTAS','CFG','CLX','CME','CMS','CTSH','COHR','COIN','CL','FIX','COP','ED','STZ','CEG','COO','CPRT','GLW','CPAY','CTVA','CSGP','CRH','CRWD','CCI','CSX','CMI','DHR','DRI','DDOG','DVA','DECK','DE','DELL','DAL','DVN','DXCM','FANG','DLR','DG','DLTR','D','DPZ','DASH','DOV','DHI','DTE','DUK','DD','ETN','EBAY','ECHO','ECL','EIX','EW','EA','ELV','EME','EMR','ETR','EQT','EFX','EQIX','EQR','ERIE','ESS','EL','EG','EVRG','ES','EXC','EXE','EXPE','EXPD','EXR','FFIV','FDS','FICO','FAST','FRT','FDX','FDXF','FITB','FSLR','FE','FLEX','F','FTV','FOXA','FOX','BEN','FCX','GRMN','IT','GE','GEHC','GEV','GEN','GNRC','GD','GIS','GM','GPC','GILD','GPN','GL','GDDY','HAL','HIG','HAS','HCA','DOC'
];

function getCuratedSymbolSet() {
  return [...curatedSymbols];
}

module.exports = { curatedSymbols, getCuratedSymbolSet };
