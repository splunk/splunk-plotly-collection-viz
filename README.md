# Plotly.js Custom Vizualization Project - Splunk SE Summer Internship 2018
The plotly.js visualization library packaged as a Splunk application to expose the charts via the Splunk Custom Visualization Framework


Tamar A. Zamba -  Lead Developer 
SE Intern, Plano, TX

Tyler Muth - Project Manager
Analytics Architect,  Washington, D.C. 

This modular visualization app includes:
1. Candlestick/OHLC Chart -  for Stocks and Financial Data.    [Candlestick/OHLC source code](https://github.com/tmuth/plotly_custom_viz_splunk/blob/master/appserver/static/visualizations/candlestick_chart/src/visualization_source.js)

Sample SPL Search for Candlestick/OHLC:

```sh
| makeresults count=60
| streamstats count
| eval _time=_time-(count*3600)
| eval open=(random() %50) + 1
| eval sign=if((random() %2)==0,"-","+")
| eval close=(((random() %20)/100)*open)
| eval close=sign+close
| eval close=round(close+open,1)
| eval high=if(open > close,(open*.1)+open,(close*.1)+close)
| eval low=if(open < close,open-(open*.1),close-(close*.1))
| fields - sign,count
```

2. Box Plot Chart - for displaying Statistical Data.    [BoxPlot source code](https://github.com/tmuth/plotly_custom_viz_splunk/blob/master/appserver/static/visualizations/boxplot/src/visualization_source.js)

Sample SPL Search for BoxPlot:

```sh
| makeresults count=100
| streamstats count as group_num
| eval group_num = ((group_num-1) % 5)+1
| eval y=random() %51
| fields - _time
```

