function echarts31_(event, container) {
  container = document.getElementById(container);
  let data = getStatementsSelection("progressed");
  echartSetup(container, data);
}
// function: LRS query on visits of current page, on progress (pages visited) and on duration at current page
function getStatementsSelection(verb, page) {
  let sel = new ADL.Collection(
      getDashboardStatements(cmi5Controller.activityId, true, true)
    ),
    actorAccount = cmi5Controller.agent.account;

  sel
    .where(
      "actor.account != 'undefined' and result.response != 'undefined' and verb.id = 'http://adlnet.gov/expapi/verbs/" +
        verb +
        "' and context.extensions[https://w3id.org/xapi/acrossx/activities/page] = '" +
        location.pathname +
        "'"
    )
    .groupBy("actor.account.name")
    .count()
    .max(
      "result.extensions[https://w3id.org/xapi/cmi5/result/extensions/progress]"
    )
    .sum("result.duration");

  sel = sel.contents;
  //console.log(sel);
  cmi5Controller.st = [];
  cmi5Controller.st.pr = [];
  cmi5Controller.st.vi = [];
  cmi5Controller.st.du = [];
  for (let i = 0, s, d = 0, users; i < sel.length; i++) {
    if (sel[i].group === actorAccount.name) users = "Me and myself";
    else users = "User " + (i + 1);

    cmi5Controller.st.pr.push({
      name: users,
      value: sel[i].max
    });
    cmi5Controller.st.vi.push({
      name: users,
      value: sel[i].count
    });

    s = sel[i].sum.split("PT");
    for (let j = 1; j < s.length; j++) {
      d += moment.duration("PT" + s[j]);
    }
    cmi5Controller.st.du.push({
      name: users,
      value: (d / 1000).toFixed(1)
    });
  }
  cmi5Controller.st.vi.sort((a, b) => (a.name > b.name ? 1 : -1));
  cmi5Controller.st.pr.sort((a, b) => (a.name > b.name ? 1 : -1));
  cmi5Controller.st.du.sort((a, b) => (a.name > b.name ? 1 : -1));
}
function echartSetup(container, data_) {
  let myChart = echarts.init(container),
    option;
  option = {
    tooltip: {
      trigger: "item"
    },
    legend: {
      top: "5%",
      left: "center"
    },
    series: [
      {
        name: "Access From",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2,
          color: function (params) {
            var colorList = [
              "#fac858",
              "#5470c6",
              "#5470c6",
              "#5470c6",
              "#5470c6",
              "#5470c6",
              "#5470c6",
              "#5470c6"
            ];
            return colorList[params.dataIndex];
          }
        },
        label: {
          show: false,
          position: "center"
        },
        emphasis: {
          label: {
            show: true,
            fontSize: "40",
            fontWeight: "bold"
          }
        },
        labelLine: {
          show: false
        },
        data: cmi5Controller.st.vi
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
