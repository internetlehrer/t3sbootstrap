function echarts1_(event, container, page, temp) {
  //if (page == 0) document.getElementById("exampleModalLabel").innerHTML = event.srcElement.innerHTML;
  const data = getStatementsSuccess("answered", page, temp);
  echartSetup(container, data, temp);
}
// function: LRS query on success score of H5P interaction at page "page"
function getStatementsSuccess(verb, page, temp) {
  if (cmi5Controller[temp]) return;
  let sel = new ADL.Collection(
      getDashboardStatements(cmi5Controller.activityId, true, true)
    ),
    h5pObjectIdAndPage = handleStates.getH5pObjectIdAndPage(page);
  h5pObjectIdAndPage = h5pObjectIdAndPage[0][0];
  sel.where(
    "actor.account != 'undefined' and result.success != 'undefined' and verb.id = 'http://adlnet.gov/expapi/verbs/" +
      verb +
      "' and object.id = '" +
      h5pObjectIdAndPage +
      "'"
  );
  var sel1 = new ADL.Collection(sel);
  sel1
    .where("context.registration != '" + cmi5Controller.registration + "'")
    .count()
    .groupBy("result.success")
    .count(1)
    .select("count as userCount, data[0].count as successCounter");
  sel1 = sel1.contents;
  var sel2 = new ADL.Collection(sel);
  sel2
    .where("context.registration = '" + cmi5Controller.registration + "'")
    .count()
    .groupBy("result.success")
    .count(1)
    .select("count as userCount, data[0].count as successCounter");
  sel2 = sel2.contents;
  let su = [];
  sessionStorage.removeItem("h5ppage");
  // sessionStorage.removeItem("objectid");
  let v;
  if (sel2[0])
    v = Math.round((sel2[0].successCounter * 100) / sel2[0].userCount);
  else v = "";
  su.push({
    name: "Richtig",
    value: v
  });
  su.push({
    name: "Falsch",
    value: Math.round(
      ((sel2[0].userCount - sel2[0].successCounter) * 100) / sel2[0].userCount
    )
  });
  su.push({
    name: "Richtig Andere",
    value: Math.round((sel1[0].successCounter * 100) / sel1[0].userCount)
  });
  su.push({
    name: "Falsch Andere",
    value: Math.round(
      ((sel1[0].userCount - sel1[0].successCounter) * 100) / sel1[0].userCount
    )
  });
  cmi5Controller[temp] = su;
  return su;
}
function echartSetup(container, data_, temp) {
  if (cmi5Controller[temp]) data_ = cmi5Controller[temp];
  if (!data_) return; //{
  //userAlerts("nodata");
  //return;
  //}
  if (document.getElementById(container))
    container = document.getElementById(container);
  if (sessionStorage.getItem("cmi5No") === "false") {
    let myChart = echarts.init(container),
      option,
      data = data_,
      datax = [],
      datay = [];
    for (let i = 0; i < data.length; i++) {
      datax.push(data[i].name);
      datay.push(data[i].value);
    }
    option = {
      xAxis: {
        type: "category",
        data: datax
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: "{value} %"
        }
      },
      series: [
        {
          data: datay,
          type: "bar",
          label: {
            show: true
          },
          emphasis: {
            focus: "series"
          },
          itemStyle: {
            normal: {
              color: function (params) {
                var colorList = [
                  "#fac858",
                  "#5470c6",
                  "#fac858",
                  "#5470c6",
                  "#5470c6",
                  "#91cc75",
                  "#fac858",
                  "#ee6666"
                ];
                return colorList[params.dataIndex];
              }
            }
          }
        }
      ]
    };
    if (option && typeof option === "object") myChart.setOption(option);
    if (document.querySelector(".spinner-border"))
      document.querySelector(".spinner-border").style.display = "none";
    window.addEventListener("resize", function (event) {
      myChart.resize();
    });
  }
}
