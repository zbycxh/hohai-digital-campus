// assets/charts.js — 学科雷达图（演示数据）
(function () {
  var el = document.getElementById('chart-radar');
  if (!el || typeof echarts === 'undefined') return;

  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim() || '#0B6E99';
  var accent2 = style.getPropertyValue('--accent2').trim() || '#22C08A';
  var ink = style.getPropertyValue('--ink').trim() || '#0E2431';
  var muted = style.getPropertyValue('--muted').trim() || '#5C7787';
  var rule = style.getPropertyValue('--rule').trim() || '#DCEAF2';

  var chart = echarts.init(el, null, { renderer: 'svg' });

  chart.setOption({
    animation: false,
    color: [accent, accent2],
    tooltip: { appendToBody: true },
    legend: {
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 8,
      textStyle: { color: muted, fontSize: 12 }
    },
    radar: {
      center: ['50%', '46%'],
      radius: '64%',
      indicator: [
        { name: '水文水资源', max: 100 },
        { name: '水环境 · 生态', max: 100 },
        { name: '水安全', max: 100 },
        { name: '港口海岸 · 海洋', max: 100 },
        { name: '土木 · 交通 · 能源', max: 100 },
        { name: '智能 · 信息', max: 100 }
      ],
      axisName: { color: muted, fontSize: 11.5 },
      splitLine: { lineStyle: { color: rule } },
      axisLine: { lineStyle: { color: rule } },
      splitArea: {
        areaStyle: { color: ['#FFFFFF', '#F7FCFE'] }
      }
    },
    series: [{
      type: 'radar',
      symbolSize: 5,
      lineStyle: { width: 2 },
      areaStyle: { opacity: 0.16 },
      data: [
        {
          value: [96, 86, 90, 84, 78, 62],
          name: '传统优势方向',
          itemStyle: { color: accent },
          areaStyle: { color: accent, opacity: 0.14 }
        },
        {
          value: [70, 82, 76, 66, 64, 94],
          name: '新兴交叉方向',
          itemStyle: { color: accent2 },
          areaStyle: { color: accent2, opacity: 0.14 }
        }
      ]
    }]
  });

  window.addEventListener('resize', function () { chart.resize(); });
})();
