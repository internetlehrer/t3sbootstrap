function echarts2_(event, container, page, temp) {
  //if (page == 0) document.getElementById("exampleModalLabel").innerHTML = event.srcElement.innerHTML;
  let data = getStatementsSelection("interacted", page, temp);
  echartSetup(container, data, temp);
}

// function: LRS query on result of poll of H5P interaction at page "page"
function getStatementsSelection(verb, page, temp) {
  if (cmi5Controller[temp]) return;

  let sel = new ADL.Collection(
      getDashboardStatements(cmi5Controller.activityId, true, true)
    ),
    h5pObjectIdAndPage = handleStates.getH5pObjectIdAndPage(page),
    choices = [];
  h5pObjectIdAndPage = h5pObjectIdAndPage[0][0];
  sessionStorage.removeItem("h5ppage");
  // sessionStorage.removeItem("objectid");

  sel
    .where(
      "actor.account != 'undefined' and result.response != 'undefined' and verb.id = 'http://adlnet.gov/expapi/verbs/" +
        verb +
        "' and object.id = '" +
        h5pObjectIdAndPage +
        "'"
    )
    .count()
    .groupBy("result.response")
    .count(1)
    .select("data as response");
  sel = sel.contents[0].response;
  let t = 0;
  for (let i = 0; i < sel.length; i++) {
    t += sel[i].count;
  }
  let v;
  if (sel[0]) v = Math.round((sel[0].count * 100) / t);
  else v = "";
  choices.push({
    name: "Wusste es",
    value: v
  });
  if (sel[1]) v = Math.round((sel[1].count * 100) / t);
  else v = "";
  choices.push({
    name: "Dachte, er weiß",
    value: v
  });
  if (sel[2]) v = Math.round((sel[2].count * 100) / t);
  else v = "";
  choices.push({
    name: "Nicht sicher",
    value: v
  });
  if (sel[3]) v = Math.round((sel[3].count * 100) / t);
  else v = "";
  choices.push({
    name: "Keine Ahnung",
    value: v
  });
  cmi5Controller[temp] = choices;
  return choices;
}

function echartSetup(container, data_, temp) {
  if (cmi5Controller[temp]) data_ = cmi5Controller[temp];
  if (!data_) return;
  if (document.getElementById(container))
    container = document.getElementById(container);
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
            //  Random display
            //color:function(d){return "#"+Math.floor(Math.random()*(256*256*256-1)).toString(16);}
            //  Custom display (in order)
            color: function (params) {
              var colorList = ["#fac858", "#5470c6", "#91cc75", "#ee6666"];
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
